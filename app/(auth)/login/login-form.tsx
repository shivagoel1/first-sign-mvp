'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

      const response = await fetch('/api/submit-assessment', {
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

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

      router.replace('/dashboard/parent')
      router.refresh()
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400"
        />
      </div>

      {error ? (
        <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-600">{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-3 text-base font-semibold shadow-lg transition hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500',
          loading && 'cursor-not-allowed opacity-80'
        )}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

