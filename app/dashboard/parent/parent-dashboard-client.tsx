'use client'

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
import { StorybookViewer } from '@/components/dashboard/storybook-viewer'
import {
  Baby,
  BookOpen,
  CalendarDays,
  RefreshCw,
  Smile,
  UserRound,
  Plus,
  LogOut,
  Eye,
  Download,
  FileText,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
    <Card className="p-8">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smile className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-base text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

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

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
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
                    Track your children's developmental milestones
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={false}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </motion.div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white h-14 shadow-lg hover:shadow-xl transition-all"
                  asChild
                >
                  <Link href="/assessment">
                    <Plus className="w-5 h-5 mr-2" />
                    Start New Assessment
                  </Link>
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Family Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 mb-8 shadow-lg border-orange-100">
            <h2 className="text-2xl mb-6">Family Snapshot</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: UserRound, bgClass: "bg-primary/10", hoverBgClass: "group-hover:bg-primary/20", iconClass: "text-primary", label: "Selected Child", value: highlightedChild?.child_name || "-" },
                { icon: BookOpen, bgClass: "bg-success/10", hoverBgClass: "group-hover:bg-success/20", iconClass: "text-success", label: "Progress", value: `${completionRate}%` },
                { icon: Baby, bgClass: "bg-secondary-accent/10", hoverBgClass: "group-hover:bg-secondary-accent/20", iconClass: "text-secondary-accent", label: "Children", value: children.length },
                { icon: FileText, bgClass: "bg-warning/10", hoverBgClass: "group-hover:bg-warning/20", iconClass: "text-warning", label: "Assessments", value: totalAssessments }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-4 group"
                >
                  <div className={`w-12 h-12 ${stat.bgClass} ${stat.hoverBgClass} rounded-xl flex items-center justify-center transition-colors`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-2xl">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 inline mr-2" />
                Most recent assessment: {latestAssessmentDate ?? 'Ready when you are'}
              </p>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Your Children Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl mb-6">Your Children</h2>
            <div className="space-y-4">
              {children.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">No children registered yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first assessment
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    asChild
                  >
                    <Link href="/assessment">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Assessment
                    </Link>
                  </Button>
                </Card>
              ) : (
                children.map((child, index) => {
                  const age = monthsBetween(child.date_of_birth)
                  const completed = child.assessments.filter(
                    (assessment) => !!assessment.completed_at
                  ).length
                  const isSelected = currentChild?.id === child.id

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
                        }`}
                        onClick={() => setSelectedChildId(child.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
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
                            <div>
                              <h3 className="text-lg">{child.child_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {age} months • {child.gender ?? 'Gender not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {completed} assessment{completed !== 1 ? 's' : ''}
                          </p>
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "ghost"}
                            className={isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChildId(child.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Assessments List */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">
                {currentChild ? `${currentChild.child_name}'s Assessments` : "Select a Child"}
              </h2>
              {currentChild && (
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
              )}
            </div>

            <div className="space-y-4">
              {!currentChild ? (
                <Card className="p-12 text-center shadow-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">No child selected</h3>
                  <p className="text-muted-foreground">
                    Select a child from the left to view their assessments
                  </p>
                </Card>
              ) : currentChild.assessments.length === 0 ? (
                <Card className="p-12 text-center shadow-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">No assessments yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start tracking {currentChild.child_name}'s developmental milestones
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    asChild
                  >
                    <Link href="/assessment">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Assessment
                    </Link>
                  </Button>
                </Card>
              ) : (
                currentChild.assessments.map((assessment, index) => {
                  const meta = getStatusMeta(assessment.status)
                  const assessmentDate = assessment.completed_at
                    ? new Date(assessment.completed_at).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'In progress'

                  return (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card className="p-6 shadow-md hover:shadow-lg transition-shadow bg-white">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg">Assessment {assessment.id.slice(0, 8)}...</h3>
                                <Badge className={meta.badgeClass}>
                                  {meta.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="w-4 h-4" />
                                <span>{assessmentDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 rounded-lg border ${
                            assessment.status === "approved" ? "bg-gradient-to-r from-success/5 to-success/10 border-success/20" :
                            assessment.status === "generating" ? "bg-gradient-to-r from-secondary-accent/5 to-secondary-accent/10 border-secondary-accent/20" :
                            assessment.status === "needs_revision" || assessment.status === "rejected" ? "bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20" :
                            "bg-gradient-to-r from-warning/5 to-warning/10 border-warning/20"
                          }`}>
                            <p className="text-sm">{meta.message}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {assessment.status === 'approved' && assessment.parent_visible ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => openStorybook(currentChild, assessment)}
                              >
                                <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                                View Storybook
                              </Button>
                            ) : assessment.parent_visible && assessment.ai_report ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => openStorybook(currentChild, assessment)}
                              >
                                <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                                View Storybook
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 bg-secondary-accent/10 rounded-md">
                                <div className="w-4 h-4 border-2 border-secondary-accent border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm text-secondary-accent">Storybook in progress...</span>
                              </div>
                            )}
                            {/* Show download button whenever PDF is available, regardless of status */}
                            {assessment.parent_pdf_url ? (
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
                                asChild
                              >
                                <a
                                  href={assessment.parent_pdf_url}
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
                                className="whitespace-nowrap"
                                disabled
                                title="PDF is being generated. Please check back soon."
                              >
                                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                                PDF Generating...
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
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

