import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ParentDashboardClient, {
  AssessmentRecord,
  ChildRecord,
} from './parent-dashboard-client'

// Force dynamic rendering to prevent caching of assessment status
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ParentDashboardData = {
  profile: {
    full_name: string | null
  } | null
  children: ChildRecord[]
}

async function loadDashboard(): Promise<ParentDashboardData> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const { user } = session

  if (!user) {
    redirect('/login')
  }

  // Check user role - redirect physicians to their dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'physician') {
    redirect('/dashboard/physician')
  }

  const { data: childrenRows } = await supabase
    .from('children')
    .select('id, child_name, date_of_birth, gender')
    .eq('parent_id', user.id)
    .eq('is_deleted', false)
    .order('child_name')

  const children: ChildRecord[] = []

  for (const child of childrenRows ?? []) {
    // Query assessments with assessment_results join
    // Use left join to include assessments even if assessment_results don't exist yet
    const { data: assessmentsRows, error: assessmentsError } = await supabase
      .from('assessments')
      .select(
        `
          id,
          completed_at,
          assessment_results (
            status,
            parent_visible,
            parent_pdf_url,
            ai_report
          )
        `
      )
      .eq('child_id', child.id)
      .order('completed_at', { ascending: false })

    if (assessmentsError) {
      console.error(
        '[parent-dashboard] Error fetching assessments for child',
        child.id,
        ':',
        assessmentsError
      )
    }

    const formattedAssessments: AssessmentRecord[] =
      assessmentsRows?.map((row) => {
        // Handle both array and single object responses from Supabase
        const result = Array.isArray(row.assessment_results)
          ? row.assessment_results[0]
          : row.assessment_results

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[parent-dashboard] Assessment ${row.id}:`,
            'status=',
            result?.status,
            'parent_visible=',
            result?.parent_visible
          )
        }

        return {
          id: row.id,
          completed_at: row.completed_at,
          status: result?.status ?? null,
          parent_visible: result?.parent_visible ?? null,
          parent_pdf_url: result?.parent_pdf_url ?? null,
          ai_report: result?.ai_report ?? null,
        }
      }) ?? []

    children.push({
      id: child.id,
      child_name: child.child_name,
      date_of_birth: child.date_of_birth,
      gender: child.gender,
      assessments: formattedAssessments,
    })
  }

  return { profile: profile ?? null, children }
}

export default async function ParentDashboardPage() {
  const data = await loadDashboard()

  return (
    <main className="min-h-screen">
      <ParentDashboardClient {...data} />
    </main>
  )
}

