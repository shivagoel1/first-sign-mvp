import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ParentHeaderWithSidebar } from '../header-with-sidebar'
import { DashboardWrapper } from '../dashboard-wrapper'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

type StorybookData = {
  profile: {
    full_name: string | null
  } | null
  children: Array<{
    id: string
    child_name: string
    date_of_birth: string
    gender: string | null
    assessments: Array<{
      id: string
      completed_at: string | null
      status: string | null
      parent_visible: boolean | null
      parent_pdf_url: string | null
      ai_report: string | null
    }>
  }>
}

async function loadStorybooksData(): Promise<StorybookData> {
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

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'physician') {
    redirect('/dashboard/physician')
  }

  // Load all children with their assessments
  const { data: childrenRows } = await supabase
    .from('children')
    .select('id, child_name, date_of_birth, gender')
    .eq('parent_id', user.id)
    .eq('is_deleted', false)
    .order('child_name')

  const children = []

  for (const child of childrenRows ?? []) {
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
        '[storybooks] Error fetching assessments for child',
        child.id,
        ':',
        assessmentsError
      )
    }

    const formattedAssessments =
      assessmentsRows?.map((row) => {
        const result = Array.isArray(row.assessment_results)
          ? row.assessment_results[0]
          : row.assessment_results

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

export default async function AllStorybooksPage() {
  const data = await loadStorybooksData()

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col">
        <ParentHeaderWithSidebar />
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <DashboardWrapper {...data} showStorybooks={true} />
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  )
}

