'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Baby, Lightbulb } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/header'
import { createClient } from '@/lib/supabase/client'
import { useGuestAssessmentStore } from '@/lib/stores/guest-assessment-store'

type MilestoneQuestion = {
  id: string
  question: string
  category: string
  description?: string | null
  display_order?: number | null
  options?: string | null
  question_type?: string | null
}

const categoryStyles: Record<string, { bg: string; text: string }> = {
  'Social-Emotional': { bg: 'bg-primary/10', text: 'text-primary' },
  'Language/Communication': { bg: 'bg-secondary-accent/10', text: 'text-secondary-accent' },
  Cognitive: { bg: 'bg-success/10', text: 'text-success' },
  Motor: { bg: 'bg-warning/10', text: 'text-warning' },
}

// Parse response options from database or use defaults
const getResponseOptions = (question: MilestoneQuestion) => {
  // If database has options field (JSON string), parse it
  if (question.options) {
    try {
      const parsed = JSON.parse(question.options) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Map options to values - use index to ensure unique values
        return parsed.map((opt, idx) => {
          const lower = opt.toLowerCase()
          let value = `option_${idx}`
          // Try to map to standard values if possible
          if (lower.includes('not yet') || lower.includes('rarely') || lower === 'no' || lower.includes('cannot')) {
            value = 'no'
          } else if (lower.includes('sometimes')) {
            value = 'sometimes'
          } else if (lower.includes('not sure')) {
            value = 'not_sure'
          } else if (lower.includes('yes') || lower.includes('frequently') || lower.includes('always')) {
            value = 'yes'
          }
          return { label: opt, value }
        })
      }
    } catch {
      // If parsing fails, fall through to defaults
    }
  }
  
  // Default options matching Figma design pattern
  return [
    { label: 'Yes, frequently', value: 'yes' },
    { label: 'Sometimes', value: 'sometimes' },
    { label: 'Not yet', value: 'no' },
  ]
}

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
    // Only load notes if there's a valid response
    if (existing?.response) {
      const responseOptions = getResponseOptions(currentQuestion)
      const validOptionValues = responseOptions.map(opt => opt.value)
      if (validOptionValues.includes(existing.response)) {
        setNotes(existing.notes ?? '')
      } else {
        // Clear notes if response is invalid
        setNotes('')
      }
    } else {
      setNotes('')
    }
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
    // Only save the response, don't navigate - user must click Next
    const sanitizedNotes = notes.trim() ? notes : undefined
    setResponse(currentQuestion.id, value, sanitizedNotes)
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
        <div className="flex flex-col items-center gap-6 py-10 text-muted-foreground">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium">Loading questions...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-base font-medium text-destructive">{error}</p>
          <Button variant="outline" onClick={() => router.push('/assessment')}>
            Go Back
          </Button>
        </div>
      )
    }

    if (!questions.length) {
      return (
        <Card className="mx-auto max-w-xl">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Baby className="h-16 w-16 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                Assessment Not Yet Available
              </h3>
              <p className="text-base text-muted-foreground">
                We&apos;re currently developing assessment questions for{' '}
                <span className="font-semibold">
                  {matchedAgeMonths ?? ageMonths ?? 'this'}-month-old
                </span>{' '}
                children in the{' '}
                <span className="font-semibold">
                  {disease ?? 'selected'}
                </span>{' '}
                category.
              </p>
              <p className="text-sm text-muted-foreground">
                Our developmental assessments are available for specific age ranges. Please
                check back soon, or contact us if you have questions about your child&apos;s
                development.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground sm:w-auto"
                onClick={() => router.push('/assessment')}
              >
                Adjust Assessment Details
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                asChild
              >
                <Link href="mailto:support@firstsignfirst.com">Contact Support</Link>
              </Button>
            </div>
            <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Assessments currently available for: 6, 9, 12, 18, 24, 30, 36, and 48 months
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!currentQuestion) {
      return null
    }

    const storedResponse = responses[currentQuestion.id]?.response
    const responseOptions = getResponseOptions(currentQuestion)
    // Only use stored response if it matches one of the current options
    const validOptionValues = responseOptions.map(opt => opt.value)
    const selectedResponse = storedResponse && validOptionValues.includes(storedResponse) 
      ? storedResponse 
      : ''
    const categoryStyle = categoryStyles[currentQuestion.category] ?? { bg: 'bg-primary/10', text: 'text-primary' }

    return (
      <motion.div
        key={`question-${currentQuestion.id}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Badges for Area and Focus */}
        <div className="flex items-center gap-2 mb-6">
          <Badge className="bg-success/10 text-success border-success/20 font-semibold">
            {currentQuestion.category.toUpperCase()}
          </Badge>
          {disease && (
            <Badge className="bg-secondary-accent/10 text-secondary-accent border-secondary-accent/20 font-semibold">
              {getFocusAreaDisplay()}
            </Badge>
          )}
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-2xl mb-6">{currentQuestion.question}</h3>

          <RadioGroup
            value={selectedResponse || undefined}
            onValueChange={handleSelect}
            className="space-y-3"
          >
            {responseOptions.map((option, index) => {
              const isSelected = selectedResponse === option.value
              return (
                <motion.div 
                  key={`${currentQuestion.id}-option-${index}-${option.value}`} 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={`option-${index}`}
                    variant="simple"
                  />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className={`cursor-pointer flex-1 py-4 px-5 rounded-lg border-2 transition-all duration-200 ease-in-out flex items-center ${
                      isSelected
                        ? "border-primary bg-primary/5 scale-[1.02] shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01] hover:shadow-md"
                    }`}
                  >
                    <span className={`flex-1 transition-colors duration-200 ${
                      isSelected ? "text-primary font-medium" : "text-foreground"
                    }`}>{option.label}</span>
                  </Label>
                </motion.div>
              )
            })}
          </RadioGroup>
        </div>

        {/* Notes Section */}
        <div className="mb-6">
          <Label htmlFor="notes" className="text-sm text-muted-foreground">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add any observations, context, or examples you'd like to share."
            className="mt-2 min-h-[100px] resize-none"
          />
        </div>

        {/* Remember Tip */}
        <div className="bg-accent/30 rounded-lg p-4 border border-accent">
          <p className="text-sm text-accent-foreground">
            💡 <strong>Remember:</strong> Every child develops at their own pace.{' '}
            These questions help us understand your child's unique journey.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!selectedResponse}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {currentIndex === questions.length - 1 ? 'Complete Assessment' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    )
  }

  const getFocusAreaDisplay = () => {
    const focusAreaMap: Record<string, string> = {
      'Typically Developing': 'TYPICALLY DEVELOPING',
      'Autism Spectrum': 'AUTISM SPECTRUM',
      'Cerebral Palsy': 'CEREBRAL PALSY',
      'Down Syndrome': 'DOWN SYNDROME',
    }
    return focusAreaMap[disease ?? ''] ?? (disease ?? '').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-orange-50/30">
      <Header userType="guest" currentPath="/assessment/questions" />
      <div className="container mx-auto px-4 max-w-3xl py-8">
        {/* Assessment Title and Introduction */}
        {childName && (
          <div className="mb-6">
            <h1 className="text-3xl mb-2">{childName}'s Assessment</h1>
            <p className="text-muted-foreground">
              Answer each question to help us understand your child's developmental progress.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {questions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {progressValue}% Complete
              </span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        <Card className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}

