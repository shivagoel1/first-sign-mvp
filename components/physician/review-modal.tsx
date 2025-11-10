'use client'

import { ReactNode, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FlagTriangleRight,
  Loader2,
  Mail,
  UserRound,
  XCircle,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

type ReviewAction = 'approve' | 'needs_revision' | 'rejected'

export type AssessmentDetail = {
  assessmentResultId: string
  assessmentId: string
  childName: string
  parentName: string | null
  parentEmail?: string | null
  childAgeMonths?: number | null
  completedAt: string | null
  aiReport: string | null
  redFlags: string[]
  redFlagCount: number
  responses: Array<{
    id: string
    milestoneId: string
    question: string
    category: string
    response: string
    notes: string | null
  }>
  physicianNotes: string | null
}

type PhysicianReviewModalProps = {
  open: boolean
  loading: boolean
  assessment: AssessmentDetail | null
  onClose: () => void
  onSubmit: (payload: { action: ReviewAction; notes: string }) => Promise<void>
}

const responseColors: Record<string, string> = {
  yes: 'bg-emerald-100 text-emerald-700',
  no: 'bg-rose-100 text-rose-700',
  sometimes: 'bg-amber-100 text-amber-700',
  not_sure: 'bg-slate-200 text-slate-700',
}

function InfoPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
      <span className="text-indigo-500">{icon}</span>
      {children}
    </span>
  )
}

function SectionShell({
  title,
  description,
  children,
  accent = 'default',
}: {
  title: string
  description?: string
  children: ReactNode
  accent?: 'default' | 'warning'
}) {
  const palette =
    accent === 'warning' ? 'border-rose-200 bg-rose-50/80' : 'border-slate-200 bg-white/95'

  return (
    <section className={`rounded-3xl border p-6 shadow-xl ${palette}`}>
      <div className="space-y-1">
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        {description ? (
          <p className="text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function PhysicianReviewModal({
  open,
  loading,
  assessment,
  onClose,
  onSubmit,
}: PhysicianReviewModalProps) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState<ReviewAction | null>(null)

  const parsedReport = useMemo(() => {
    if (!assessment?.aiReport) return null
    try {
      return JSON.parse(assessment.aiReport)
    } catch {
      return assessment.aiReport
    }
  }, [assessment?.aiReport])

  const handleSubmit = async (action: ReviewAction) => {
    if (!assessment) return
    setSubmitting(action)
    try {
      await onSubmit({ action, notes })
      setNotes('')
    } finally {
      setSubmitting(null)
    }
  }

  const reviewDisabled = loading || submitting !== null

  return (
    <Dialog open={open} onOpenChange={(state) => (!state ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-2xl font-semibold text-slate-900">
            Review Assessment
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Confirm red flags, add physician guidance, and update the family&apos;s plan.
          </p>
        </DialogHeader>

        {assessment ? (
          <div className="space-y-8 text-left">
            <section className="rounded-3xl border border-slate-200 bg-white/95 shadow-xl">
              <div className="flex flex-col gap-6 rounded-t-3xl bg-slate-50/80 p-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {assessment.childName}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Submitted{' '}
                      {assessment.completedAt
                        ? new Date(assessment.completedAt).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <InfoPill icon={<UserRound className="h-4 w-4" />}>
                      {assessment.parentName ?? 'Parent'}
                    </InfoPill>
                    {assessment.parentEmail ? (
                      <InfoPill icon={<Mail className="h-4 w-4" />}>
                        {assessment.parentEmail}
                      </InfoPill>
                    ) : null}
                    {typeof assessment.childAgeMonths === 'number' ? (
                      <InfoPill icon={<Clock className="h-4 w-4" />}>
                        Age {assessment.childAgeMonths} months
                      </InfoPill>
                    ) : null}
                    {assessment.completedAt ? (
                      <InfoPill icon={<CalendarDays className="h-4 w-4" />}>
                        Completed {new Date(assessment.completedAt).toLocaleDateString()}
                      </InfoPill>
                    ) : null}
                  </div>
                </div>
                <Badge className="h-fit rounded-full bg-rose-100 px-4 py-2 text-rose-700">
                  <FlagTriangleRight className="mr-2 h-4 w-4" />
                  {assessment.redFlagCount} red flag
                  {assessment.redFlagCount === 1 ? '' : 's'}
                </Badge>
              </div>
              <div className="grid gap-4 px-6 pb-6 pt-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment ID
                  </p>
                  <p className="rounded-xl bg-white px-4 py-3 text-sm font-mono text-slate-700 shadow-inner ring-1 ring-slate-100">
                    {assessment.assessmentId}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Review Status
                  </p>
                  <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-inner ring-1 ring-slate-100">
                    Awaiting physician review
                  </p>
                </div>
              </div>
            </section>

            <SectionShell
              title="AI Report"
              description="Automated summary of milestone performance."
            >
              {parsedReport ? (
                typeof parsedReport === 'string' ? (
                  <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 shadow-inner">
                    {parsedReport}
                  </p>
                ) : (
                  <pre className="max-h-60 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 shadow-inner">
                    {JSON.stringify(parsedReport, null, 2)}
                  </pre>
                )
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No AI report available for this assessment.
                </p>
              )}
            </SectionShell>

            {assessment.redFlags.length ? (
              <SectionShell
                title="Red Flags"
                description="Conversations to prioritize with the family."
                accent="warning"
              >
                <ul className="space-y-2">
                  {assessment.redFlags.map((flag, index) => (
                    <li
                      key={`${flag}-${index}`}
                      className="rounded-2xl bg-white px-4 py-3 text-sm text-rose-700 shadow-sm ring-1 ring-rose-100/60"
                    >
                      {flag || 'Flag detail unavailable'}
                    </li>
                  ))}
                </ul>
              </SectionShell>
            ) : null}

            <SectionShell
              title="Milestone Responses"
              description="Review caregiver inputs by developmental category."
            >
              <div className="flex items-center justify-between gap-3">
                <Badge className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {assessment.responses.length} items
                </Badge>
              </div>
              <div className="space-y-3">
                {assessment.responses.map((response) => (
                  <div
                    key={response.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">
                        {response.category}
                      </span>
                      <Badge className={responseColors[response.response] ?? 'bg-slate-200 text-slate-700'}>
                        {response.response.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-800">{response.question}</p>
                    {response.notes ? (
                      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        Notes: {response.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionShell>

            <SectionShell
              title="Physician Notes"
              description="Document findings, recommendations, and next steps shared with the family."
            >
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add clinical observations or follow-up recommendations..."
                className="min-h-[140px] rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 shadow-inner focus-visible:ring-2 focus-visible:ring-indigo-400"
              />
            </SectionShell>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
                disabled={reviewDisabled}
              >
                Close
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={() => handleSubmit('needs_revision')}
                  disabled={reviewDisabled}
                  className="rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                  {submitting === 'needs_revision' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Request Revision
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit('rejected')}
                  disabled={reviewDisabled}
                  className="rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200"
                >
                  {submitting === 'rejected' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit('approve')}
                  disabled={reviewDisabled}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500"
                >
                  {submitting === 'approve' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve &amp; Share with Parent
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            ) : (
              <p className="text-sm text-slate-600">Select an assessment to review.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


