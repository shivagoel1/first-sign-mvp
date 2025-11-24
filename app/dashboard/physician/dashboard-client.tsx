'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  CalendarDays, 
  ClipboardCheck, 
  FlagTriangleRight, 
  LogOut, 
  Mail, 
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { PhysicianReviewModal, AssessmentDetail } from '@/components/physician/review-modal'
import { ImageWithFallback } from '@/components/figma/image-with-fallback'

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
  aiProcessingStatus?: string | null
  aiProcessingProgress?: number | null
  aiReport?: string | null
  createdAt?: string | null
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

type PriorityLevel = 'high' | 'medium' | 'low'
type SortOption = 'newest' | 'oldest' | 'most_flags' | 'priority' | 'name'
type FilterOption = 'all' | 'high_priority' | 'has_flags' | 'processing' | 'ready'

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

// Calculate urgency score and priority level
function calculateUrgency(review: PendingReview): { score: number; level: PriorityLevel } {
  let score = 0
  
  // Red flags contribute heavily (0-50 points)
  score += Math.min(review.redFlagCount * 10, 50)
  
  // Time waiting contributes (0-30 points)
  if (review.createdAt) {
    const hoursWaiting = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60)
    score += Math.min(hoursWaiting / 2, 30) // 2 points per hour, max 30
  }
  
  // Processing status contributes (0-20 points)
  if (review.aiProcessingStatus === 'processing') {
    score += 10 // Still processing, lower priority
  } else if (review.aiProcessingStatus === 'completed') {
    score += 20 // Ready for review, higher priority
  }
  
  // Determine level
  if (score >= 60) return { score, level: 'high' }
  if (score >= 30) return { score, level: 'medium' }
  return { score, level: 'low' }
}

// Get priority styling
function getPriorityStyles(level: PriorityLevel) {
  switch (level) {
    case 'high':
      return {
        gradient: 'from-destructive/20 via-destructive/10 to-orange-50/30',
        border: 'border-destructive/40',
        pulse: 'animate-pulse',
        badge: 'bg-destructive/20 text-destructive border-destructive/40',
      }
    case 'medium':
      return {
        gradient: 'from-warning/20 via-warning/10 to-orange-50/30',
        border: 'border-warning/40',
        pulse: '',
        badge: 'bg-warning/20 text-warning border-warning/40',
      }
    default:
      return {
        gradient: 'from-orange-50/50 via-white to-orange-50/30',
        border: 'border-border',
        pulse: '',
        badge: 'bg-muted text-muted-foreground border-border',
      }
  }
}

// Get storybook thumbnail from ai_report
function getStorybookThumbnail(aiReport: string | null): string | null {
  if (!aiReport) return null
  try {
    const parsed = JSON.parse(aiReport)
    const firstPage = parsed?.pages?.[0]
    return firstPage?.image_url ?? null
  } catch {
    return null
  }
}

// Animated counter component
function AnimatedCounter({ value, duration = 1000 }: { value: number | string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const isNumber = typeof value === 'number'
  
  useEffect(() => {
    if (!isNumber) return
    
    const start = 0
    const end = value
    const startTime = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const current = Math.floor(start + (end - start) * progress)
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [value, duration, isNumber])
  
  return <span>{isNumber ? displayValue : value}</span>
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
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Calculate urgency for all reviews
  const reviewsWithUrgency = useMemo(() => {
    return pendingReviews.map(review => ({
      ...review,
      urgency: calculateUrgency(review),
    }))
  }, [pendingReviews])

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviewsWithUrgency

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (review) =>
          review.childName.toLowerCase().includes(query) ||
          review.parentName?.toLowerCase().includes(query) ||
          review.parentEmail?.toLowerCase().includes(query) ||
          review.assessmentId.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    switch (filterBy) {
      case 'high_priority':
        filtered = filtered.filter((r) => r.urgency.level === 'high')
        break
      case 'has_flags':
        filtered = filtered.filter((r) => r.redFlagCount > 0)
        break
      case 'processing':
        filtered = filtered.filter((r) => r.aiProcessingStatus === 'processing')
        break
      case 'ready':
        filtered = filtered.filter((r) => r.aiProcessingStatus === 'completed')
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => b.urgency.score - a.urgency.score)
        break
      case 'most_flags':
        filtered.sort((a, b) => b.redFlagCount - a.redFlagCount)
        break
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateA - dateB
        })
        break
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        break
      case 'name':
        filtered.sort((a, b) => a.childName.localeCompare(b.childName))
        break
    }

    return filtered
  }, [reviewsWithUrgency, searchQuery, filterBy, sortBy])

  // Get next review to review (highest priority)
  const nextReview = useMemo(() => {
    return filteredAndSortedReviews[0] ?? null
  }, [filteredAndSortedReviews])

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

    pollingIntervalRef.current = setInterval(async () => {
      if (!selectedAssessment?.assessmentId) return

      try {
        const cacheBuster = `?t=${Date.now()}`
        const response = await fetch(
          `/api/physician/assessments/${selectedAssessment.assessmentId}/detail${cacheBuster}`,
          {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
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
  }, [isModalOpen, selectedAssessment?.assessmentId, selectedAssessment?.aiProcessingStatus])

  // Track previous processing status to detect completion
  const prevProcessingStatusRef = useRef<string | null | undefined>(null)
  
  // Refresh assessment data when regeneration completes
  useEffect(() => {
    if (!isModalOpen || !selectedAssessment?.assessmentId) {
      prevProcessingStatusRef.current = null
      return
    }
    
    const currentStatus = selectedAssessment.aiProcessingStatus
    const prevStatus = prevProcessingStatusRef.current
    
    // If status changed from 'processing' to 'completed', refresh data
    if (prevStatus === 'processing' && currentStatus === 'completed') {
      // Refresh assessment data to get updated images
      const refreshData = async () => {
        try {
          const cacheBuster = `?t=${Date.now()}`
          const response = await fetch(
            `/api/physician/assessments/${selectedAssessment.assessmentId}/detail${cacheBuster}`,
            {
              method: 'GET',
              headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              },
            }
          )

          if (response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | AssessmentDetail
              | { error?: string }
              | null

            if (payload && !('error' in payload)) {
              setSelectedAssessment(payload as AssessmentDetail)
              console.log('[physician-dashboard] Refreshed assessment data after regeneration')
            }
          }
        } catch (error) {
          console.error('[physician-dashboard] Error refreshing assessment after regeneration:', error)
        }
      }
      
      // Small delay to ensure database is updated
      const timeoutId = setTimeout(refreshData, 2000)
      return () => clearTimeout(timeoutId)
    }
    
    // Update previous status
    prevProcessingStatusRef.current = currentStatus
  }, [isModalOpen, selectedAssessment?.assessmentId, selectedAssessment?.aiProcessingStatus])

  const handleReviewClick = useCallback(async (review: PendingReview) => {
    console.log('[physician-dashboard] Opening review for assessment:', review.assessmentId)
    setIsModalOpen(true)
    setIsLoadingDetail(true)
    setSelectedAssessment(null)
    
    try {
      // Add cache-busting to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`
      const response = await fetch(`/api/physician/assessments/${review.assessmentId}/detail${cacheBuster}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })
      
      // Parse response body first
      let payload: AssessmentDetail | { error?: string; details?: string } | null = null
      try {
        const text = await response.text()
        if (text) {
          payload = JSON.parse(text) as AssessmentDetail | { error?: string; details?: string }
        }
      } catch (parseError) {
        console.error('[physician-dashboard] Failed to parse response:', parseError)
        payload = null
      }

      if (!response.ok) {
        const errorMessage =
          (payload as { error?: string } | null)?.error ?? 'Unable to load assessment details.'
        const errorDetails = (payload as { details?: string } | null)?.details
        
        // Log error details safely (avoid circular references by converting to primitives)
        const statusCode = response.status
        const statusText = response.statusText || 'Unknown'
        const url = typeof response.url === 'string' ? response.url : 'unknown'
        
        // Log each property separately to avoid serialization issues
        console.error('[physician-dashboard] API error - Status:', statusCode)
        console.error('[physician-dashboard] API error - Status Text:', statusText)
        console.error('[physician-dashboard] API error - Message:', errorMessage)
        if (errorDetails) {
          console.error('[physician-dashboard] API error - Details:', errorDetails)
        }
        console.error('[physician-dashboard] API error - Assessment ID:', review.assessmentId)
        console.error('[physician-dashboard] API error - URL:', url)
        
        // For 404, provide more helpful message
        if (statusCode === 404) {
          toast.error(
            errorMessage.includes('results are not yet available')
              ? 'Assessment is being processed. Please try again in a moment.'
              : errorMessage
          )
        } else if (statusCode === 500) {
          toast.error(
            errorDetails 
              ? `${errorMessage}: ${errorDetails}`
              : errorMessage
          )
        } else {
          toast.error(errorMessage)
        }
        
        setIsModalOpen(false)
        setSelectedAssessment(null)
        return
      }

      if (!payload || 'error' in payload) {
        console.error('[physician-dashboard] Invalid response payload:', payload)
        toast.error('Invalid response from server. Please try again.')
        setIsModalOpen(false)
        setSelectedAssessment(null)
        return
      }

      setSelectedAssessment(payload as AssessmentDetail)
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
        setRecentlyReviewed((prev) => {
          // Filter out any existing entry with the same assessmentResultId to prevent duplicates
          const filtered = prev.filter(
            (item) => item.assessmentResultId !== selectedAssessment.assessmentResultId
          )
          return [
            {
              assessmentResultId: selectedAssessment.assessmentResultId,
              assessmentId: selectedAssessment.assessmentId,
              childName: selectedAssessment.childName,
              status: updatedStatus,
              reviewedAt: new Date().toISOString(),
            },
            ...filtered,
          ]
        })

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

  const toggleCardExpand = (reviewId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) {
        next.delete(reviewId)
      } else {
        next.add(reviewId)
      }
      return next
    })
  }

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(reviewId)) {
        next.delete(reviewId)
      } else {
        next.add(reviewId)
      }
      return next
    })
  }

  const handleBulkAction = async (action: ReviewAction) => {
    if (selectedReviews.size === 0) {
      toast.error('Please select at least one assessment.')
      return
    }

    // For now, just show a toast - full implementation would require API changes
    toast.info(`Bulk ${action} action would be performed on ${selectedReviews.size} assessments.`)
    setSelectedReviews(new Set())
  }

  const statsCards = useMemo(
    () => [
      {
        label: 'Pending Reviews',
        value: stats.pendingReviews,
        icon: ClipboardCheck,
        badgeClass: 'bg-warning/10 text-warning',
        trend: stats.pendingReviews > 0 ? 'up' : 'neutral' as 'up' | 'down' | 'neutral',
      },
      {
        label: 'Approved Assessments',
        value: stats.approvedAssessments,
        icon: CheckIcon,
        badgeClass: 'bg-success/10 text-success',
        trend: 'up' as 'up' | 'down' | 'neutral',
      },
      {
        label: 'Avg. Review Time',
        value: stats.averageReviewTime,
        icon: CalendarDays,
        badgeClass: 'bg-secondary-accent/10 text-secondary-accent',
        trend: 'neutral' as 'up' | 'down' | 'neutral',
      },
    ],
    [stats]
  )

  return (
    <div className="min-h-screen py-6 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
      <div className="w-full px-4 max-w-7xl mx-auto">
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
            {statsCards.map(({ label, value, icon: Icon, badgeClass, trend }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card className="p-6 shadow-md hover:shadow-lg transition-all border-2">
                  <CardContent className="flex items-center justify-between p-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                        {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                        {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                      </div>
                      <p className="mt-2 text-3xl font-semibold">
                        <AnimatedCounter value={value} />
                      </p>
                    </div>
                    <span className={`rounded-full p-3 ${badgeClass} shadow-sm`}>
                      <Icon className="h-6 w-6" />
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </header>

        <section id="pending-reviews" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">Pending Reviews</h2>
              <Badge variant="outline" className="px-3 py-1">
                {filteredAndSortedReviews.length} {searchQuery || filterBy !== 'all' ? 'filtered' : 'awaiting'}
              </Badge>
            </div>
            {nextReview && (
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                onClick={() => handleReviewClick(nextReview)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Review Next ({nextReview.childName})
              </Button>
            )}
          </div>

          {/* Filters and Search */}
          <Card className="p-4 shadow-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by child name, parent, or assessment ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="high_priority">High Priority</SelectItem>
                  <SelectItem value="has_flags">Has Red Flags</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready to Review</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="most_flags">Most Flags</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Bulk Actions */}
            {selectedReviews.size > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedReviews.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('needs_revision')}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReviews(new Set())}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>

          {filteredAndSortedReviews.length === 0 ? (
            <Card className="p-12 text-center">
              <CardContent className="p-0">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || filterBy !== 'all'
                    ? 'No assessments match your filters.'
                    : 'No assessments awaiting your review right now.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <AnimatePresence>
                {filteredAndSortedReviews.map((review) => {
                  const priorityStyles = getPriorityStyles(review.urgency.level)
                  const isExpanded = expandedCards.has(review.assessmentResultId)
                  const isSelected = selectedReviews.has(review.assessmentResultId)
                  const thumbnail = getStorybookThumbnail(review.aiReport ?? null)
                  const hoursWaiting = review.createdAt
                    ? Math.floor((Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60))
                    : 0
                  const isUrgent = hoursWaiting > 24

                  return (
                    <motion.div
                      key={review.assessmentResultId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card
                        className={`p-6 shadow-lg hover:shadow-xl transition-all border-2 ${
                          priorityStyles.border
                        } bg-gradient-to-br ${priorityStyles.gradient} ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        } ${isUrgent ? priorityStyles.pulse : ''}`}
                      >
                        <CardHeader className="space-y-2 p-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleReviewSelection(review.assessmentResultId)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                  {review.childName}
                                  {isUrgent && (
                                    <Badge className="bg-destructive/20 text-destructive border-destructive/40 text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {hoursWaiting}h
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  Age {monthsBetween(review.childDob)} • Submitted{' '}
                                  {review.completedAt
                                    ? new Date(review.completedAt).toLocaleDateString()
                                    : '—'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={priorityStyles.badge}>
                                {review.urgency.level.toUpperCase()} PRIORITY
                              </Badge>
                              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                                <FlagTriangleRight className="mr-1 h-4 w-4" />
                                {review.redFlagCount} flag{review.redFlagCount === 1 ? '' : 's'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 p-0 mt-4">
                          {/* Thumbnail Preview */}
                          {thumbnail && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-border">
                              <ImageWithFallback
                                src={thumbnail}
                                alt="Storybook preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-black/50 text-white backdrop-blur-sm">
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  Preview
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Progress Indicator */}
                          {review.aiProcessingStatus === 'processing' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Generating storybook...</span>
                                <span>{review.aiProcessingProgress ?? 0}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${review.aiProcessingProgress ?? 0}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="rounded-lg bg-white/50 backdrop-blur-sm p-4 text-sm border border-border/50">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {review.parentName ?? 'Parent'} • {review.parentEmail ?? '—'}
                              </span>
                            </div>
                          </div>

                          {/* Expandable Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-2 pt-2 border-t border-border/50">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Urgency Score:</span>
                                      <span className="ml-2 font-semibold">{review.urgency.score.toFixed(0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Assessment ID:</span>
                                      <span className="ml-2 font-mono text-xs">{review.assessmentId.slice(0, 8)}...</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-secondary-accent hover:bg-secondary-accent/90 text-white shadow-md"
                              onClick={() => handleReviewClick(review)}
                            >
                              Review Assessment
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleCardExpand(review.assessmentResultId)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        <section id="recently-reviewed" className="space-y-4 mt-8 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recently Reviewed</h2>
          </div>
          {recentlyReviewed.length === 0 ? (
            <Card className="p-6">
              <CardContent className="p-0 text-center text-muted-foreground">
                <p>No recent reviews yet. Completed assessments will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {recentlyReviewed.map((review, index) => (
                <Card key={`${review.assessmentResultId}-${review.reviewedAt || index}`} className="p-6 shadow-md hover:shadow-lg transition-all">
                  <CardHeader className="space-y-2 p-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{review.childName}</CardTitle>
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
