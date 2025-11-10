'use client'

import * as React from 'react'
import Image from 'next/image'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
      ? '✅ Milestone Met'
      : '⚠️ Needs Support'
  const statusTone =
    (currentPage?.status ?? '').toLowerCase() === 'met' ? 'success' : 'warning'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-hidden border-0 bg-white p-0 shadow-2xl">
        <DialogHeader className="flex items-center justify-between border-b border-gray-100 bg-indigo-50 px-6 py-4">
          <div>
            <DialogTitle className="text-lg font-semibold text-indigo-700">
              {childName}&apos;s Storybook
            </DialogTitle>
            <DialogDescription className="text-sm text-indigo-900/70">
              Nurturing milestones together
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              aria-label="Close storybook"
              className="rounded-full p-2 text-indigo-700 transition hover:bg-indigo-100"
            >
              ✕
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between text-sm text-indigo-500">
            <span>
              Page {Math.min(pageIndex + 1, totalPages)} of {Math.max(totalPages, 1)}
            </span>
            {currentPage?.milestone_code ? (
              <span>Milestone {currentPage.milestone_code}</span>
            ) : null}
          </div>

          <div className="flex h-[60vh] flex-col gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 transition">
            {currentPage?.image_url ? (
              <div className="relative h-64 w-full overflow-hidden rounded-xl bg-white shadow-inner">
                <Image
                  src={currentPage.image_url}
                  alt={currentPage.milestone_code ?? 'Milestone illustration'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-white text-sm text-indigo-200">
                Image not available
              </div>
            )}
            <div className="flex flex-col gap-3 overflow-y-auto rounded-lg bg-white p-4 shadow-sm">
              <Badge
                variant={statusTone}
                className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-sm"
              >
                {statusLabel}
              </Badge>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
                {currentPage?.narrative_text ?? 'Narrative unavailable.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                onClick={goToPrevious}
                disabled={pageIndex === 0 || !totalPages}
                variant="outline"
              >
                ← Previous
              </Button>
              <Button
                onClick={goToNext}
                disabled={pageIndex >= totalPages - 1 || !totalPages}
                variant="outline"
              >
                Next →
              </Button>
            </div>
            <div className="flex gap-2">
              {pdfUrl ? (
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                  <a href={pdfUrl} target="_blank" rel="noreferrer">
                    Download PDF
                  </a>
                </Button>
              ) : null}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  )
}

