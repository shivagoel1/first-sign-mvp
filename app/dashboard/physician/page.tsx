import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PhysicianHeaderWithSidebar } from './header-with-sidebar'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'
import { PhysicianDashboardWrapper } from './dashboard-wrapper'
import {
  DashboardStats,
  PendingReview,
  PhysicianInfo,
  ReviewedAssessment,
} from './dashboard-client'

type ReviewedRow = {
  id: string
  assessment_id: string
  status: string | null
  reviewed_at: string | null
  assessments: {
    child: {
      child_name: string
    } | null
    completed_at: string | null
  } | null
}

function formatAverageReviewTime(rows: ReviewedRow[]): string {
  const intervals = rows
    .map((row) => {
      if (!row.reviewed_at || !row.assessments?.completed_at) return null
      const reviewedAt = new Date(row.reviewed_at).getTime()
      const completedAt = new Date(row.assessments.completed_at).getTime()
      if (Number.isNaN(reviewedAt) || Number.isNaN(completedAt)) return null
      return Math.max(reviewedAt - completedAt, 0)
    })
    .filter((value): value is number => value !== null)

  if (!intervals.length) return '--'

  const averageMs = intervals.reduce((acc, value) => acc + value, 0) / intervals.length
  const hours = Math.round(averageMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  if (days > 0) {
    return `${days}d ${remainingHours}h`
  }
  return `${hours}h`
}

export const dynamic = 'force-dynamic'

export default async function PhysicianDashboardPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[physician-dashboard] getUser error:', userError)
      redirect('/physician/login')
    }

    if (!user) {
      console.log('[physician-dashboard] No user found, redirecting to login')
      redirect('/physician/login')
    }

    const userId = user.id
    console.log('[physician-dashboard] User ID:', userId)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('[physician-dashboard] Profile lookup error:', profileError)
      console.error('[physician-dashboard] Error details:', JSON.stringify(profileError, null, 2))
      redirect('/physician/login')
    }

    if (!profile) {
      console.error('[physician-dashboard] No profile found for user:', userId)
      redirect('/physician/login')
    }

    console.log('[physician-dashboard] Profile found:', { role: profile.role, email: profile.email })

    if (profile.role !== 'physician') {
      console.error('[physician-dashboard] Wrong role:', profile.role, 'Expected: physician')
      redirect('/physician/login')
    }

    const physician: PhysicianInfo = {
      id: userId,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
    }

    const admin = createAdminClient()

    const { data: pendingRows, error: pendingError } = await admin
      .from('assessment_results')
      .select(`
        id,
        assessment_id,
        red_flag_count,
        ai_processing_status,
        ai_processing_progress,
        ai_report,
        created_at,
        assessments (
          id,
          completed_at,
          child:children!assessments_child_id_fkey (
            child_name,
            date_of_birth
          ),
          parent_profile:profiles!assessments_parent_id_fkey (
            full_name,
            email
          )
        )
      `)
      .eq('status', 'awaiting_review')
      .order('created_at', { ascending: false })

    if (pendingError) {
      console.error('[physician-dashboard] Pending reviews query error:', pendingError)
    }

    const pendingReviews: PendingReview[] =
      (pendingRows as any[] | null)?.map((row) => ({
        assessmentResultId: row.id,
        assessmentId: row.assessment_id,
        childName: row.assessments?.child?.child_name ?? 'Child',
        childDob: row.assessments?.child?.date_of_birth ?? '',
        parentName: row.assessments?.parent_profile?.full_name ?? null,
        parentEmail: row.assessments?.parent_profile?.email ?? null,
        completedAt: row.assessments?.completed_at ?? null,
        redFlagCount: row.red_flag_count ?? 0,
        aiProcessingStatus: row.ai_processing_status ?? null,
        aiProcessingProgress: row.ai_processing_progress ?? null,
        aiReport: row.ai_report ?? null,
        createdAt: row.created_at ?? null,
      })) ?? []

    const { data: reviewedRows, error: reviewedError } = await admin
      .from('assessment_results')
      .select(`
        id,
        assessment_id,
        status,
        reviewed_at,
        assessments (
          completed_at,
          child:children!assessments_child_id_fkey (
            child_name
          )
        )
      `)
      .eq('reviewed_by', userId)
      .not('reviewed_at', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(8)

    if (reviewedError) {
      console.error('[physician-dashboard] Reviewed assessments query error:', reviewedError)
    }

    const recentlyReviewed: ReviewedAssessment[] =
      (reviewedRows as ReviewedRow[] | null)?.map((row) => ({
        assessmentResultId: row.id,
        assessmentId: row.assessment_id,
        childName: row.assessments?.child?.child_name ?? 'Child',
        status: row.status,
        reviewedAt: row.reviewed_at,
      })) ?? []

    const { count: approvedCount, error: countError } = await supabase
      .from('assessment_results')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('reviewed_by', userId)

    if (countError) {
      console.error('[physician-dashboard] Approved count query error:', countError)
    }

    const stats: DashboardStats = {
      pendingReviews: pendingReviews.length,
      approvedAssessments: approvedCount ?? 0,
      averageReviewTime: formatAverageReviewTime((reviewedRows as ReviewedRow[] | null) ?? []),
    }

    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col">
          <PhysicianHeaderWithSidebar />
          <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)', marginTop: '64px', position: 'relative' }}>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
              <PhysicianDashboardWrapper
                stats={stats}
                physician={physician}
                pendingReviews={pendingReviews}
                recentlyReviewed={recentlyReviewed}
              />
            </Suspense>
          </div>
        </div>
      </SidebarProvider>
    )
  } catch (error) {
    // Next.js redirect() throws a special error that should not be caught
    // Check if this is a redirect error and re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = String((error as any).digest)
      if (digest.includes('NEXT_REDIRECT')) {
        throw error // Re-throw redirect errors so Next.js can handle them
      }
    }
    console.error('[physician-dashboard] Unhandled error:', error)
    redirect('/physician/login')
  }
}


