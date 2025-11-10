import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import ParentDashboardClient, {
  AssessmentRecord,
  ChildRecord,
} from './parent-dashboard-client'

type ParentDashboardData = {
  profile: {
    full_name: string | null
  } | null
  children: ChildRecord[]
}

async function loadDashboard(): Promise<ParentDashboardData> {
  const supabase = await createClient()

  const {
    data: {
      session: { user },
    },
  } = await supabase.auth.getSession()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const { data: childrenRows } = await supabase
    .from('children')
    .select('id, child_name, date_of_birth, gender')
    .eq('parent_id', user.id)
    .eq('is_deleted', false)
    .order('child_name')

  const children: ChildRecord[] = []

  for (const child of childrenRows ?? []) {
    const { data: assessmentsRows } = await supabase
      .from('assessments')
      .select(
        `
          id,
          completed_at,
          assessment_results!left (
            status,
            parent_visible,
            parent_pdf_url,
            ai_report
          )
        `
      )
      .eq('child_id', child.id)
      .order('completed_at', { ascending: false })

    const formattedAssessments: AssessmentRecord[] =
      assessmentsRows?.map((row) => ({
        id: row.id,
        completed_at: row.completed_at,
        status: row.assessment_results?.[0]?.status ?? null,
        parent_visible: row.assessment_results?.[0]?.parent_visible ?? null,
        parent_pdf_url: row.assessment_results?.[0]?.parent_pdf_url ?? null,
        ai_report: row.assessment_results?.[0]?.ai_report ?? null,
      })) ?? []

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

