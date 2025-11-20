'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useGuestAssessmentStore } from '@/lib/stores/guest-assessment-store'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getSessionData = useGuestAssessmentStore((state) => state.getSessionData)
  const resetGuestAssessment = useGuestAssessmentStore((state) => state.reset)

  const submitPendingAssessment = useCallback(
    async (userId: string, userEmail: string, fullName: string | null) => {
      const sessionData = getSessionData()

      if (
        !sessionData.guestSessionId ||
        !sessionData.childName ||
        !sessionData.dateOfBirth ||
        !sessionData.disease ||
        !sessionData.responses ||
        Object.keys(sessionData.responses).length === 0
      ) {
        return true
      }

      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          fullName: fullName ?? '',
          guestSessionId: sessionData.guestSessionId,
          childName: sessionData.childName,
          dateOfBirth: sessionData.dateOfBirth,
          disease: sessionData.disease,
          responses: sessionData.responses,
        }),
      })

      if (!response.ok) {
        return false
      }

      resetGuestAssessment()
      return true
    },
    [getSessionData, resetGuestAssessment]
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user?.email) {
        setError('Signed in, but unable to load your profile. Please try again.')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[parent-login] Profile lookup error:', profileError)
        setError('Unable to verify account. Please try again.')
        return
      }

      // Check if user is a physician - redirect them to physician dashboard
      if (profileData?.role === 'physician') {
        window.location.href = '/dashboard/physician'
        return
      }

      const submitted = await submitPendingAssessment(
        user.id,
        user.email,
        profileData?.full_name ?? (user.user_metadata as { full_name?: string })?.full_name ?? null
      )

      if (!submitted) {
        setError(
          'Signed in, but we could not submit your pending assessment. Please try submitting from the review screen.'
        )
        return
      }

      window.location.href = '/dashboard/parent'
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unexpected error. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="email" className="text-base">
          Email Address
        </Label>
        <div className="relative mt-2">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="parent@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 text-base pl-12"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="text-base">
          Password
        </Label>
        <div className="relative mt-2">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 text-base pl-12"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
          <span className="text-sm text-muted-foreground">Remember me</span>
        </label>
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className={cn(
          'w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base',
          loading && 'cursor-not-allowed opacity-80'
        )}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Logging in...
          </>
        ) : (
          <>
            Login to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </form>
  )
}

