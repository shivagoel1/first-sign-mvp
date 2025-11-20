'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, X, Download, Flag } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ImageWithFallback } from '@/components/figma/image-with-fallback'

interface StorybookViewerProps {
  isOpen: boolean
  onClose: () => void
  storybook: {
    pages: Array<{
      page_number: number
      narrative_text: string
      image_url?: string
      status?: string
      milestone_code?: string
    }>
  } | null
  childName: string
  pdfUrl: string | null
}

export function StorybookViewer({
  isOpen,
  onClose,
  storybook,
  childName,
  pdfUrl,
}: StorybookViewerProps) {
  const [pageIndex, setPageIndex] = React.useState(0)

  const pages = storybook?.pages ?? []
  const totalPages = pages.length
  const currentPage = pages[pageIndex]

  const goToPrevious = React.useCallback(() => {
    setPageIndex((index) => Math.max(0, index - 1))
  }, [])

  const goToNext = React.useCallback(() => {
    setPageIndex((index) => Math.min(totalPages - 1, index + 1))
  }, [totalPages])

  React.useEffect(() => {
    if (isOpen) {
      setPageIndex(0)
    }
  }, [isOpen])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToPrevious()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToNext()
      } else if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToNext, goToPrevious, onClose])

  const statusLabel =
    (currentPage?.status ?? '').toLowerCase() === 'met'
      ? 'Milestone Met'
      : 'Needs Support'
  const hasRedFlag = (currentPage?.status ?? '').toLowerCase() !== 'met'
  const displayText = currentPage?.milestone_code 
    ? `${currentPage.milestone_code.replace(/-/g, ' ')}` 
    : 'Milestone'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0 bg-gradient-to-r from-orange-50/50 via-white to-orange-50/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl mb-1 text-foreground">
                {childName}&apos;s Storybook
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Nurturing milestones together
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                aria-label="Close storybook"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="bg-white border-border text-foreground">
              Page {Math.min(pageIndex + 1, totalPages)} of {Math.max(totalPages, 1)}
            </Badge>
            {currentPage?.milestone_code && (
              <Badge variant="outline" className="bg-white border-border text-foreground">
                {currentPage.milestone_code}
              </Badge>
            )}
            {hasRedFlag && (
              <Badge className="bg-warning/10 text-warning border-warning/30">
                <Flag className="w-3 h-3 mr-1" />
                Needs Attention
              </Badge>
            )}
          </div>
        </div>

        {/* Storybook Page Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20">
          <div className="p-8">
            <Card className="overflow-hidden shadow-lg border-2">
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-orange-100/50 to-orange-50/50 relative overflow-hidden">
                {currentPage?.image_url ? (
                  <ImageWithFallback
                    src={currentPage.image_url}
                    alt={displayText}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                    Image not available
                  </div>
                )}
                {currentPage?.milestone_code && (
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border border-border">
                    <p className="text-xs uppercase tracking-wide text-foreground">{currentPage.milestone_code}</p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 bg-white">
                {currentPage?.milestone_code && (
                  <h3 className="text-2xl mb-4 text-foreground font-semibold">
                    {displayText}
                  </h3>
                )}
                <div className="space-y-4">
                  <Badge
                    variant={hasRedFlag ? 'outline' : 'default'}
                    className={hasRedFlag 
                      ? 'bg-warning/10 text-warning border-warning/30' 
                      : 'bg-success/10 text-success border-success/30'
                    }
                  >
                    {statusLabel}
                  </Badge>
                  <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                    {currentPage?.narrative_text ?? 'Narrative unavailable.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-gradient-to-r from-orange-50/50 to-orange-50/30">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={pageIndex === 0 || !totalPages}
              className="bg-white border-border hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {/* Page Indicators */}
            <div className="flex items-center gap-2">
              {pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPageIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === pageIndex
                      ? 'bg-primary w-8 shadow-sm'
                      : 'bg-muted-foreground/30 hover:bg-primary/50 w-2'
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToNext}
                disabled={pageIndex >= totalPages - 1 || !totalPages}
                className="bg-white border-border hover:bg-muted disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              {pdfUrl && (
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                  asChild
                >
                  <a href={pdfUrl} target="_blank" rel="noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

