'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Eye,
  Share2,
  Calendar,
  Baby,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  Grid3x3,
  List,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'
import { StorybookViewer } from '@/components/dashboard/storybook-viewer'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type StorybookContent = {
  pages?: Array<{
    page_number: number
    status?: string
    image_url?: string
    narrative_text?: string
    category?: string
  }>
}

type AssessmentWithChild = {
  id: string
  completed_at: string | null
  status: string | null
  parent_visible: boolean | null
  parent_pdf_url: string | null
  ai_report: string | null
  child_id: string
  child_name: string
  child_dob: string
  child_gender: string | null
}

type AllStorybooksViewProps = {
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

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function getStatusMeta(status: string | null, parentVisible: boolean | null) {
  if (!status) {
    return { label: 'Pending', badgeClass: 'bg-warning/10 text-warning border-warning/20' }
  }
  if (status === 'awaiting_review' || status === 'pending') {
    return { label: 'Awaiting Review', badgeClass: 'bg-warning/10 text-warning border-warning/20' }
  }
  if (status === 'generating' || status === 'processing') {
    return { label: 'Generating', badgeClass: 'bg-primary/10 text-primary border-primary/20' }
  }
  if (status === 'approved' && parentVisible) {
    return { label: 'Approved', badgeClass: 'bg-success/10 text-success border-success/20' }
  }
  return { label: 'Pending', badgeClass: 'bg-warning/10 text-warning border-warning/20' }
}

export function AllStorybooksView({ children }: AllStorybooksViewProps) {

  // Flatten all assessments with child info
  const allAssessments: AssessmentWithChild[] = useMemo(() => {
    return children.flatMap((child) =>
      child.assessments.map((assessment) => ({
        ...assessment,
        child_id: child.id,
        child_name: child.child_name,
        child_dob: child.date_of_birth,
        child_gender: child.gender,
      }))
    )
  }, [children])

  // Filter to only assessments with storybooks (have ai_report and parent_visible)
  const storybookAssessments = useMemo(() => {
    return allAssessments.filter(
      (a) => a.ai_report && (a.parent_visible || a.status === 'approved')
    )
  }, [allAssessments])

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [childFilter, setChildFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedStorybook, setSelectedStorybook] = useState<any>(null)
  const [selectedChildName, setSelectedChildName] = useState('')
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'none' | 'child' | 'date' | 'status'>('none')

  // Filtered and grouped assessments
  const filteredAssessments = useMemo(() => {
    const filtered = storybookAssessments.filter((assessment) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        assessment.child_name.toLowerCase().includes(searchLower) ||
        assessment.id.toLowerCase().includes(searchLower)

      // Child filter
      const matchesChild = childFilter === 'all' || assessment.child_id === childFilter

      // Status filter
      const statusMeta = getStatusMeta(assessment.status, assessment.parent_visible)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'approved' && statusMeta.label === 'Approved') ||
        (statusFilter === 'pending' && statusMeta.label === 'Awaiting Review') ||
        (statusFilter === 'generating' && statusMeta.label === 'Generating')

      return matchesSearch && matchesChild && matchesStatus
    })

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0
      return dateB - dateA
    })

    return filtered
  }, [storybookAssessments, searchTerm, childFilter, statusFilter])

  // Group assessments
  const groupedAssessments = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Storybooks': filteredAssessments }
    }

    if (groupBy === 'child') {
      const grouped: Record<string, AssessmentWithChild[]> = {}
      filteredAssessments.forEach((assessment) => {
        const key = assessment.child_name
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(assessment)
      })
      return grouped
    }

    if (groupBy === 'date') {
      const grouped: Record<string, AssessmentWithChild[]> = {}
      filteredAssessments.forEach((assessment) => {
        const date = assessment.completed_at
          ? new Date(assessment.completed_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })
          : 'No Date'
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(assessment)
      })
      return grouped
    }

    if (groupBy === 'status') {
      const grouped: Record<string, AssessmentWithChild[]> = {}
      filteredAssessments.forEach((assessment) => {
        const statusMeta = getStatusMeta(assessment.status, assessment.parent_visible)
        const key = statusMeta.label
        if (!grouped[key]) {
          grouped[key] = []
        }
        grouped[key].push(assessment)
      })
      return grouped
    }

    return { 'All Storybooks': filteredAssessments }
  }, [filteredAssessments, groupBy])

  // Stats
  const stats = useMemo(() => {
    const approved = storybookAssessments.filter(
      (a) => a.status === 'approved' && a.parent_visible
    ).length
    const pending = storybookAssessments.filter(
      (a) => a.status === 'awaiting_review' || a.status === 'pending'
    ).length
    const generating = storybookAssessments.filter(
      (a) => a.status === 'generating' || a.status === 'processing'
    ).length

    let totalMilestones = 0
    let milestonesMet = 0

    storybookAssessments.forEach((assessment) => {
      try {
        const parsed = JSON.parse(assessment.ai_report!) as StorybookContent
        const pages = parsed?.pages ?? []
        totalMilestones += pages.length
        milestonesMet += pages.filter((p) => (p.status ?? '').toLowerCase() === 'met').length
      } catch {
        // Ignore parse errors
      }
    })

    return {
      total: storybookAssessments.length,
      approved,
      pending,
      generating,
      totalMilestones,
      milestonesMet,
    }
  }, [storybookAssessments])

  const openStorybook = async (assessment: AssessmentWithChild) => {
    try {
      const response = await fetch(
        `/api/parent/assessments/${assessment.id}/storybook?t=${Date.now()}`,
        { cache: 'no-store' }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch storybook')
      }

      const data = await response.json()
      const reportToUse = data.ai_report || assessment.ai_report

      if (!reportToUse) {
        throw new Error('Storybook not available')
      }

      const parsed = JSON.parse(reportToUse) as StorybookContent

      if (!parsed.pages || parsed.pages.length === 0) {
        throw new Error('Storybook missing pages')
      }

      // Cache bust images
      const storybookWithCacheBust = {
        ...parsed,
        pages: parsed.pages.map((page) => ({
          ...page,
          image_url: page.image_url
            ? `${page.image_url}${page.image_url.includes('?') ? '&' : '?'}v=${Date.now()}`
            : undefined,
        })),
      }

      setSelectedStorybook(storybookWithCacheBust)
      setSelectedChildName(assessment.child_name)
      setSelectedPdfUrl(assessment.parent_pdf_url)
    } catch (error) {
      console.error('[storybooks] Failed to open storybook:', error)
      alert('Failed to load storybook. Please try again.')
    }
  }

  const handleDownloadPDF = async (assessment: AssessmentWithChild) => {
    if (!assessment.parent_pdf_url) {
      alert('PDF not available yet. Please try again later.')
      return
    }

    try {
      const response = await fetch(assessment.parent_pdf_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${assessment.child_name}_storybook_${assessment.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('[storybooks] Failed to download PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  const handleShare = async (assessment: AssessmentWithChild) => {
    const shareData = {
      title: `${assessment.child_name}'s Developmental Storybook`,
      text: `Check out ${assessment.child_name}'s developmental milestone assessment from FirstSignFirst`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[storybooks] Share failed:', error)
      }
    }
  }

  // Edge case: No children
  if (children.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Children Yet</h2>
          <p className="text-muted-foreground mb-6">
            Add a child to start creating storybooks and tracking developmental milestones.
          </p>
          <Button asChild>
            <Link href="/assessment">
              <Baby className="w-4 h-4 mr-2" />
              Add Your First Child
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Edge case: No storybooks
  if (storybookAssessments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">All Storybooks</h1>
          <p className="text-muted-foreground">View and manage all your children&apos;s storybooks</p>
        </div>

        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Storybooks Yet</h2>
          <p className="text-muted-foreground mb-6">
            Complete an assessment to generate your first personalized storybook.
          </p>
          <Button asChild>
            <Link href="/assessment">
              Start New Assessment
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full px-4 pt-6 pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold">All Storybooks</h1>
            <p className="text-muted-foreground">
              View and manage all your children&apos;s storybooks ({stats.total} total)
            </p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard/parent">
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Approved</div>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Pending</div>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Generating</div>
            <div className="text-2xl font-bold text-primary">{stats.generating}</div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by child name or assessment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Child Filter */}
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.child_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="generating">Generating</SelectItem>
            </SelectContent>
          </Select>

          {/* Group By */}
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="No Grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="child">Group by Child</SelectItem>
              <SelectItem value="date">Group by Date</SelectItem>
              <SelectItem value="status">Group by Status</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex gap-2 shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="flex-shrink-0"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="flex-shrink-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || childFilter !== 'all' || statusFilter !== 'all') && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setChildFilter('all')
                setStatusFilter('all')
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
            <span className="text-sm text-muted-foreground">
              {filteredAssessments.length} storybook{filteredAssessments.length !== 1 ? 's' : ''}{' '}
              found
            </span>
          </div>
        )}
      </Card>

      {/* Storybooks Grid/List */}
      {filteredAssessments.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No storybooks found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setChildFilter('all')
              setStatusFilter('all')
            }}
          >
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAssessments).map(([groupName, assessments]) => (
            <div key={groupName}>
              {groupBy !== 'none' && (
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {groupName}
                  <Badge variant="secondary">{assessments.length}</Badge>
                </h2>
              )}

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assessments.map((assessment) => {
                    const statusMeta = getStatusMeta(assessment.status, assessment.parent_visible)
                    let previewImage: string | undefined
                    let totalPages = 0
                    let milestonesMet = 0

                    try {
                      const parsed = JSON.parse(assessment.ai_report!) as StorybookContent
                      const pages = parsed?.pages ?? []
                      totalPages = pages.length
                      milestonesMet = pages.filter(
                        (p) => (p.status ?? '').toLowerCase() === 'met'
                      ).length
                      previewImage = pages[0]?.image_url
                    } catch {
                      // Ignore parse errors
                    }

                    return (
                      <motion.div
                        key={assessment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          {/* Preview Image */}
                          {previewImage ? (
                            <div className="relative h-48 w-full bg-muted">
                              <Image
                                src={previewImage}
                                alt={`${assessment.child_name}'s storybook preview`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-primary/40" />
                            </div>
                          )}

                          <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link
                                    href={`/dashboard/parent?child=${assessment.child_id}`}
                                    className="font-semibold hover:text-primary transition-colors"
                                  >
                                    {assessment.child_name}
                                  </Link>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatRelativeTime(assessment.completed_at)}
                                </p>
                              </div>
                              <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
                            </div>

                            {/* Stats */}
                            <div className="mb-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Pages:</span>{' '}
                                <span className="font-semibold">{totalPages}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1"
                                onClick={() => openStorybook(assessment)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              {assessment.parent_pdf_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadPDF(assessment)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShare(assessment)}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => {
                    const statusMeta = getStatusMeta(assessment.status, assessment.parent_visible)
                    let totalPages = 0
                    let milestonesMet = 0

                    try {
                      const parsed = JSON.parse(assessment.ai_report!) as StorybookContent
                      const pages = parsed?.pages ?? []
                      totalPages = pages.length
                      milestonesMet = pages.filter(
                        (p) => (p.status ?? '').toLowerCase() === 'met'
                      ).length
                    } catch {
                      // Ignore parse errors
                    }

                    return (
                      <Card key={assessment.id} className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <Link
                            href={`/dashboard/parent?child=${assessment.child_id}`}
                            className="font-semibold hover:text-primary transition-colors min-w-[120px]"
                          >
                            {assessment.child_name}
                          </Link>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Date:</span>{' '}
                              {formatRelativeTime(assessment.completed_at)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pages:</span>{' '}
                              <span className="font-semibold">{totalPages}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
                            <div className="flex gap-2 ml-auto sm:ml-0">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openStorybook(assessment)}
                                className="flex-1 sm:flex-initial"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              {assessment.parent_pdf_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadPDF(assessment)}
                                  className="flex-shrink-0"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShare(assessment)}
                                className="flex-shrink-0"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Storybook Viewer Modal */}
      {selectedStorybook && (
        <StorybookViewer
          isOpen={!!selectedStorybook}
          onClose={() => {
            setSelectedStorybook(null)
            setSelectedChildName('')
            setSelectedPdfUrl(null)
          }}
          storybook={selectedStorybook}
          childName={selectedChildName}
          pdfUrl={selectedPdfUrl}
        />
      )}
    </div>
  )
}

