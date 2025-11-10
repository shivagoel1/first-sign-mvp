import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PhysicianDashboardClient, {
  DashboardStats,
  PendingReview,
  PhysicianInfo,
  ReviewedAssessment,
} from './physician-dashboard-client'

type PendingRow = {
  id: string
  assessment_id: string
  red_flag_count: number | null
  assessments: {
    id: string
    completed_at: string | null
    child: {
      child_name: string
      date_of_birth: string
    } | null
    parent_profile: {
      full_name: string | null
      email: string | null
    } | null
  } | null
}

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

export default async function PhysicianDashboardPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/physician-login')
  }

  const userId = session.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role !== 'physician') {
    redirect('/physician-login')
  }

  const physician: PhysicianInfo = {
    id: userId,
    fullName: profile?.full_name ?? null,
    email: profile?.email ?? null,
  }

  const admin = createAdminClient()

  const { data: pendingRows } = await admin
    .from('assessment_results')
    .select(`
      id,
      assessment_id,
      red_flag_count,
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

  const pendingReviews: PendingReview[] =
    (pendingRows as PendingRow[] | null)?.map((row) => ({
      assessmentResultId: row.id,
      assessmentId: row.assessment_id,
      childName: row.assessments?.child?.child_name ?? 'Child',
      childDob: row.assessments?.child?.date_of_birth ?? '',
      parentName: row.assessments?.parent_profile?.full_name ?? null,
      parentEmail: row.assessments?.parent_profile?.email ?? null,
      completedAt: row.assessments?.completed_at ?? null,
      redFlagCount: row.red_flag_count ?? 0,
    })) ?? []

  const { data: reviewedRows } = await admin
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

  const recentlyReviewed: ReviewedAssessment[] =
    (reviewedRows as ReviewedRow[] | null)?.map((row) => ({
      assessmentResultId: row.id,
      assessmentId: row.assessment_id,
      childName: row.assessments?.child?.child_name ?? 'Child',
      status: row.status,
      reviewedAt: row.reviewed_at,
    })) ?? []

  const { count: approvedCount } = await supabase
    .from('assessment_results')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .eq('reviewed_by', userId)

  const stats: DashboardStats = {
    pendingReviews: pendingReviews.length,
    approvedAssessments: approvedCount ?? 0,
    averageReviewTime: formatAverageReviewTime((reviewedRows as ReviewedRow[] | null) ?? []),
  }

  return (
    <main className="min-h-screen">
      <PhysicianDashboardClient
        stats={stats}
        physician={physician}
        pendingReviews={pendingReviews}
        recentlyReviewed={recentlyReviewed}
      />
    </main>
  )
}


