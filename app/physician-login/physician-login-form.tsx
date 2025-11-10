'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function PhysicianLoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError || !data.session?.user) {
          throw new Error(
            signInError?.message ?? 'Unable to sign in. Please verify your credentials.'
          )
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .maybeSingle()

        if (profileError) {
          throw new Error(profileError.message)
        }

        if (profile?.role !== 'physician') {
          await supabase.auth.signOut()
          throw new Error('Access denied. This portal is for physicians only.')
        }
      } else {
        if (!fullName.trim()) {
          throw new Error('Full name is required to create a physician account.')
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        })

        if (signUpError || !signUpData.user) {
          throw new Error(
            signUpError?.message ?? 'Unable to create account. Please try again.'
          )
        }

        const user = signUpData.user

        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          email,
          full_name: fullName.trim(),
          role: 'physician',
        })

        if (profileError) {
          throw new Error(profileError.message ?? 'Unable to save profile details.')
        }

        if (!signUpData.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            throw new Error(
              signInError.message ||
                'Account created but unable to sign in automatically. Please try logging in.'
            )
          }
        }
      }

      router.replace('/physician-dashboard')
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {mode === 'signin' ? 'Sign in to continued care' : 'Create a physician account'}
        </div>
      </div>

      {mode === 'signup' ? (
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            required
            placeholder="Dr. Jane Smith"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-400"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@clinic.com"
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
          'w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-3 text-base font-semibold text-white shadow-lg transition hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500',
          loading && 'cursor-not-allowed opacity-80'
        )}
      >
        {loading
          ? mode === 'signin'
            ? 'Signing in…'
            : 'Creating account…'
          : mode === 'signin'
          ? 'Sign in'
          : 'Create account'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="#" className="text-indigo-600 transition hover:text-indigo-500">
          Forgot Password?
        </Link>
        <button
          type="button"
          className="text-indigo-600 transition hover:text-indigo-500"
          onClick={() => {
            setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
            setError(null)
          }}
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </button>
      </div>
    </form>
  )
}


