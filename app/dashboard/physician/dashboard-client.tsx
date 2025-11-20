'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, ClipboardCheck, FlagTriangleRight, LogOut, Mail, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
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


export default function PhysicianDashboardClient({
  stats: initialStats,
  physician,
  pendingReviews: initialPending,
  recentlyReviewed: initialReviewed,
}: PhysicianDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState(initialStats)
  const [pendingReviews, setPendingReviews] = useState(initialPending)
  const [recentlyReviewed, setRecentlyReviewed] = useState(initialReviewed)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Poll for assessment updates when modal is open and status is processing/pending
  useEffect(() => {
    if (!isModalOpen || !selectedAssessment) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    const status = selectedAssessment.aiProcessingStatus
    const shouldPoll = status === 'processing' || status === 'pending'

    if (!shouldPoll) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      if (!selectedAssessment?.assessmentId) return

      try {
        const response = await fetch(
          `/api/physician/assessments/${selectedAssessment.assessmentId}/detail`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )

        if (!response.ok) return

        const payload = (await response.json().catch(() => null)) as
          | AssessmentDetail
          | { error?: string }
          | null

        if (payload && !('error' in payload)) {
          setSelectedAssessment(payload as AssessmentDetail)
        }
      } catch (error) {
        console.error('[physician-dashboard] polling error:', error)
      }
    }, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, selectedAssessment?.assessmentId, selectedAssessment?.aiProcessingStatus])

  const handleReviewClick = useCallback(async (review: PendingReview) => {
    console.log('[physician-dashboard] Opening review for assessment:', review.assessmentId)
    setIsModalOpen(true)
    setIsLoadingDetail(true)
    setSelectedAssessment(null) // Clear previous assessment
    
    try {
      console.log('[physician-dashboard] Fetching assessment details from:', `/api/physician/assessments/${review.assessmentId}/detail`)
      const response = await fetch(`/api/physician/assessments/${review.assessmentId}/detail`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      console.log('[physician-dashboard] Response status:', response.status, response.ok)
      
      const payload = (await response.json().catch((err) => {
        console.error('[physician-dashboard] JSON parse error:', err)
        return null
      })) as
        | AssessmentDetail
        | { error?: string }
        | null

      if (!response.ok) {
        const errorMessage =
          (payload as { error?: string } | null)?.error ?? 'Unable to load assessment details.'
        console.error('[physician-dashboard] API error:', errorMessage, 'Status:', response.status)
        throw new Error(errorMessage)
      }

      if (!payload || 'error' in payload) {
        console.error('[physician-dashboard] Invalid payload:', payload)
        throw new Error('Invalid response from server.')
      }

      const data = payload as AssessmentDetail
      console.log('[physician-dashboard] Assessment details loaded:', {
        assessmentId: data.assessmentId,
        childName: data.childName,
        responseCount: data.responses?.length ?? 0,
      })
      setSelectedAssessment(data)
    } catch (error) {
      console.error('[physician-dashboard] Error loading assessment:', error)
      toast.error(
        error instanceof Error ? error.message : 'Unable to load assessment details.'
      )
      setIsModalOpen(false)
      setSelectedAssessment(null)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/physician/login')
  }

  const statsCards = useMemo(
    () => [
      {
        label: 'Pending Reviews',
        value: stats.pendingReviews,
        icon: ClipboardCheck,
        badgeClass: 'bg-warning/10 text-warning',
      },
      {
        label: 'Approved Assessments',
        value: stats.approvedAssessments,
        icon: CheckIcon,
        badgeClass: 'bg-success/10 text-success',
      },
      {
        label: 'Avg. Review Time',
        value: stats.averageReviewTime,
        icon: CalendarDays,
        badgeClass: 'bg-secondary-accent/10 text-secondary-accent',
      },
    ],
    [stats]
  )

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <header className="space-y-6 mb-8">
          <Card className="p-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
            <CardContent className="flex flex-col gap-6 p-0 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-semibold mb-2">
                  {(() => {
                    const name = formatPhysicianName(physician.fullName)
                    return `Welcome back${name ? `, Dr. ${name}` : ''}!`
                  })()}
                </h1>
                <p className="text-muted-foreground">
                  Review developmental assessments, manage referrals, and keep families supported.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-2">
                  <Users className="mr-2 h-4 w-4" />
                  Pediatric Team
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {statsCards.map(({ label, value, icon: Icon, badgeClass }) => (
              <Card key={label} className="p-6">
                <CardContent className="flex items-center justify-between p-0">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                  </div>
                  <span className={`rounded-full p-3 ${badgeClass}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Pending Reviews
            </h2>
            <Badge variant="outline" className="px-3 py-1">
              {pendingReviews.length} awaiting
            </Badge>
          </div>

          {pendingReviews.length === 0 ? (
            <Card className="p-6">
              <CardContent className="p-0 text-center text-muted-foreground">
                <p>No assessments awaiting your review right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {pendingReviews.map((review) => (
                <Card key={review.assessmentResultId} className="p-6">
                  <CardHeader className="space-y-2 p-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {review.childName}
                      </CardTitle>
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        <FlagTriangleRight className="mr-1 h-4 w-4" />
                        {review.redFlagCount} flag{review.redFlagCount === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Age {monthsBetween(review.childDob)} • Submitted{' '}
                      {review.completedAt
                        ? new Date(review.completedAt).toLocaleDateString()
                        : '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-0 mt-4">
                    <div className="rounded-lg bg-muted p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {review.parentName ?? 'Parent'} • {review.parentEmail ?? '—'}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-secondary-accent hover:bg-secondary-accent/90 text-white"
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

        <section className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Recently Reviewed
            </h2>
          </div>
          {recentlyReviewed.length === 0 ? (
            <Card className="p-6">
              <CardContent className="p-0 text-center text-muted-foreground">
                <p>No recent reviews yet. Completed assessments will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentlyReviewed.map((review) => (
                <Card key={review.assessmentResultId} className="p-6">
                  <CardHeader className="space-y-2 p-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {review.childName}
                      </CardTitle>
                      <Badge variant="outline">
                        {review.status ?? 'Reviewed'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Reviewed{' '}
                      {review.reviewedAt
                        ? new Date(review.reviewedAt).toLocaleString()
                        : '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
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


