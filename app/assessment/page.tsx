'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
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
    <div className="min-h-screen bg-orange-50/30">
      <Header userType="guest" currentPath="/assessment" />
      <div className="container mx-auto px-4 max-w-3xl py-8">
        <Card className="p-8 md:p-10 shadow-lg border-2">
          <div className="text-center mb-8">
            <h2 className="text-3xl mb-3">Tell us about your child</h2>
            <p className="text-muted-foreground">
              This helps us show age-appropriate questions tailored to your family.
            </p>
          </div>
          <div>
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
                          className="h-12 mt-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
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
                            className="h-12 mt-2"
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
                            <SelectTrigger className="h-12 mt-2">
                              <SelectValue placeholder="Select a focus area" />
                            </SelectTrigger>
                            <SelectContent>
                              {focusOptions.map((option) => (
                                <SelectItem key={option} value={option}>
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

                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link href="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>

                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Continue to Questions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  )
}

