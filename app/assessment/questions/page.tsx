'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Baby, Heart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useGuestAssessmentStore } from '@/lib/stores/guest-assessment-store'

type MilestoneQuestion = {
  id: string
  question: string
  category: string
  description?: string | null
  display_order?: number | null
}

const categoryStyles: Record<string, string> = {
  'Social-Emotional': 'bg-rose-100 text-rose-700',
  'Language/Communication': 'bg-indigo-100 text-indigo-700',
  Cognitive: 'bg-amber-100 text-amber-700',
  Motor: 'bg-emerald-100 text-emerald-700',
}

const responseOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Sometimes', value: 'sometimes' },
  { label: 'Not Sure', value: 'not_sure' },
]

const AGE_BUCKETS = [6, 9, 12, 18, 24, 30, 36, 48]

export default function AssessmentQuestionsPage() {
  const router = useRouter()
  const childName = useGuestAssessmentStore((state) => state.childName)
  const ageMonths = useGuestAssessmentStore((state) => state.ageMonths)
  const disease = useGuestAssessmentStore((state) => state.disease)
  const responses = useGuestAssessmentStore((state) => state.responses)
  const setResponse = useGuestAssessmentStore((state) => state.setResponse)

  const [questions, setQuestions] = useState<MilestoneQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [notes, setNotes] = useState('')

  const matchedAgeMonths = useMemo(() => {
    if (ageMonths == null) return null
    return AGE_BUCKETS.reduce((prev, curr) =>
      Math.abs(curr - ageMonths) < Math.abs(prev - ageMonths) ? curr : prev
    )
  }, [ageMonths])

  useEffect(() => {
    if (ageMonths == null || disease == null) {
      router.replace('/assessment')
    }
  }, [ageMonths, disease, router])

  useEffect(() => {
    const fetchQuestions = async () => {
      if (matchedAgeMonths == null || !disease) return
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('milestones')
        .select('*')
        .eq('age_months', matchedAgeMonths)
        .eq('disease', disease)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (queryError) {
        setError('Unable to load questions. Please try again.')
        setQuestions([])
      } else if (!data || data.length === 0) {
        setQuestions([])
      } else {
        setQuestions(data as MilestoneQuestion[])
        setCurrentIndex(0)
      }

      setLoading(false)
    }

    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedAgeMonths, disease])

  const currentQuestion = useMemo(
    () => questions[currentIndex] ?? null,
    [questions, currentIndex]
  )

  useEffect(() => {
    if (!currentQuestion) return
    const existing = responses[currentQuestion.id]
    setNotes(existing?.notes ?? '')
  }, [currentQuestion, responses])

  useEffect(() => {
    if (!currentQuestion) return
    const existing = responses[currentQuestion.id]
    if (existing?.response) {
      const sanitizedNotes = notes.trim() ? notes : undefined
      if (existing.notes !== sanitizedNotes) {
        setResponse(currentQuestion.id, existing.response, sanitizedNotes)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  const handleSelect = (value: string) => {
    if (!currentQuestion) return
    const sanitizedNotes = notes.trim() ? notes : undefined
    setResponse(currentQuestion.id, value, sanitizedNotes)

    if (currentIndex === questions.length - 1) {
      router.push('/assessment/review')
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
    }
  }

  const handleNext = () => {
    if (!currentQuestion) return
    const existing = responses[currentQuestion.id]
    if (!existing?.response) return
    const sanitizedNotes = notes.trim() ? notes : undefined
    setResponse(currentQuestion.id, existing.response, sanitizedNotes)

    if (currentIndex === questions.length - 1) {
      router.push('/assessment/review')
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const progressValue = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center gap-6 py-10 text-slate-600">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
          <p className="text-sm font-medium text-slate-500">Loading questions...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center text-slate-600">
          <p className="text-base font-medium text-red-600">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/assessment')}>
            Go Back
          </Button>
        </div>
      )
    }

    if (!questions.length) {
      return (
        <Card className="mx-auto max-w-xl border-0 bg-white/95 text-slate-900 shadow-xl">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center">
            <div className="rounded-full bg-blue-100/70 p-4">
              <Baby className="h-16 w-16 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-slate-900">
                Assessment Not Yet Available
              </h3>
              <p className="text-base text-slate-600">
                We&apos;re currently developing assessment questions for{' '}
                <span className="font-semibold text-slate-800">
                  {matchedAgeMonths ?? ageMonths ?? 'this'}-month-old
                </span>{' '}
                children in the{' '}
                <span className="font-semibold text-slate-800">
                  {disease ?? 'selected'}
                </span>{' '}
                category.
              </p>
              <p className="text-sm text-slate-500">
                Our developmental assessments are available for specific age ranges. Please
                check back soon, or contact us if you have questions about your child&apos;s
                development.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-lg hover:shadow-xl sm:w-auto"
                onClick={() => router.push('/assessment')}
              >
                Adjust Assessment Details
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto"
                asChild
              >
                <Link href="mailto:support@firstsign.com">Contact Support</Link>
              </Button>
            </div>
            <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Assessments currently available for: 6, 9, 12, 18, 24, 30, 36, and 48 months
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!currentQuestion) {
      return null
    }

    const selectedResponse = responses[currentQuestion.id]?.response ?? ''
    const badgeClass = categoryStyles[currentQuestion.category] ?? 'bg-blue-100 text-blue-700'

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{progressValue}% Complete</span>
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={badgeClass}>{currentQuestion.category}</Badge>
            {disease ? (
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                {disease}
              </Badge>
            ) : null}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {currentQuestion.question}
          </h2>
          {currentQuestion.description ? (
            <CardDescription className="text-base text-slate-600">
              {currentQuestion.description}
            </CardDescription>
          ) : null}
        </div>

        <RadioGroup
          value={selectedResponse}
          onValueChange={handleSelect}
          className="grid gap-3"
        >
          {responseOptions.map((option) => (
            <RadioGroupItem key={option.value} value={option.value}>
              {option.label}
            </RadioGroupItem>
          ))}
        </RadioGroup>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Notes (optional)</label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add any observations, context, or examples you'd like to share."
            rows={4}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="secondary"
            className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-40"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          <Button
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-lg hover:shadow-xl sm:w-48"
            onClick={handleNext}
            disabled={!selectedResponse}
          >
            {currentIndex === questions.length - 1 ? 'Review Answers' : 'Next Question'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <Button
          variant="ghost"
          className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
          asChild
        >
          <Link href="/assessment">← Back</Link>
        </Button>

        <Card className="overflow-hidden border-0 bg-white/95 text-slate-900 shadow-2xl backdrop-blur">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-slate-950">
              {childName ? `${childName}'s Assessment` : 'Milestone Assessment'}
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Answer each question to help us understand your child&apos;s developmental
              progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  )
}

