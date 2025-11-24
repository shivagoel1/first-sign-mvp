import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { validateArticlesOnRetrieval } from '@/lib/articles/article-agent'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    // Reduced logging - only log errors and important events
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let assessmentId: string
    try {
      const resolvedParams = await params
      assessmentId = resolvedParams.assessmentId
    } catch (paramsError) {
      console.error('[parent-storybook-api] Error resolving params:', paramsError)
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      )
    }

    // Fetch the latest ai_report for this assessment
    // Use a join with assessments to ensure RLS allows access
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(
        `
        id,
        assessment_results (
          ai_report,
          parent_pdf_url,
          parent_visible,
          created_at,
          reviewed_at
        )
      `
      )
      .eq('id', assessmentId)
      .maybeSingle()

    if (assessmentError) {
      console.error('[parent-storybook-api] Assessment query error:', assessmentError)
      return NextResponse.json(
        { error: 'Assessment query failed', details: assessmentError.message },
        { status: 500 }
      )
    }

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    const result = Array.isArray(assessment.assessment_results)
      ? assessment.assessment_results[0]
      : assessment.assessment_results

    if (!result) {
      return NextResponse.json(
        { error: 'Assessment results not found' },
        { status: 404 }
      )
    }

    if (!result.parent_visible) {
      return NextResponse.json(
        { error: 'Storybook not available' },
        { status: 403 }
      )
    }

    // Use reviewed_at if available, otherwise use created_at as a fallback for cache-busting
    const updatedAt = result.reviewed_at || result.created_at

    // Parse and validate articles in ai_report
    let validatedAiReport = result.ai_report
    if (result.ai_report) {
      try {
        const parsed = typeof result.ai_report === 'string' 
          ? JSON.parse(result.ai_report) 
          : result.ai_report
        
        if (parsed && parsed.pages && Array.isArray(parsed.pages)) {
          // Validate articles in each page
          const validatedPages = await Promise.all(
            parsed.pages.map(async (page: any) => {
              if (page.recommended_articles && Array.isArray(page.recommended_articles) && page.recommended_articles.length > 0) {
                const validatedArticles = await validateArticlesOnRetrieval(page.recommended_articles)
                return {
                  ...page,
                  recommended_articles: validatedArticles,
                }
              }
              return page
            })
          )
          
          validatedAiReport = {
            ...parsed,
            pages: validatedPages,
          }
          
          console.log(`[parent-storybook-api] Validated articles for ${assessmentId}: filtered broken URLs`)
        }
      } catch (parseError) {
        console.error('[parent-storybook-api] Error parsing/validating ai_report:', parseError)
        // Continue with original ai_report if validation fails
      }
    }

    return NextResponse.json(
      {
        ai_report: validatedAiReport,
        parent_pdf_url: result.parent_pdf_url,
        updated_at: updatedAt,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('[parent-storybook-api] Unhandled error:', error)
    console.error('[parent-storybook-api] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Unable to load storybook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

