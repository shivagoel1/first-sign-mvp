'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Baby,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Smile,
  UserRound,
  XCircle,
  Zap,
} from 'lucide-react'

import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

type ReviewAction = 'approve' | 'needs_revision' | 'rejected'

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

type StorybookPage = {
  page_number?: number
  milestone_code?: string
  display_text?: string
  narrative_text?: string
  visual_flag?: string
  image_url?: string
  status?: string
  recommended_articles?: Array<{
    title: string
    url: string
    source: string
    description?: string
  }>
}

type StorybookReport = {
  pages?: StorybookPage[]
}

export type AssessmentDetail = {
  assessmentResultId: string
  assessmentId: string
  status?: string | null
  parentVisible?: boolean | null
  childName: string
  parentName: string | null
  parentEmail?: string | null
  childAgeMonths?: number | null
  completedAt: string | null
  updatedAt?: string | null
  aiReport: string | null
  aiProcessingStatus?: ProcessingStatus | null
  aiProcessingProgress?: number | null
  aiGenerationCost?: number | null
  aiTokensUsed?: number | null
  aiImagesGenerated?: number | null
  canViewCost?: boolean
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
  yes: 'bg-success/10 text-success border-success/20',
  no: 'bg-destructive/10 text-destructive border-destructive/20',
  sometimes: 'bg-warning/10 text-warning border-warning/20',
  not_sure: 'bg-muted text-muted-foreground border-border',
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'Social-Emotional': Smile,
    'Language/Communication': MessageSquare,
    'Motor Skills': Zap,
    'Motor': Zap,
    'Cognitive': Baby,
  }
  return icons[category] || Baby
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Social-Emotional': 'text-primary bg-primary/10',
    'Language/Communication': 'text-secondary-accent bg-secondary-accent/10',
    'Motor Skills': 'text-warning bg-warning/10',
    'Motor': 'text-warning bg-warning/10',
    'Cognitive': 'text-success bg-success/10',
  }
  return colors[category] || 'text-muted bg-muted/10'
}

const getResponseValueBadge = (value: string) => {
  return (
    <Badge className={responseColors[value] || responseColors.not_sure}>
      {value.replace('_', ' ').toUpperCase()}
    </Badge>
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
  const [overrideStatus, setOverrideStatus] = useState<ProcessingStatus | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    setOverrideStatus(null)
    setRetrying(false)
  }, [assessment?.assessmentResultId])

  const effectiveStatus = overrideStatus ?? assessment?.aiProcessingStatus ?? null
  // Always use the actual progress from the database, even when processing
  // This ensures the progress bar moves forward during image generation
  const effectiveProgress = Math.max(0, Math.min(assessment?.aiProcessingProgress ?? 0, 100))

  const parsedReport = useMemo(() => {
    if (!assessment?.aiReport) return null
    try {
      const parsed = typeof assessment.aiReport === 'string'
        ? JSON.parse(assessment.aiReport)
        : assessment.aiReport
      
      // Add cache-busting to image URLs to prevent browser caching of regenerated images
      // Use updated_at timestamp (changes when ai_report is regenerated)
      // IMPORTANT: Preserve all page properties including recommended_articles
      if (parsed && parsed.pages && Array.isArray(parsed.pages)) {
        const cacheBuster = assessment.updatedAt
          ? new Date(assessment.updatedAt).getTime()
          : Date.now()
        return {
          ...parsed,
          pages: parsed.pages.map((page: any) => ({
            ...page, // Preserve all properties including recommended_articles
            image_url: page.image_url
              ? `${page.image_url}${page.image_url.includes('?') ? '&' : '?'}v=${cacheBuster}`
              : page.image_url,
            // Explicitly preserve recommended_articles to ensure they're not lost
            recommended_articles: page.recommended_articles || [],
          })),
        }
      }
      
      return parsed
    } catch {
      return assessment.aiReport
    }
  }, [assessment?.aiReport, assessment?.updatedAt])


  const handleRegenerateStorybook = async () => {
    if (!assessment) return
    setRegenerating(true)
    // Reuse the full AI generation pipeline (images + PDFs)
    try {
      await handleRetryAiGeneration()
      toast.success('Regeneration started (images + PDFs).')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRetryAiGeneration = async () => {
    if (!assessment) return
    setRetrying(true)
    setOverrideStatus('processing')

    try {
      const response = await fetch(
        `/api/physician/assessment-results/${assessment.assessmentResultId}/retry-ai`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Failed to restart AI generation.')
      }

      toast.success('AI regeneration started. The page will refresh when complete.')
      // Don't reload immediately - let the polling refresh the data
      // The dashboard polling will detect completion and refresh the modal
    } catch (error) {
      setOverrideStatus('failed')
      toast.error(
        error instanceof Error ? error.message : 'Unable to retry AI generation.'
      )
    } finally {
      setRetrying(false)
    }
  }

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
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogHeader>
            <DialogTitle>Review Assessment - {assessment?.assessmentId ?? ''}</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Review the assessment details, AI-generated storybook, and provide feedback.
            </p>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {loading && !assessment ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading assessment details...</p>
            </div>
          ) : assessment ? (
            <div className="space-y-6 py-6">
            {/* Assessment Overview */}
            <Card className="p-6 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 border-2 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Assessment Overview</h3>
                {(() => {
                  const status = assessment.status ?? 'awaiting_review'
                  const parentVisible = assessment.parentVisible ?? false
                  
                  if (status === 'approved' && parentVisible) {
                    return (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-sm px-3 py-1.5">
                        Approved
                      </Badge>
                    )
                  } else if (status === 'needs_revision') {
                    return (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-sm px-3 py-1.5">
                        Needs Revision
                      </Badge>
                    )
                  } else if (status === 'rejected') {
                    return (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-sm px-3 py-1.5">
                        Rejected
                      </Badge>
                    )
                  } else {
                    return (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-sm px-3 py-1.5">
                        Awaiting physician review
                      </Badge>
                    )
                  }
                })()}
              </div>
              
              {/* Info Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="bg-background px-3 py-1.5 shadow-sm">
                  <UserRound className="w-3.5 h-3.5 mr-2" />
                  {assessment.parentName ?? 'Parent'}
                </Badge>
                {assessment.parentEmail ? (
                  <Badge variant="outline" className="bg-background px-3 py-1.5 shadow-sm">
                    <Mail className="w-3.5 h-3.5 mr-2" />
                    {assessment.parentEmail}
                  </Badge>
                ) : null}
                {typeof assessment.childAgeMonths === 'number' ? (
                  <Badge variant="outline" className="bg-background px-3 py-1.5 shadow-sm">
                    <Clock className="w-3.5 h-3.5 mr-2" />
                    {assessment.childAgeMonths} months
                  </Badge>
                ) : null}
                {assessment.completedAt ? (
                  <Badge variant="outline" className="bg-background px-3 py-1.5 shadow-sm">
                    <CalendarDays className="w-3.5 h-3.5 mr-2" />
                    {new Date(assessment.completedAt).toLocaleDateString()}
                  </Badge>
                ) : null}
              </div>

              {/* Fields Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="bg-white/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Child Name</p>
                  <p className="font-semibold text-foreground">{assessment.childName}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Age</p>
                  <p className="font-semibold text-foreground">
                    {typeof assessment.childAgeMonths === 'number'
                      ? `${assessment.childAgeMonths} months`
                      : '—'}
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Parent Name</p>
                  <p className="font-semibold text-foreground">{assessment.parentName ?? '—'}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Parent Email</p>
                  <p className="font-semibold text-foreground break-all">{assessment.parentEmail ?? '—'}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Submission Date</p>
                  <p className="font-semibold text-foreground">
                    {assessment.completedAt
                      ? new Date(assessment.completedAt).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-border/50">
                  <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Red Flags</p>
                  <p className="font-semibold flex items-center gap-2">
                    {assessment.redFlagCount > 0 ? (
                      <>
                        <Flag className="w-4 h-4 text-destructive" />
                        <span className="text-destructive">{assessment.redFlagCount}</span>
                      </>
                    ) : (
                      <span className="text-success">None</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* AI Report Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  AI-Generated Storybook Report
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateStorybook}
                  disabled={regenerating || reviewDisabled}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate Storybook
                </Button>
              </div>

              {effectiveStatus === 'completed' && parsedReport ? (
                typeof parsedReport === 'string' ? (
                  <p className="whitespace-pre-wrap rounded-2xl bg-muted/30 p-4 text-sm text-foreground">
                    {parsedReport}
                  </p>
                ) : Array.isArray((parsedReport as StorybookReport).pages) ? (
                  <div className="space-y-4">
                    {/* Storybook Pages */}
                    {(parsedReport as StorybookReport).pages?.map((page: StorybookPage) => (
                      <Card key={page.page_number ?? Math.random()} className="p-6">
                        <div className="flex gap-6">
                          {page.image_url ? (
                            <div className="w-40 flex-shrink-0">
                              <img
                                src={page.image_url}
                                alt={`Page ${page.page_number}`}
                                className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                              />
                            </div>
                          ) : null}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant="secondary">Page {page.page_number ?? '-'}</Badge>
                              {page.milestone_code ? (
                                <Badge variant="outline">{page.milestone_code}</Badge>
                              ) : null}
                              {page.visual_flag ? (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                                  <Flag className="w-3 h-3 mr-1" />
                                  Red Flag
                                </Badge>
                              ) : null}
                            </div>
                            <h4 className="text-lg mb-2">{page.display_text ?? 'Untitled'}</h4>
                            {page.narrative_text ? (
                              <p className="text-muted-foreground mb-4">{page.narrative_text}</p>
                            ) : null}
                            
                            {/* Recommended Articles - Only show for "needs support" pages */}
                            {/* Debug: Log page status and articles */}
                            {(() => {
                              const pageStatus = (page.status ?? '').toLowerCase()
                              const hasArticles = page.recommended_articles && Array.isArray(page.recommended_articles) && page.recommended_articles.length > 0
                              if (pageStatus === 'missed') {
                                console.log(`[physician-modal] Page ${page.page_number}: status=${pageStatus}, hasArticles=${hasArticles}, articles=`, page.recommended_articles)
                              }
                              return null
                            })()}
                            {(page.status ?? '').toLowerCase() === 'missed' && page.recommended_articles && Array.isArray(page.recommended_articles) && page.recommended_articles.length > 0 && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  Helpful Resources
                                </h5>
                                <div className="space-y-2">
                                  {page.recommended_articles.map((article, idx) => (
                                    <a
                                      key={article.url || idx}
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-3 bg-white rounded-md border border-border hover:border-primary/50 hover:shadow-sm transition-all group"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-primary uppercase">
                                              {article.source}
                                            </span>
                                            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                          </div>
                                          <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                                            {article.title}
                                          </p>
                                          {article.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                              {article.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Cost Metrics */}
                    {assessment?.canViewCost && typeof assessment?.aiGenerationCost === 'number' ? (
                      <Card className="p-4 bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                          Generation Cost: ${assessment.aiGenerationCost.toFixed(2)} • 
                          Tokens: {assessment.aiTokensUsed ?? 0} • 
                          Images: {assessment.aiImagesGenerated ?? 0}
                        </p>
                      </Card>
                    ) : null}
                  </div>
                ) : (
                  <pre className="max-h-60 overflow-y-auto rounded-2xl bg-muted/30 p-4 text-sm text-foreground">
                    {JSON.stringify(parsedReport, null, 2)}
                  </pre>
                )
              ) : effectiveStatus === 'processing' ? (
                <Card className="p-8 text-center">
                  <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-lg mb-2">Generating AI Report...</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {effectiveProgress}% complete
                  </p>
                  <Progress value={effectiveProgress} className="h-2" />
                </Card>
              ) : effectiveStatus === 'failed' ? (
                <Card className="p-8 text-center border-destructive/20">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg mb-2">AI Generation Failed</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    There was an error generating the report. Please try again.
                  </p>
                  <Button variant="outline" onClick={handleRetryAiGeneration} disabled={retrying}>
                    {retrying ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Retry AI Generation
                  </Button>
                </Card>
              ) : effectiveStatus === 'pending' ? (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg mb-2">AI Report Not Started</p>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleRetryAiGeneration}
                    disabled={retrying}
                  >
                    {retrying ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Start AI Generation
                  </Button>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No AI report available for this assessment.
                  </p>
                </Card>
              )}
            </div>

            {/* Red Flags Section */}
            {assessment.redFlags.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground">
                  <Flag className="w-5 h-5 text-destructive" />
                  Red Flags ({assessment.redFlagCount})
                </h3>
                <Card className="p-6 border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 shadow-md">
                  <ul className="space-y-3">
                    {assessment.redFlags.map((flag, index) => (
                      <li key={`${flag}-${index}`} className="flex items-start gap-3 bg-white/50 rounded-lg p-3 border border-destructive/20">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-foreground font-medium">{flag || 'Flag detail unavailable'}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ) : null}

            {/* Milestone Responses Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Milestone Responses ({assessment.responses.length} responses)
              </h3>
              <div className="space-y-4">
                {['Social-Emotional', 'Language/Communication', 'Motor Skills', 'Motor', 'Cognitive'].map((category) => {
                  const categoryResponses = assessment.responses.filter(
                    (r) => r.category === category
                  )
                  
                  if (categoryResponses.length === 0) return null
                  
                  const Icon = getCategoryIcon(category)
                  
                  return (
                    <Card key={category} className="p-6 border-2 shadow-md bg-gradient-to-br from-white to-orange-50/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${getCategoryColor(category)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground">{category}</h4>
                      </div>
                      <div className="space-y-4">
                        {categoryResponses.map((response) => (
                          <div key={response.id} className="border-l-2 border-border pl-4">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <p className="text-sm font-medium">{response.question}</p>
                              {getResponseValueBadge(response.response)}
                            </div>
                            {response.notes ? (
                              <p className="text-sm text-muted-foreground italic">
                                Note: {response.notes}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Physician Notes Section */}
            <div>
              <Label htmlFor="physician-notes" className="text-lg mb-4 block">
                Physician Notes & Recommendations
              </Label>
              <Textarea
                id="physician-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Document your clinical observations, recommendations, and guidance for the parent. Include any developmental concerns, suggested activities, or follow-up actions."
                className="min-h-32"
              />
            </div>

            {/* Review Actions */}
            <Card className="p-6 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 border-2 shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Review Actions</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={reviewDisabled}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => handleSubmit('rejected')}
                  disabled={reviewDisabled}
                >
                  {submitting === 'rejected' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="border-warning/30 text-warning hover:bg-warning/10"
                  onClick={() => handleSubmit('needs_revision')}
                  disabled={reviewDisabled}
                >
                  {submitting === 'needs_revision' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Request Revision
                </Button>
                <Button
                  className="bg-success hover:bg-success/90 text-white"
                  onClick={() => handleSubmit('approve')}
                  disabled={reviewDisabled}
                >
                  {submitting === 'approve' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Approve & Share
                </Button>
              </div>
            </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <p className="text-sm text-muted-foreground">Select an assessment to review.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


