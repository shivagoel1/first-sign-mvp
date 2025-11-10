'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StorybookViewer } from '@/components/storybook-viewer'
import {
  Baby,
  BookOpen,
  CalendarDays,
  Smile,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type AssessmentRecord = {
  id: string
  completed_at: string | null
  status: string | null
  parent_visible: boolean | null
  parent_pdf_url: string | null
  ai_report: string | null
}

export type ChildRecord = {
  id: string
  child_name: string
  date_of_birth: string
  gender: string | null
  avatar_url?: string | null
  assessments: AssessmentRecord[]
}

type ParentDashboardClientProps = {
  profile: {
    full_name: string | null
    avatar_url?: string | null
  } | null
  children: ChildRecord[]
}

type StorybookViewerProps = ComponentProps<typeof StorybookViewer>

type StorybookContent = {
  pages: Array<{
    page_number: number
    narrative_text: string
    image_url?: string
    status?: string
    milestone_code?: string
  }>
}

const statusMeta = {
  pending: {
    label: 'Pending Review',
    message:
      'Your assessment has been submitted and is pending physician approval.',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  awaiting_review: {
    label: 'Awaiting Review',
    message:
      'Your assessment has been submitted and is pending physician approval.',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  generating: {
    label: 'Generating Storybook',
    message: 'Your personalized storybook is being generated.',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
  approved: {
    label: 'Approved',
    message: 'Your storybook is ready to view!',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  needs_revision: {
    label: 'Needs Revision',
    message: 'Your assessment requires additional review.',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
  rejected: {
    label: 'Requires Attention',
    message: 'Your assessment requires additional review.',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
} as const

function getStatusMeta(status: string | null) {
  if (!status) return statusMeta.pending
  return statusMeta[status as keyof typeof statusMeta] ?? statusMeta.pending
}

function monthsBetween(dob: string): number {
  const date = new Date(dob)
  const diff = Date.now() - date.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)))
}

function EmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <Card className="rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-lg">
          <Smile className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-base text-gray-600 leading-relaxed">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const cardBase =
  'rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl'

const primaryButtonClasses =
  'bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl'

const secondaryButtonClasses =
  'bg-white text-gray-700 border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:border-gray-300 hover:shadow-md'

export default function ParentDashboardClient({
  profile,
  children,
}: ParentDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children[0]?.id ?? null
  )
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedStorybook, setSelectedStorybook] =
    useState<StorybookViewerProps['storybook']>(null)
  const [selectedChildName, setSelectedChildName] = useState('')
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)

  const currentChild = useMemo(() => {
    if (!children.length) return null
    return children.find((child) => child.id === selectedChildId) ?? children[0]
  }, [children, selectedChildId])

  const highlightedChild = currentChild ?? children[0] ?? null

  const totalAssessments = useMemo(
    () =>
      children.reduce(
        (count, child) => count + (child.assessments?.length ?? 0),
        0
      ),
    [children]
  )

  const completedAssessments = useMemo(
    () =>
      children.reduce(
        (count, child) =>
          count +
          child.assessments.filter((assessment) => Boolean(assessment.completed_at)).length,
        0
      ),
    [children]
  )

  const completionRate = totalAssessments
    ? Math.round((completedAssessments / totalAssessments) * 100)
    : 0

  const latestAssessmentDate = useMemo(() => {
    const completed = children
      .flatMap((child) => child.assessments)
      .map((assessment) => assessment.completed_at)
      .filter(Boolean)
      .map((dateString) => new Date(dateString as string).getTime())
      .sort((a, b) => b - a)

    if (!completed.length) return null
    return new Date(completed[0]).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [children])

  const openStorybook = (child: ChildRecord, assessment: AssessmentRecord) => {
    if (!assessment.parent_visible || !assessment.ai_report) return

    try {
      const parsed = JSON.parse(assessment.ai_report) as StorybookContent
      if (!parsed?.pages?.length) {
        throw new Error('Storybook missing pages')
      }
      setSelectedStorybook(parsed)
      setSelectedChildName(child.child_name)
      setSelectedPdfUrl(assessment.parent_pdf_url ?? null)
      setIsViewerOpen(true)
    } catch (error) {
      console.error('[dashboard] failed to parse storybook:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 py-12">
      <div className="flex w-full flex-col space-y-10 px-6 lg:px-12">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className={cardBase}>
            <CardContent className="space-y-6 p-0">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-indigo-100">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name ?? 'Parent profile photo'}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <UserRound className="h-full w-full p-3 text-indigo-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
                    Parent dashboard
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-900">
                    Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-white/90">
                    You&apos;re doing amazing supporting your child&apos;s growth!
                  </p>
                </div>
              </div>

              <p className="text-base text-gray-600 leading-relaxed">
                Review milestones, pick up assessments, and celebrate each win. This space mirrors the glow of FirstSign&apos;s landing experience with calm, friendly design.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild className={primaryButtonClasses}>
                  <Link href="/assessment">Start New Assessment</Link>
                </Button>
                <Button asChild className={secondaryButtonClasses}>
                  <Link href="/assessment/questions">Continue Latest Assessment</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-white/60 bg-white/80 px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Logout
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBase}>
            <CardContent className="space-y-6 p-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
                  Family snapshot
                </p>
                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  {highlightedChild
                    ? `${highlightedChild.child_name}'s journey`
                    : 'Let’s begin your journey'}
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span>Assessment completion</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-lg">
                    <Baby className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Children in FirstSign</p>
                    <p className="text-xl font-bold text-gray-900">{children.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-lg">
                    <BookOpen className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Assessments completed</p>
                    <p className="text-xl font-bold text-gray-900">
                      {completedAssessments}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600 shadow-lg">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Latest submission</p>
                    <p className="text-base text-gray-600 leading-relaxed">
                      {latestAssessmentDate ?? 'Ready when you are'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mx-auto w-full max-w-7xl space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                Your Children
              </h2>
              <p className="text-base text-white/90 leading-relaxed">
                Keep every smile, milestone, and note organized in one caring space.
              </p>
            </div>
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow">
              {children.length} {children.length === 1 ? 'Explorer' : 'Explorers'}
            </span>
          </header>

          {children.length === 0 ? (
            <EmptyState
              title="No child profiles yet"
              message="Create your first assessment to add your child and begin tracking milestones together."
            />
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {children.map((child) => {
                const age = monthsBetween(child.date_of_birth)
                const completed = child.assessments.filter(
                  (assessment) => !!assessment.completed_at
                ).length
                const isSelected = currentChild?.id === child.id

                return (
                  <Card
                    key={child.id}
                    className={`${cardBase} ${
                      isSelected ? 'ring-4 ring-white/40' : ''
                    }`}
                  >
                    <CardHeader className="space-y-6 p-0">
                      <div className="flex items-center gap-5">
                        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-blue-100 shadow-lg">
                          {child.avatar_url ? (
                            <Image
                              src={child.avatar_url}
                              alt={child.child_name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <Baby className="h-full w-full p-3 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {child.child_name}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-600 leading-relaxed">
                            Age {age} months • {child.gender ?? 'Gender not specified'}
                          </CardDescription>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {completed === 0 ? (
                          <span>Start their first milestone journey together.</span>
                        ) : (
                          <span>
                            {completed} assessment{completed === 1 ? '' : 's'} complete—beautiful progress!
                          </span>
                        )}
                      </p>
                    </CardHeader>
                    <CardFooter className="pt-4">
                      <Button
                        className="rounded-lg bg-indigo-100 px-6 py-2.5 text-indigo-700 transition hover:bg-indigo-200"
                        onClick={() => setSelectedChildId(child.id)}
                      >
                        View {child.child_name.split(' ')[0] || 'profile'}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {currentChild ? (
          <section className="mx-auto w-full max-w-7xl space-y-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                  Assessments for {currentChild.child_name}
                </h2>
                <p className="text-base text-white/90 leading-relaxed">
                  Follow their progress, revisit storybooks, and share reports with caregivers.
                </p>
              </div>
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow">
                {currentChild.assessments.length}{' '}
                {currentChild.assessments.length === 1 ? 'Assessment' : 'Assessments'}
              </span>
            </header>

            {currentChild.assessments.length === 0 ? (
              <EmptyState
                title="No assessments yet"
                message="Start a new assessment to receive personalized guidance and an AI-crafted storybook."
              />
            ) : (
              <div className="space-y-6">
                {currentChild.assessments.map((assessment) => {
                  const meta = getStatusMeta(assessment.status)
                  const assessmentDate = assessment.completed_at
                    ? new Date(assessment.completed_at).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'In progress'

                  return (
                    <Card key={assessment.id} className={cardBase}>
                      <CardContent className="flex flex-col gap-5 p-0 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-500">
                            {assessmentDate}
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            Assessment ID: {assessment.id.slice(0, 8)}...
                          </p>
                          <Badge
                            className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </Badge>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {meta.message}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          {assessment.status === 'approved' && assessment.parent_visible ? (
                            <Button
                              className="rounded-lg bg-indigo-100 px-6 py-2.5 text-indigo-700 transition hover:bg-indigo-200"
                              onClick={() => openStorybook(currentChild, assessment)}
                            >
                              View Storybook
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/40 bg-white/10 px-4 py-2 text-sm text-white">
                              <BookOpen className="h-4 w-4" />
                              Storybook in progress
                            </span>
                          )}
                          {assessment.status === 'approved' && assessment.parent_visible && assessment.parent_pdf_url ? (
                            <Button asChild className={primaryButtonClasses}>
                              <a
                                href={assessment.parent_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Download PDF
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        ) : null}
      </div>

      <StorybookViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        storybook={selectedStorybook}
        childName={selectedChildName}
        pdfUrl={selectedPdfUrl}
      />
    </div>
  )
}

