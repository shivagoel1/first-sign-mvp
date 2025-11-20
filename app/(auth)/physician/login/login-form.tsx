'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
          .select('role, email, full_name')
          .eq('id', data.session.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('[physician-login] Profile lookup error:', profileError)
          throw new Error(`Unable to verify account: ${profileError.message}`)
        }

        if (!profile) {
          console.error('[physician-login] No profile found for user:', data.session.user.id)
          await supabase.auth.signOut()
          throw new Error('No profile found. Please contact support to set up your physician account.')
        }

        if (profile.role !== 'physician') {
          console.error('[physician-login] Wrong role:', profile.role, 'for user:', data.session.user.id)
          await supabase.auth.signOut()
          throw new Error(`Access denied. This portal is for physicians only. Your account role is: ${profile.role || 'not set'}.`)
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

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Verify session and profile before redirecting
      const { data: { session: verifySession } } = await supabase.auth.getSession()
      if (!verifySession) {
        throw new Error('Session not established. Please try again.')
      }

      // Double-check profile role before redirect
      const { data: verifyProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', verifySession.user.id)
        .maybeSingle()

      if (verifyProfile?.role !== 'physician') {
        throw new Error('Unable to verify physician role. Please contact support.')
      }

      // Use window.location for a hard redirect to ensure session is picked up
      window.location.href = '/dashboard/physician'
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
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
      {mode === 'signup' ? (
        <div>
          <Label htmlFor="fullName" className="text-base">
            Full Name
          </Label>
          <div className="relative mt-2">
            <Input
              id="fullName"
              type="text"
              required
              placeholder="Dr. Jane Smith"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-12 text-base"
            />
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="email" className="text-base">
          Professional Email
        </Label>
        <div className="relative mt-2">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="doctor@hospital.com"
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
          <input type="checkbox" className="w-4 h-4 rounded border-border text-secondary-accent focus:ring-secondary-accent" />
          <span className="text-sm text-muted-foreground">Remember me</span>
        </label>
        <Link
          href="/"
          className="text-sm text-secondary-accent hover:underline"
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
          'w-full bg-secondary-accent hover:bg-secondary-accent/90 text-white h-14 text-base',
          loading && 'cursor-not-allowed opacity-80'
        )}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            {mode === 'signin' ? 'Logging in...' : 'Creating account...'}
          </>
        ) : (
          <>
            {mode === 'signin' ? 'Access Review Dashboard' : 'Create Account'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === 'signin' 
            ? "Don't have an account? Create one" 
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}


