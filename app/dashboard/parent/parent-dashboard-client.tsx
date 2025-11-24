'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StorybookViewer } from '@/components/dashboard/storybook-viewer'
import {
  Baby,
  BookOpen,
  CalendarDays,
  RefreshCw,
  Plus,
  Eye,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  BarChart3,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Share2,
  Grid3x3,
  List,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ImageWithFallback } from '@/components/figma/image-with-fallback'

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
  selectedChildId?: string | null
  onChildSelect?: (childId: string | null) => void
}

type StorybookViewerProps = ComponentProps<typeof StorybookViewer>

type StorybookContent = {
  pages: Array<{
    page_number: number
    narrative_text: string
    image_url?: string
    status?: string
    milestone_code?: string
    recommended_articles?: Array<{
      title: string
      url: string
      source: string
      description?: string
    }>
  }>
}

const statusMeta = {
  pending: {
    label: 'Pending Review',
    message:
      'Your assessment has been submitted and is pending physician approval.',
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
  },
  awaiting_review: {
    label: 'Awaiting Review',
    message:
      'Your assessment has been submitted and is pending physician approval.',
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
  },
  generating: {
    label: 'Generating Storybook',
    message: 'Your personalized storybook is being generated.',
    badgeClass: 'bg-secondary-accent/10 text-secondary-accent border-secondary-accent/20',
  },
  approved: {
    label: 'Approved',
    message: 'Your storybook is ready to view!',
    badgeClass: 'bg-success/10 text-success border-success/20',
  },
  needs_revision: {
    label: 'Needs Revision',
    message: 'Your assessment requires additional review.',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  rejected: {
    label: 'Requires Attention',
    message: 'Your assessment requires additional review.',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
} as const

function getStatusMeta(status: string | null, parentVisible: boolean | null) {
  // If status is null or undefined, show pending
  if (!status) return statusMeta.pending
  
  // If status is 'awaiting_review' or 'pending', always show awaiting review
  // This is the initial state when assessment is submitted but not yet approved by physician
  if (status === 'awaiting_review' || status === 'pending') {
    return statusMeta.awaiting_review
  }
  
  // If status is 'generating' or 'processing', show generating
  // This happens when physician has approved and AI is processing
  if (status === 'generating' || status === 'processing') {
    return statusMeta.generating
  }
  
  // If status is 'approved' and parent_visible is true, show approved
  if (status === 'approved' && parentVisible === true) {
    return statusMeta.approved
  }
  
  // If status is 'approved' but parent_visible is false, still show approved
  // (might be in transition)
  if (status === 'approved') {
    return statusMeta.approved
  }
  
  // For other statuses (needs_revision, rejected), use the statusMeta mapping
  return statusMeta[status as keyof typeof statusMeta] ?? statusMeta.pending
}

function monthsBetween(dob: string): number {
  const date = new Date(dob)
  const diff = Date.now() - date.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)))
}

// Utility function to format relative time (e.g., "2 weeks ago")
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks === 1) return '1 week ago'
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`
  if (diffMonths === 1) return '1 month ago'
  if (diffMonths < 12) return `${diffMonths} months ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get last assessment date for a child
function getLastAssessmentDate(child: ChildRecord): string | null {
  const completed = child.assessments
    .map(a => a.completed_at)
    .filter(Boolean)
    .map(d => new Date(d as string).getTime())
    .sort((a, b) => b - a)
  return completed.length > 0 ? new Date(completed[0]).toISOString() : null
}

// Check if child has pending assessments
function hasPendingAssessments(child: ChildRecord): boolean {
  return child.assessments.some(
    a => a.status === 'awaiting_review' || a.status === 'generating' || a.status === 'processing'
  )
}

// Component to fetch and display assessment preview with latest data
function AssessmentPreviewCard({
  assessment,
  currentChild,
  meta,
  assessmentDate,
  index,
  onViewStorybook,
  isFavorite = false,
  onToggleFavorite,
  pdfUrl,
}: {
  assessment: AssessmentRecord
  currentChild: ChildRecord
  meta: { label: string; badgeClass: string; message: string }
  assessmentDate: string
  index: number
  onViewStorybook: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
  pdfUrl?: string | null
}) {
  const [storybookPreview, setStorybookPreview] = useState<{
    firstImage?: string
    totalPages: number
    milestonesMet: number
    needsSupport: number
    progressPercent: number
    firstPageText?: string
    updatedAt?: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageKey, setImageKey] = useState(0) // Force image reload by changing key

  // Fetch latest storybook data for preview
  const fetchPreview = async (forceRefresh = false) => {
    if (!assessment.parent_visible || !assessment.ai_report) {
      setIsLoading(false)
      return
    }

    try {
      // Use aggressive cache-busting with timestamp and random component
      const cacheBuster = `${Date.now()}_${Math.random().toString(36).substring(7)}`
      const response = await fetch(
        `/api/parent/assessments/${assessment.id}/storybook?t=${cacheBuster}`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        }
      )

      if (response.ok) {
        const data = await response.json()
        const reportToUse = data.ai_report ?? assessment.ai_report
        
        if (reportToUse) {
          try {
            // Handle both cases: reportToUse might be a string (from database) or already an object (from API)
            const parsed = typeof reportToUse === 'string' 
              ? JSON.parse(reportToUse) as StorybookContent
              : reportToUse as StorybookContent
            const pages = parsed?.pages ?? []
            const metCount = pages.filter(
              (p) => (p.status ?? '').toLowerCase() === 'met'
            ).length
            const needsSupportCount = pages.length - metCount
            const progressPercent = pages.length > 0 
              ? Math.round((metCount / pages.length) * 100) 
              : 0

            // Add aggressive cache-busting to image URL with multiple parameters
            const firstImageUrl = pages[0]?.image_url
            const updatedAtTimestamp = data.updated_at 
              ? new Date(data.updated_at).getTime() 
              : Date.now()
            const randomComponent = Math.random().toString(36).substring(7)
            const firstImageWithCacheBust = firstImageUrl
              ? `${firstImageUrl}${firstImageUrl.includes('?') ? '&' : '?'}v=${updatedAtTimestamp}&r=${randomComponent}&t=${Date.now()}`
              : undefined

            setStorybookPreview({
              firstImage: firstImageWithCacheBust,
              totalPages: pages.length,
              milestonesMet: metCount,
              needsSupport: needsSupportCount,
              progressPercent,
              firstPageText: pages[0]?.narrative_text?.substring(0, 120),
              updatedAt: data.updated_at,
            })
            
            // Force image reload by updating key
            if (forceRefresh || imageKey === 0) {
              setImageKey(prev => prev + 1)
            }
          } catch (e) {
            console.error('[preview] Failed to parse storybook:', e)
          }
        }
      } else {
        // Fallback to cached data if API fails
        if (assessment.ai_report) {
          try {
            const parsed = JSON.parse(assessment.ai_report) as StorybookContent
            const pages = parsed?.pages ?? []
            const metCount = pages.filter(
              (p) => (p.status ?? '').toLowerCase() === 'met'
            ).length
            const needsSupportCount = pages.length - metCount
            const progressPercent = pages.length > 0 
              ? Math.round((metCount / pages.length) * 100) 
              : 0

            // Still add cache-busting even for fallback
            const firstImageUrl = pages[0]?.image_url
            const firstImageWithCacheBust = firstImageUrl
              ? `${firstImageUrl}${firstImageUrl.includes('?') ? '&' : '?'}v=${Date.now()}&r=${Math.random().toString(36).substring(7)}`
              : undefined

            setStorybookPreview({
              firstImage: firstImageWithCacheBust,
              totalPages: pages.length,
              milestonesMet: metCount,
              needsSupport: needsSupportCount,
              progressPercent,
              firstPageText: pages[0]?.narrative_text?.substring(0, 120),
            })
          } catch {
            // Failed to parse, ignore
          }
        }
      }
    } catch (error) {
      console.error('[preview] Error fetching preview:', error)
      // Fallback to cached data
      if (assessment.ai_report) {
        try {
          const parsed = JSON.parse(assessment.ai_report) as StorybookContent
          const pages = parsed?.pages ?? []
          const metCount = pages.filter(
            (p) => (p.status ?? '').toLowerCase() === 'met'
          ).length
          const needsSupportCount = pages.length - metCount
          const progressPercent = pages.length > 0 
            ? Math.round((metCount / pages.length) * 100) 
            : 0

          const firstImageUrl = pages[0]?.image_url
          const firstImageWithCacheBust = firstImageUrl
            ? `${firstImageUrl}${firstImageUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
            : undefined

          setStorybookPreview({
            firstImage: firstImageWithCacheBust,
            totalPages: pages.length,
            milestonesMet: metCount,
            needsSupport: needsSupportCount,
            progressPercent,
            firstPageText: pages[0]?.narrative_text?.substring(0, 120),
          })
        } catch (e) {
          // Failed to parse, ignore
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.id, assessment.parent_visible, assessment.ai_report])

  // Poll for updates only if storybook is still generating
  // Stop polling once storybook is complete (has both ai_report and parent_pdf_url)
  useEffect(() => {
    if (!assessment.parent_visible) return
    
    // If storybook is complete (has both report and PDF), stop polling
    if (assessment.ai_report && assessment.parent_pdf_url) {
      return // Storybook is complete, no need to poll
    }

    // Only poll if storybook is still generating
    const interval = setInterval(() => {
      fetchPreview(true) // Force refresh
    }, 15000) // Check every 15 seconds (reduced from 5 to reduce server load)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.id, assessment.parent_visible, assessment.ai_report, assessment.parent_pdf_url])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border-2 border-transparent hover:border-primary/20">
        <div className="flex flex-col md:flex-row">
          {/* Storybook Preview Section */}
          {storybookPreview && storybookPreview.firstImage && (
            <div className="md:w-64 flex-shrink-0 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <ImageWithFallback
                key={`preview-${assessment.id}-${imageKey}`}
                src={storybookPreview.firstImage}
                alt="Storybook preview"
                className="w-full h-48 md:h-full object-cover"
              />
              <div className="absolute top-3 right-3 z-20">
                <Badge className="bg-white/90 backdrop-blur-sm text-primary border-primary/30 shadow-md">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {storybookPreview.totalPages} pages
                </Badge>
              </div>
              {storybookPreview.progressPercent > 0 && (
                <div className="absolute bottom-3 left-3 right-3 z-20">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md border border-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">Progress</span>
                      <span className="text-xs font-bold text-primary">{storybookPreview.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-success to-success/80 transition-all duration-500"
                        style={{ width: `${storybookPreview.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-semibold text-foreground">
                      {currentChild.child_name}&apos;s Assessment
                    </h3>
                    <Badge className={meta.badgeClass}>
                      {meta.label}
                    </Badge>
                    {storybookPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchPreview(true)}
                        className="h-6 px-2 text-xs"
                        title="Refresh preview"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span>{assessmentDate}</span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div className={`p-4 rounded-lg border ${
                assessment.status === "approved" ? "bg-gradient-to-r from-success/5 to-success/10 border-success/20" :
                assessment.status === "generating" ? "bg-gradient-to-r from-secondary-accent/5 to-secondary-accent/10 border-secondary-accent/20" :
                assessment.status === "needs_revision" || assessment.status === "rejected" ? "bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20" :
                "bg-gradient-to-r from-warning/5 to-warning/10 border-warning/20"
              }`}>
                <p className="text-sm font-medium">{meta.message}</p>
              </div>

              {/* Storybook Stats Preview */}
              {storybookPreview && storybookPreview.totalPages > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 border border-success/20">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-xs font-medium text-muted-foreground">Met</span>
                      </div>
                      <p className="text-2xl font-bold text-success">{storybookPreview.milestonesMet}</p>
                    </div>
                    <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg p-3 border border-warning/20">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span className="text-xs font-medium text-muted-foreground">Support</span>
                      </div>
                      <p className="text-2xl font-bold text-warning">{storybookPreview.needsSupport}</p>
                    </div>
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Progress</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{storybookPreview.progressPercent}%</p>
                    </div>
                  </div>
                  
                  {/* Visual Progress Indicator */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Milestone Progress</span>
                      <span className="font-semibold">{storybookPreview.progressPercent}% Complete</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full bg-gradient-to-r from-success via-success/80 to-success/60"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${storybookPreview.progressPercent}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    {storybookPreview.milestonesMet > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Award className="w-4 h-4 text-success" />
                        <span className="text-xs text-muted-foreground">
                          {storybookPreview.milestonesMet} milestone{storybookPreview.milestonesMet !== 1 ? 's' : ''} achieved!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Text */}
              {storybookPreview?.firstPageText && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Preview:</p>
                  <p className="text-sm text-foreground line-clamp-2">
                    {storybookPreview.firstPageText}...
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && !storybookPreview && assessment.parent_visible && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {assessment.status === 'approved' && assessment.parent_visible ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="whitespace-nowrap flex-1 min-w-[140px]"
                    onClick={onViewStorybook}
                  >
                    <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                    View Storybook
                  </Button>
                ) : assessment.parent_visible && assessment.ai_report ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="whitespace-nowrap flex-1 min-w-[140px]"
                    onClick={onViewStorybook}
                  >
                    <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                    View Storybook
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary-accent/10 rounded-md flex-1 min-w-[140px]">
                    <Loader2 className="w-4 h-4 text-secondary-accent animate-spin" />
                    <span className="text-sm text-secondary-accent">Storybook in progress...</span>
                  </div>
                )}
                {/* Show download button whenever PDF is available, regardless of status */}
                {(pdfUrl ?? assessment.parent_pdf_url) ? (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap flex-1 min-w-[140px] shadow-md hover:shadow-lg transition-all"
                    asChild
                  >
                    <a
                      href={pdfUrl ?? assessment.parent_pdf_url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      download
                    >
                      <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                      Download PDF
                    </a>
                  </Button>
                ) : assessment.parent_visible && assessment.ai_report ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap flex-1 min-w-[140px]"
                    disabled
                    title="PDF is being generated. Please check back soon."
                  >
                    <Loader2 className="w-4 h-4 mr-2 flex-shrink-0 animate-spin" />
                    PDF Generating...
                  </Button>
                ) : null}
                {/* Favorite and Share buttons */}
                <div className="flex gap-2">
                  {onToggleFavorite && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite()
                      }}
                      className="h-9 w-9 p-0"
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  )}
                  {(pdfUrl ?? assessment.parent_pdf_url) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const url = pdfUrl ?? assessment.parent_pdf_url
                        if (url && navigator.share) {
                          try {
                            await navigator.share({
                              title: `${currentChild.child_name}'s Developmental Assessment`,
                              text: `Check out ${currentChild.child_name}'s developmental milestone assessment from FirstSignFirst`,
                              url: url,
                            })
                          } catch {
                            // User cancelled or error
                          }
                        } else if (url) {
                          // Fallback: copy to clipboard
                          await navigator.clipboard.writeText(url)
                        }
                      }}
                      className="h-9 w-9 p-0"
                      title="Share assessment"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default function ParentDashboardClient({
  profile,
  children,
  selectedChildId: externalSelectedChildId,
  onChildSelect: externalOnChildSelect,
}: ParentDashboardClientProps) {
  const router = useRouter()
  const [internalSelectedChildId, setInternalSelectedChildId] = useState<string | null>(
    null // Default to null (overview mode) instead of first child
  )
  
  // Use external state if provided (including null for overview), otherwise use internal state
  // Only fall back to internal state if externalSelectedChildId is undefined (not provided)
  const selectedChildId = externalSelectedChildId !== undefined 
    ? externalSelectedChildId 
    : internalSelectedChildId
  const setSelectedChildId = externalOnChildSelect ?? setInternalSelectedChildId
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedStorybook, setSelectedStorybook] =
    useState<StorybookViewerProps['storybook']>(null)
  const [selectedChildName, setSelectedChildName] = useState('')
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  
  // State for filters, search, and view modes
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'generating'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'progress'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  const currentChild = useMemo(() => {
    if (!selectedChildId || !children.length) return null
    return children.find((child) => child.id === selectedChildId) ?? null
  }, [children, selectedChildId])

  // Determine if we're in overview mode (no child selected) or detail mode
  const isOverviewMode = !selectedChildId || !currentChild

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


  const openStorybook = async (child: ChildRecord, assessment: AssessmentRecord) => {
    if (!assessment.parent_visible) return

    try {
      // Always fetch the latest ai_report from the API to ensure we have the most recent version
      // Use API route to fetch latest data (bypasses RLS issues)
      const response = await fetch(
        `/api/parent/assessments/${assessment.id}/storybook`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store', // Always fetch fresh data
        }
      )

      let latestAssessment: { ai_report: string | null; parent_pdf_url: string | null; updated_at?: string | null } | null = null

      if (response.ok) {
        const data = await response.json()
        latestAssessment = data
      } else {
        // Fallback to cached version if API fails
        if (!assessment.ai_report) {
          return
        }
      }

      // Always use the fetched data if available, otherwise fallback to cached
      const reportToUse = latestAssessment?.ai_report ?? assessment.ai_report
      if (!reportToUse) {
        return
      }

      // Handle both cases: reportToUse might be a string (from database) or already an object (from API)
      const parsed = typeof reportToUse === 'string' 
        ? JSON.parse(reportToUse) as StorybookContent
        : reportToUse as StorybookContent
      if (!parsed?.pages?.length) {
        throw new Error('Storybook missing pages')
      }
      
      // Add cache-busting to image URLs to prevent browser caching
      // Use a stable timestamp based on when the storybook was last updated
      // This ensures fresh images are loaded when the storybook is regenerated
      const cacheBuster = latestAssessment?.updated_at 
        ? new Date(latestAssessment.updated_at).getTime() 
        : Date.now()
      
      // Log pages to verify articles are present
      console.log('[openStorybook] Parsed pages with articles:', parsed.pages.map(p => ({
        page_number: p.page_number,
        status: p.status,
        hasArticles: !!p.recommended_articles,
        articleCount: p.recommended_articles?.length ?? 0
      })))
      
      const storybookWithCacheBust = {
        ...parsed,
        pages: parsed.pages.map((page) => {
          const originalUrl = page.image_url
          const newUrl = originalUrl 
            ? `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}v=${cacheBuster}`
            : originalUrl
          
          // Preserve all page properties including recommended_articles
          return {
            ...page,
            image_url: newUrl,
            // Explicitly preserve recommended_articles if they exist
            recommended_articles: page.recommended_articles || undefined,
          }
        }),
      }
      
      // Log final storybook to verify articles are preserved
      console.log('[openStorybook] Final storybook with articles:', storybookWithCacheBust.pages.map(p => ({
        page_number: p.page_number,
        status: p.status,
        hasArticles: !!p.recommended_articles,
        articleCount: p.recommended_articles?.length ?? 0
      })))

      // Use storybook with cache-busted image URLs
      setSelectedStorybook(storybookWithCacheBust)
      setSelectedChildName(child.child_name)
      setSelectedPdfUrl(latestAssessment?.parent_pdf_url ?? assessment.parent_pdf_url ?? null)
      setIsViewerOpen(true)
    } catch (error) {
      console.error('[dashboard] failed to parse storybook:', error)
    }
  }


  // Calculate recent activity (last 5 assessments across all children)
  const recentActivity = useMemo(() => {
    const allAssessments = children.flatMap((child) =>
      child.assessments.map((assessment) => ({
        ...assessment,
        child_id: child.id,
        child_name: child.child_name,
      }))
    )

    return allAssessments
      .filter((a) => a.completed_at)
      .sort((a, b) => {
        const dateA = new Date(a.completed_at!).getTime()
        const dateB = new Date(b.completed_at!).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [children])

  // Calculate alerts
  const alerts = useMemo(() => {
    const pendingReviews = children.reduce(
      (sum, child) =>
        sum +
        child.assessments.filter(
          (a) => a.status === 'awaiting_review' || a.status === 'pending'
        ).length,
      0
    )

    const storybooksReady = children.reduce(
      (sum, child) =>
        sum +
        child.assessments.filter(
          (a) => a.status === 'approved' && a.parent_visible
        ).length,
      0
    )

    const generating = children.reduce(
      (sum, child) =>
        sum +
        child.assessments.filter(
          (a) => a.status === 'generating' || a.status === 'processing'
        ).length,
      0
    )

    return {
      pendingReviews,
      storybooksReady,
      generating,
    }
  }, [children])

  return (
    <div className="min-h-screen py-4 sm:py-8 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Welcome Section - Only show in overview mode */}
        {isOverviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-8 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="w-16 h-16 ring-4 ring-primary/10 shadow-md">
                    {profile?.avatar_url ? (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.full_name ?? 'Parent profile photo'}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-orange-700 text-white text-xl shadow-inner">
                      {profile?.full_name?.charAt(0) ?? 'P'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div>
                  <h1 className="text-3xl mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
                  </h1>
                  <p className="text-muted-foreground/80 text-base">
                    Track your children&apos;s developmental milestones
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Progress Overview - Show aggregate in overview, child-specific in detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">
                  {isOverviewMode ? 'Progress Overview' : `${currentChild?.child_name}'s Progress`}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const key = 'progress-overview'
                  setCollapsedSections(prev => {
                    const next = new Set(prev)
                    if (next.has(key)) next.delete(key)
                    else next.add(key)
                    return next
                  })
                }}
              >
                {collapsedSections.has('progress-overview') ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!collapsedSections.has('progress-overview') && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  // In detail mode, show child-specific stats; in overview, show aggregate
                  const assessmentsToUse = isOverviewMode
                    ? children.flatMap(child => child.assessments)
                    : (currentChild?.assessments ?? [])
                  
                  const approvedAssessments = assessmentsToUse.filter(a => a.status === 'approved' && a.parent_visible)
                  const pendingAssessments = assessmentsToUse.filter(a => a.status === 'awaiting_review' || a.status === 'generating' || a.status === 'processing')
                  
                  // Calculate report percentage: assessments with completed reports (approved + ai_report exists)
                  const totalAssessments = assessmentsToUse.length
                  const completedReports = assessmentsToUse.filter(a => 
                    a.status === 'approved' && a.parent_visible && a.ai_report
                  ).length
                  const reportProgress = totalAssessments > 0 ? Math.round((completedReports / totalAssessments) * 100) : 0
                  
                  // Get last assessment date
                  const lastAssessmentDate = assessmentsToUse
                    .map(a => a.completed_at)
                    .filter(Boolean)
                    .map(d => new Date(d as string).getTime())
                    .sort((a, b) => b - a)[0]

                  return (
                    <>
                      <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-4 border border-success/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-success" />
                            <span className="text-sm font-medium text-muted-foreground">Approved</span>
                          </div>
                          <span className="text-2xl font-bold text-success">{approvedAssessments.length}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Storybooks ready</p>
                      </div>
                      <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg p-4 border border-warning/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-warning" />
                            <span className="text-sm font-medium text-muted-foreground">Pending</span>
                          </div>
                          <span className="text-2xl font-bold text-warning">{pendingAssessments.length}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting review</p>
                      </div>
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">Progress</span>
                          </div>
                          <span className="text-2xl font-bold text-primary">{reportProgress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-orange-700"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${reportProgress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Reports completed</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-muted-foreground">Last Assessment</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lastAssessmentDate 
                            ? formatRelativeTime(new Date(lastAssessmentDate).toISOString())
                            : 'None yet'}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Quick Actions - Only show in overview mode */}
        {isOverviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="p-6 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white shadow-lg hover:shadow-xl transition-all"
                  asChild
                >
                  <Link href="/assessment">
                    <Plus className="w-5 h-5 mr-2" />
                    Start New Assessment
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5 shadow-md hover:shadow-lg transition-all"
                  asChild
                >
                  <Link href="/dashboard/parent/storybooks">
                    <BookOpen className="w-5 h-5 mr-2" />
                    View All Storybooks
                  </Link>
                </Button>
                {children.length === 0 && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 shadow-md hover:shadow-lg transition-all"
                    asChild
                  >
                    <Link href="/assessment">
                      <Baby className="w-5 h-5 mr-2" />
                      Add New Child
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Alerts & Notifications - Only show in overview mode */}
        {isOverviewMode && (alerts.pendingReviews > 0 || alerts.storybooksReady > 0 || alerts.generating > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Alerts & Notifications
              </h2>
              <div className="space-y-3">
                {alerts.pendingReviews > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-warning" />
                      <div>
                        <p className="font-medium text-foreground">
                          {alerts.pendingReviews} Assessment{alerts.pendingReviews !== 1 ? 's' : ''} Awaiting Review
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your assessments are being reviewed by physicians
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-warning/20 text-warning border-warning/30">
                      {alerts.pendingReviews}
                    </Badge>
                  </div>
                )}
                {alerts.storybooksReady > 0 && (
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium text-foreground">
                          {alerts.storybooksReady} Storybook{alerts.storybooksReady !== 1 ? 's' : ''} Ready to View
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your personalized storybooks are ready
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success text-success hover:bg-success/10"
                      asChild
                    >
                      <Link href="/dashboard/parent/storybooks">
                        View All
                      </Link>
                    </Button>
                  </div>
                )}
                {alerts.generating > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <div>
                        <p className="font-medium text-foreground">
                          {alerts.generating} Storybook{alerts.generating !== 1 ? 's' : ''} Generating
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your storybooks are being created
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      In Progress
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Recent Activity Feed - Only show in overview mode */}
        {isOverviewMode && recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Card className="p-6 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const key = 'recent-activity'
                    setCollapsedSections(prev => {
                      const next = new Set(prev)
                      if (next.has(key)) next.delete(key)
                      else next.add(key)
                      return next
                    })
                  }}
                >
                  {collapsedSections.has('recent-activity') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {!collapsedSections.has('recent-activity') && (
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const child = children.find((c) => c.id === activity.child_id)
                    const statusMeta = getStatusMeta(
                      activity.status,
                      activity.parent_visible
                    )
                    return (
                      <Link
                        key={activity.id}
                        href={`/dashboard/parent?child=${activity.child_id}`}
                        className="block p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                {activity.child_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-foreground">
                                  {activity.child_name}&apos;s Assessment
                                </p>
                                <Badge className={statusMeta.badgeClass}>
                                  {statusMeta.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(activity.completed_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              setSelectedChildId(activity.child_id)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        <div className={`grid grid-cols-1 ${children.length > 1 ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-4 sm:gap-6 lg:gap-8`}>
            {/* Your Children Section - Only show in overview mode */}
            {isOverviewMode && children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl">Your Children</h2>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {children.length} Children
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            {children.length === 0 ? (
              <Card className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to FirstSignFirst! 🎉</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Start tracking your child&apos;s developmental milestones today.
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    Our AI-powered assessments help you understand your child&apos;s growth and provide personalized insights.
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                    asChild
                  >
                    <Link href="/assessment">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Assessment
                    </Link>
                  </Button>
                </motion.div>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
                {children.map((child, index) => {
                  const age = monthsBetween(child.date_of_birth)
                  const completed = child.assessments.filter(
                    (assessment) => !!assessment.completed_at
                  ).length
                  const isSelected = currentChild?.id === child.id
                  const lastAssessmentDate = getLastAssessmentDate(child)
                  const hasPending = hasPendingAssessments(child)
                  
                  // Calculate child's overall progress
                  const childAssessments = child.assessments.filter(a => a.ai_report && a.parent_visible)
                  const childTotalMilestones = childAssessments.reduce((sum, assessment) => {
                    try {
                      const parsed = JSON.parse(assessment.ai_report!) as StorybookContent
                      return sum + (parsed?.pages?.length ?? 0)
                    } catch {
                      return sum
                    }
                  }, 0)
                  const childMetMilestones = childAssessments.reduce((sum, assessment) => {
                    try {
                      const parsed = JSON.parse(assessment.ai_report!) as StorybookContent
                      const met = parsed?.pages?.filter(p => (p.status ?? '').toLowerCase() === 'met').length ?? 0
                      return sum + met
                    } catch {
                      return sum
                    }
                  }, 0)
                  const childProgress = childTotalMilestones > 0 ? Math.round((childMetMilestones / childTotalMilestones) * 100) : 0

                  return (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card
                        className={`p-6 cursor-pointer transition-all shadow-md hover:shadow-lg ${
                          isSelected
                            ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10"
                            : "hover:border-primary/30 bg-white"
                        } ${hasPending ? 'ring-2 ring-warning/30' : ''}`}
                        onClick={() => setSelectedChildId(child.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                              {child.avatar_url ? (
                                <AvatarImage
                                  src={child.avatar_url}
                                  alt={child.child_name}
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                {child.child_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold">{child.child_name}</h3>
                                {hasPending && (
                                  <Badge className="bg-warning/10 text-warning border-warning/20 text-xs animate-pulse">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                                {childProgress >= 80 && childTotalMilestones > 0 && (
                                  <Badge className="bg-success/10 text-success border-success/20 text-xs">
                                    <Award className="w-3 h-3 mr-1" />
                                    Great Progress!
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {age} months • {child.gender ?? 'Gender not specified'}
                              </p>
                              {lastAssessmentDate && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  Last: {formatRelativeTime(lastAssessmentDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Indicator */}
                        {childTotalMilestones > 0 && (
                          <div className="mb-3 space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Overall Progress</span>
                              <span className="font-semibold">{childProgress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary to-orange-700"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${childProgress}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground">
                            {completed} assessment{completed !== 1 ? 's' : ''}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChildId(child.id);
                              }}
                              className="h-8"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push('/assessment');
                              }}
                              className="h-8"
                              title="Create new assessment"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
            </motion.div>
          )}

          {/* Assessments List - Only show in detail mode */}
          {!isOverviewMode && currentChild && (
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-6 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl">
                        {currentChild.child_name}&apos;s Assessments
                      </h2>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {currentChild.assessments.length} {currentChild.assessments.length === 1 ? 'Assessment' : 'Assessments'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <Link href="/assessment">
                        <Plus className="w-4 h-4 mr-2" />
                        New Assessment
                      </Link>
                    </Button>
                  </div>

                  {/* Filters, Search, and Sort Controls */}
                  {currentChild.assessments.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="generating">Generating</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-9 w-9 p-0"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('compact')}
                      className="h-9 w-9 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {currentChild.assessments.length === 0 ? (
                    <Card className="p-12 text-center shadow-md">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Start Tracking! 🎯</h3>
                    <p className="text-muted-foreground mb-2">
                      Create your first assessment for {currentChild.child_name} to begin tracking developmental milestones.
                    </p>
                    <p className="text-xs text-muted-foreground mb-6">
                      Our AI-powered system will generate personalized insights and recommendations based on your child&apos;s unique development.
                    </p>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                      asChild
                    >
                      <Link href="/assessment">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Assessment
                      </Link>
                    </Button>
                  </motion.div>
                    </Card>
                  ) : (
                    (() => {
                // Filter and sort assessments
                const filtered = currentChild.assessments.filter(assessment => {
                  // Search filter
                  const searchLower = searchTerm.toLowerCase()
                  const matchesSearch = !searchTerm || 
                    currentChild.child_name.toLowerCase().includes(searchLower) ||
                    assessment.id.toLowerCase().includes(searchLower)
                  
                  // Status filter
                  const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'approved' && assessment.status === 'approved') ||
                    (statusFilter === 'pending' && (assessment.status === 'awaiting_review' || assessment.status === 'pending')) ||
                    (statusFilter === 'generating' && (assessment.status === 'generating' || assessment.status === 'processing'))
                  
                  return matchesSearch && matchesStatus
                })

                // Sort assessments
                filtered.sort((a, b) => {
                  if (sortBy === 'newest') {
                    const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
                    const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
                    return dateB - dateA
                  } else if (sortBy === 'oldest') {
                    const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
                    const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
                    return dateA - dateB
                  } else if (sortBy === 'progress') {
                    // Sort by progress percentage
                    const getProgress = (assessment: AssessmentRecord) => {
                      if (!assessment.ai_report) return 0
                      try {
                        const parsed = JSON.parse(assessment.ai_report) as StorybookContent
                        const pages = parsed?.pages ?? []
                        const met = pages.filter(p => (p.status ?? '').toLowerCase() === 'met').length
                        return pages.length > 0 ? (met / pages.length) * 100 : 0
                      } catch {
                        return 0
                      }
                    }
                    return getProgress(b) - getProgress(a)
                  }
                  return 0
                })

                // Group by status if needed
                const grouped = statusFilter === 'all' ? {
                  approved: filtered.filter(a => a.status === 'approved'),
                  pending: filtered.filter(a => a.status === 'awaiting_review' || a.status === 'pending'),
                  generating: filtered.filter(a => a.status === 'generating' || a.status === 'processing'),
                } : { [statusFilter]: filtered }

                return (
                  <>
                    {Object.entries(grouped).map(([status, assessments]) => {
                      if (assessments.length === 0) return null
                      return (
                        <div key={status} className="space-y-4">
                          {statusFilter === 'all' && assessments.length > 0 && (
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold capitalize">{status} Assessments</h3>
                              <Badge variant="outline">{assessments.length}</Badge>
                            </div>
                          )}
                          {assessments.map((assessment, index) => {
                            const meta = getStatusMeta(assessment.status, assessment.parent_visible)
                            const assessmentDate = assessment.completed_at
                              ? new Date(assessment.completed_at).toLocaleDateString(undefined, {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'In progress'
                            const assessmentAge = formatRelativeTime(assessment.completed_at)

                            return (
                              <AssessmentPreviewCard
                                key={assessment.id}
                                assessment={assessment}
                                currentChild={currentChild}
                                meta={meta}
                                assessmentDate={`${assessmentDate} • ${assessmentAge}`}
                                index={index}
                                onViewStorybook={() => openStorybook(currentChild, assessment)}
                                isFavorite={favorites.has(assessment.id)}
                                onToggleFavorite={() => {
                                  setFavorites(prev => {
                                    const next = new Set(prev)
                                    if (next.has(assessment.id)) next.delete(assessment.id)
                                    else next.add(assessment.id)
                                    return next
                                  })
                                }}
                                pdfUrl={assessment.parent_pdf_url}
                              />
                            )
                          })}
                        </div>
                      )
                    })}
                    {filtered.length === 0 && (
                      <Card className="p-12 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2">No assessments found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your filters or search terms
                        </p>
                      </Card>
                    )}
                    </>
                  )
                })()
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
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

