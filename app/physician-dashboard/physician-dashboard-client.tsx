'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, ClipboardCheck, FlagTriangleRight, Mail, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PhysicianReviewModal, AssessmentDetail } from '@/components/physician/review-modal'

type ReviewAction = 'approve' | 'needs_revision' | 'rejected'

export type DashboardStats = {
  pendingReviews: number
  approvedAssessments: number
  averageReviewTime: string
}

export type PhysicianInfo = {
  id: string
  fullName: string | null
  email: string | null
}

export type PendingReview = {
  assessmentResultId: string
  assessmentId: string
  childName: string
  childDob: string
  parentName: string | null
  parentEmail: string | null
  completedAt: string | null
  redFlagCount: number
}

export type ReviewedAssessment = {
  assessmentResultId: string
  assessmentId: string
  childName: string
  status: string | null
  reviewedAt: string | null
}

type PhysicianDashboardClientProps = {
  stats: DashboardStats
  physician: PhysicianInfo
  pendingReviews: PendingReview[]
  recentlyReviewed: ReviewedAssessment[]
}

function monthsBetween(dob: string): string {
  if (!dob) return 'N/A'
  const date = new Date(dob)
  if (Number.isNaN(date.getTime())) return 'N/A'

  const today = new Date()
  let months =
    (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth())

  if (today.getDate() < date.getDate()) {
    months -= 1
  }

  if (months < 0) months = 0

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years > 0) {
    return `${years}y ${remainingMonths}m`
  }
  return `${remainingMonths}m`
}

function formatPhysicianName(name: string | null): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  return trimmed.replace(/^Dr\.?\s+/i, '')
}

const cardBase =
  'rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl'

export default function PhysicianDashboardClient({
  stats: initialStats,
  physician,
  pendingReviews: initialPending,
  recentlyReviewed: initialReviewed,
}: PhysicianDashboardClientProps) {
  const [stats, setStats] = useState(initialStats)
  const [pendingReviews, setPendingReviews] = useState(initialPending)
  const [recentlyReviewed, setRecentlyReviewed] = useState(initialReviewed)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const handleReviewClick = useCallback(async (review: PendingReview) => {
    setIsModalOpen(true)
    setIsLoadingDetail(true)
    try {
      const response = await fetch(`/api/physician/assessments/${review.assessmentId}/detail`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const payload = (await response.json().catch(() => null)) as
        | AssessmentDetail
        | { error?: string }
        | null

      if (!response.ok) {
        const errorMessage =
          (payload as { error?: string } | null)?.error ?? 'Unable to load assessment details.'
        throw new Error(errorMessage)
      }

      const data = payload as AssessmentDetail
      setSelectedAssessment(data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to load assessment details.'
      )
      setIsModalOpen(false)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  const handleReviewSubmit = useCallback(
    async ({ action, notes }: { action: ReviewAction; notes: string }) => {
      if (!selectedAssessment) return
      try {
        const response = await fetch(
          `/api/physician/assessment-results/${selectedAssessment.assessmentResultId}/review`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, notes }),
          }
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error ?? 'Unable to update assessment.')
        }

        const updatedStatus =
          action === 'approve'
            ? 'approved'
            : action === 'needs_revision'
            ? 'needs_revision'
            : 'rejected'

        setPendingReviews((prev) =>
          prev.filter(
            (item) => item.assessmentResultId !== selectedAssessment.assessmentResultId
          )
        )
        setStats((prev) => ({
          ...prev,
          pendingReviews: Math.max(prev.pendingReviews - 1, 0),
          approvedAssessments:
            updatedStatus === 'approved' ? prev.approvedAssessments + 1 : prev.approvedAssessments,
        }))
        setRecentlyReviewed((prev) => [
          {
            assessmentResultId: selectedAssessment.assessmentResultId,
            assessmentId: selectedAssessment.assessmentId,
            childName: selectedAssessment.childName,
            status: updatedStatus,
            reviewedAt: new Date().toISOString(),
          },
          ...prev,
        ])

        toast.success('Assessment review updated successfully.')
        setIsModalOpen(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Unable to update the assessment.'
        )
      }
    },
    [selectedAssessment]
  )

  const statsCards = useMemo(
    () => [
      {
        label: 'Pending Reviews',
        value: stats.pendingReviews,
        icon: ClipboardCheck,
        badgeClass: 'bg-amber-100 text-amber-700',
      },
      {
        label: 'Approved Assessments',
        value: stats.approvedAssessments,
        icon: CheckIcon,
        badgeClass: 'bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Avg. Review Time',
        value: stats.averageReviewTime,
        icon: CalendarDays,
        badgeClass: 'bg-purple-100 text-purple-700',
      },
    ],
    [stats]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="space-y-6">
          <Card className={cardBase}>
            <CardContent className="flex flex-col gap-6 p-0 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
                  Physician dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">
                  {(() => {
                    const name = formatPhysicianName(physician.fullName)
                    return `Welcome back${name ? `, Dr. ${name}` : ''}!`
                  })()}
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Review developmental assessments, manage referrals, and keep families supported.
                </p>
              </div>
              <Badge className="w-fit rounded-full bg-indigo-100 px-4 py-2 text-indigo-700">
                <Users className="mr-2 h-4 w-4" />
                Pediatric Team
              </Badge>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {statsCards.map(({ label, value, icon: Icon, badgeClass }) => (
              <Card key={label} className={cardBase}>
                <CardContent className="flex items-center justify-between p-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                  </div>
                  <span className={`rounded-full p-3 shadow-lg ${badgeClass}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white drop-shadow">
              Pending Reviews
            </h2>
            <Badge className="rounded-full bg-white/90 px-3 py-1 text-indigo-700 shadow">
              {pendingReviews.length} awaiting
            </Badge>
          </div>

          {pendingReviews.length === 0 ? (
            <Card className={cardBase}>
              <CardContent className="p-0 text-center text-slate-600">
                <p>No assessments awaiting your review right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {pendingReviews.map((review) => (
                <Card key={review.assessmentResultId} className={cardBase}>
                  <CardHeader className="space-y-2 p-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-slate-900">
                        {review.childName}
                      </CardTitle>
                      <Badge className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                        <FlagTriangleRight className="mr-1 h-4 w-4" />
                        {review.redFlagCount} flag{review.redFlagCount === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-slate-600">
                      Age {monthsBetween(review.childDob)} • Submitted{' '}
                      {review.completedAt
                        ? new Date(review.completedAt).toLocaleDateString()
                        : '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span>
                          {review.parentName ?? 'Parent'} • {review.parentEmail ?? '—'}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500"
                      onClick={() => handleReviewClick(review)}
                    >
                      Review Assessment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white drop-shadow">
              Recently Reviewed
            </h2>
          </div>
          {recentlyReviewed.length === 0 ? (
            <Card className={cardBase}>
              <CardContent className="p-0 text-center text-slate-600">
                <p>No recent reviews yet. Completed assessments will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentlyReviewed.map((review) => (
                <Card key={review.assessmentResultId} className={cardBase}>
                  <CardHeader className="space-y-2 p-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-slate-900">
                        {review.childName}
                      </CardTitle>
                      <Badge className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                        {review.status ?? 'Reviewed'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-slate-600">
                      Reviewed{' '}
                      {review.reviewedAt
                        ? new Date(review.reviewedAt).toLocaleString()
                        : '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
                      onClick={() =>
                        handleReviewClick({
                          assessmentResultId: review.assessmentResultId,
                          assessmentId: review.assessmentId,
                          childName: review.childName,
                          childDob: '',
                          parentName: null,
                          parentEmail: null,
                          completedAt: null,
                          redFlagCount: 0,
                        })
                      }
                    >
                      View Review
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Referrals section intentionally removed */}
      </div>

      <PhysicianReviewModal
        open={isModalOpen}
        loading={isLoadingDetail}
        assessment={selectedAssessment}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAssessment(null)
        }}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}


