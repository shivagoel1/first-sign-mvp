'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { createClient } from '@/lib/supabase/client'
import { useGuestAssessmentStore } from '@/lib/stores/guest-assessment-store'
import { toast } from 'sonner'

type ResponseWithQuestion = {
  id: string
  question: string
  category: string
  description?: string | null
  response: string
  notes?: string
}

const responseVariants: Record<string, string> = {
  yes: 'bg-emerald-100 text-emerald-700',
  no: 'bg-rose-100 text-rose-700',
  sometimes: 'bg-amber-100 text-amber-700',
  not_sure: 'bg-slate-200 text-slate-700',
}

const accountSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

const categoryLabels: Record<string, string> = {
  'Social-Emotional': 'Social & Emotional',
  'Language/Communication': 'Language & Communication',
  Cognitive: 'Cognitive Skills',
  Motor: 'Motor Skills',
}

export default function AssessmentReviewPage() {
  const router = useRouter()

  const childName = useGuestAssessmentStore((state) => state.childName)
  const dateOfBirth = useGuestAssessmentStore((state) => state.dateOfBirth)
  const ageMonths = useGuestAssessmentStore((state) => state.ageMonths)
  const disease = useGuestAssessmentStore((state) => state.disease)
  const responses = useGuestAssessmentStore((state) => state.responses)
  const getSessionData = useGuestAssessmentStore((state) => state.getSessionData)
  const reset = useGuestAssessmentStore((state) => state.reset)

  const [questionDetails, setQuestionDetails] = useState<ResponseWithQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (!hasSubmitted && (!responses || Object.keys(responses).length === 0)) {
      router.replace('/assessment')
    }
  }, [responses, router, hasSubmitted])

  useEffect(() => {
    const fetchQuestions = async () => {
      const questionIds = Object.keys(responses)
      if (questionIds.length === 0) return
      setIsFetching(true)
      setFetchError(null)

      const { data, error } = await supabase
        .from('milestones')
        .select('id, question, category, description')
        .in('id', questionIds)

      if (error) {
        setFetchError('Unable to load question details. Please try again.')
        setIsFetching(false)
        return
      }

      const mapped = (data ?? []).map((question) => ({
        ...question,
        response: responses[question.id]?.response ?? '',
        notes: responses[question.id]?.notes ?? '',
      }))

      setQuestionDetails(mapped)
      setIsFetching(false)
    }

    fetchQuestions()
  }, [responses])

  const groupedByCategory = useMemo(() => {
    return questionDetails.reduce<Record<string, ResponseWithQuestion[]>>((acc, item) => {
      const category = item.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {})
  }, [questionDetails])

  const supabase = createClient()

  const submitAssessment = useCallback(
    async (params: { userId: string; email: string; fullName: string }) => {
      const sessionData = getSessionData()

      if (
        !sessionData ||
        !sessionData.childName ||
        !sessionData.dateOfBirth ||
        !sessionData.guestSessionId ||
        !sessionData.disease ||
        !sessionData.responses ||
        Object.keys(sessionData.responses).length === 0
      ) {
        throw new Error('Assessment data is missing. Please restart the assessment.')
      }

      const response = await fetch('/api/submit-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: params.userId,
          email: params.email,
          fullName: params.fullName,
          guestSessionId: sessionData.guestSessionId,
          childName: sessionData.childName,
          dateOfBirth: sessionData.dateOfBirth,
          disease: sessionData.disease,
          responses: sessionData.responses,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to submit assessment. Please try again.')
      }
    },
    [getSessionData]
  )

  const handleSignupSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
        },
      })

      if (signUpError || !signUpData.user) {
        throw new Error(signUpError?.message ?? 'Unable to create account.')
      }

      const user = signUpData.user

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

        if (signInError) {
          throw new Error(
            signInError.message || 'Account created but unable to sign in automatically.'
          )
        }
      }

      await submitAssessment({
        userId: user.id,
        email: values.email,
        fullName: values.fullName,
      })

      toast.success('Your account has been created and your assessment was successfully submitted.')
      setHasSubmitted(true)
      reset()
      router.push('/dashboard')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to submit your assessment right now.'
      )
    } finally {
      setIsLoading(false)
    }
  })

  const handleExistingAccountLogin = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/login')
        setIsLoading(false)
        return
      }

      const user = session.user
      const userEmail = user.email

      if (!userEmail) {
        throw new Error('Signed in, but no email is associated with this account.')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      const resolvedFullName =
        profile?.full_name ??
        (user.user_metadata as { full_name?: string | null })?.full_name ??
        userEmail

      await submitAssessment({
        userId: user.id,
        email: userEmail,
        fullName: resolvedFullName ?? userEmail,
      })

      toast.success('Assessment submitted successfully.')
      setHasSubmitted(true)
      reset()
      router.push('/dashboard')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to submit your assessment right now.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <Button
          variant="ghost"
          className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
          asChild
        >
          <Link href="/assessment/questions">← Back to Questions</Link>
        </Button>

        <Card className="overflow-hidden border-0 bg-white/95 text-slate-900 shadow-2xl backdrop-blur">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-slate-950">
              Review & Submit Assessment
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              Double-check your child&apos;s details and responses before creating your account to save the assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 px-8 pb-12">
            <section className="space-y-4">
              <div className="flex flex-col gap-6 rounded-2xl border border-blue-100/70 bg-white/90 p-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {childName ? `${childName}'s Assessment` : 'Child Information'}
                  </h3>
                  <p className="text-sm text-slate-600">Make sure these details look correct.</p>
                </div>
                <Button
                  variant="secondary"
                  className="rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                  asChild
                >
                  <Link href="/assessment">Edit Child Info</Link>
                </Button>
              </div>
              <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-700 sm:grid-cols-3">
                <div>
                  <p className="font-semibold text-slate-500">Child&apos;s Name</p>
                  <p className="mt-1 text-base text-slate-900">{childName ?? 'Not provided'}</p>
                </div>
              <div>
                <p className="font-semibold text-slate-500">Date of Birth</p>
                <p className="mt-1 text-base text-slate-900">
                  {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
                <div>
                  <p className="font-semibold text-slate-500">Age (months)</p>
                  <p className="mt-1 text-base text-slate-900">
                    {ageMonths !== null && ageMonths !== undefined ? ageMonths : 'N/A'}
                  </p>
                </div>
              <div className="sm:col-span-3 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-500">Focus Area</p>
                  <p className="mt-1 text-base text-slate-900">{disease ?? 'Not provided'}</p>
                </div>
              </div>
              </div>
            </section>

            <Separator className="bg-slate-200/80" />

            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Assessment Responses</h3>
                  <p className="text-sm text-slate-600">
                    Review each category and make sure your answers reflect your child&apos;s recent progress.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                  asChild
                >
                  <Link href="/assessment/questions">Edit Answers</Link>
                </Button>
              </div>

              {isFetching ? (
                <div className="rounded-2xl border border-blue-100 bg-white/80 p-6 text-center text-slate-600 shadow">
                  Loading responses...
                </div>
              ) : fetchError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600 shadow">
                  {fetchError}
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {Object.entries(groupedByCategory).map(([category, items]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="rounded-xl bg-white/80 px-4 py-3 text-base font-semibold text-slate-900 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                            {categoryLabels[category] ?? category}
                          </Badge>
                          <span className="text-sm text-slate-500">{items.length} questions</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4">
                        <div className="space-y-4 py-4">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm"
                            >
                              <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <Badge className={responseVariants[item.response] ?? 'bg-slate-200 text-slate-700'}>
                                  {item.response.replace('_', ' ')}
                                </Badge>
                                {item.notes ? (
                                  <span className="text-sm text-slate-500">Notes: {item.notes}</span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </section>

            <Separator className="bg-slate-200/80" />

            <section className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">Create Account to Continue</h3>
                <p className="text-sm text-slate-600">
                  Your assessment is complete. Create an account to save your results and receive your personalized storybook.
                </p>
              </div>

              <Card className="border border-blue-100/70 bg-white/90 shadow-xl">
                <CardContent className="px-6 py-8">
                  <Form {...form}>
                    <form className="space-y-6" onSubmit={handleSignupSubmit} noValidate>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Doe" className="rounded-xl border-slate-200" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="you@example.com"
                                  className="rounded-xl border-slate-200"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="At least 8 characters"
                                  className="rounded-xl border-slate-200"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Re-enter password"
                                  className="rounded-xl border-slate-200"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 py-6 text-base font-semibold text-white shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account & Submit'}
                      </Button>

                      <p className="text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link
                          href="/login"
                          onClick={handleExistingAccountLogin}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Login
                        </Link>
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

