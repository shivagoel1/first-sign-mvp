'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGuestAssessmentStore } from '@/lib/stores/guest-assessment-store'

const formSchema = z.object({
  childName: z.string().min(1, "Please enter your child's name."),
  dateOfBirth: z
    .string()
    .min(1, 'Please provide a date of birth.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Please enter a valid date.',
    }),
  focusArea: z.string().min(1, 'Please select a focus area.'),
})

const focusOptions = [
  'Typically Developing',
  'Autism Spectrum',
  'Cerebral Palsy',
  'Down Syndrome',
]

const calculateAgeInMonths = (dob: string) => {
  const birthDate = new Date(dob)
  const today = new Date()

  const years = today.getFullYear() - birthDate.getFullYear()
  const months = today.getMonth() - birthDate.getMonth()
  const totalMonths = years * 12 + months - (today.getDate() < birthDate.getDate() ? 1 : 0)

  return Math.max(totalMonths, 0)
}

export default function AssessmentLandingPage() {
  const router = useRouter()
  const guestSessionId = useGuestAssessmentStore((state) => state.guestSessionId)
  const initializeSession = useGuestAssessmentStore((state) => state.initializeSession)
  const setChildInfo = useGuestAssessmentStore((state) => state.setChildInfo)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childName: '',
      dateOfBirth: '',
      focusArea: '',
    },
  })

  useEffect(() => {
    if (!guestSessionId) {
      initializeSession()
    }
  }, [guestSessionId, initializeSession])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const age = calculateAgeInMonths(values.dateOfBirth)
    setChildInfo(values.childName.trim(), values.dateOfBirth, age, values.focusArea)
    router.push('/assessment/questions')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 py-20 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <Button
          variant="ghost"
          className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
          asChild
        >
          <Link href="/">← Back to Home</Link>
        </Button>

        <Card className="overflow-hidden border-0 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-md">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-4xl font-semibold text-slate-950">
              Tell us about your child
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              This helps us show age-appropriate questions tailored to your family.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="childName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child&apos;s Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your child's name"
                          className="h-12 rounded-xl border border-slate-200 bg-white/90 px-4 text-slate-900 shadow-sm transition duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            className="h-12 rounded-xl border border-slate-200 bg-white/90 px-4 text-slate-900 shadow-sm transition duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="focusArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focus Area</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-12 rounded-xl border border-slate-200 bg-white/90 px-4 text-left text-slate-900 shadow-sm transition duration-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200">
                              <SelectValue placeholder="Select a focus area" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-slate-200 bg-white/95 text-slate-900 shadow-xl">
                              {focusOptions.map((option) => (
                                <SelectItem
                                  key={option}
                                  value={option}
                                  className="rounded-lg px-3 py-2 text-sm transition hover:bg-purple-50 focus:bg-purple-100"
                                >
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 py-6 text-base font-semibold text-white shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    Continue to Questions
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

