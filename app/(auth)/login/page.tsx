import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      // Check user role and redirect accordingly
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      // If profile lookup fails, just show login page
      if (!profileError && profile) {
        if (profile.role === 'physician') {
          redirect('/dashboard/physician')
        } else {
          redirect('/dashboard/parent')
        }
      }
    }
  } catch (error) {
    // Only catch non-redirect errors
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    // Log errors but continue to show login page
    console.error('[parent-login-page] Error:', error)
  }

  return (
    <div className="min-h-screen bg-orange-50/30">
      {/* Hero Background Section */}
      <div className="relative bg-gradient-to-br from-orange-100 via-orange-50 to-orange-50/30 py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl">FirstSignFirst</span>
            </div>
            <h1 className="text-4xl md:text-5xl mb-4">Welcome Back!</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Continue tracking your child's developmental journey
            </p>
          </div>

          {/* Login Card */}
          <div className="max-w-md mx-auto">
            <Card className="p-8 shadow-2xl border-2">
              <LoginForm />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    href="/assessment"
                    className="text-primary hover:underline font-medium"
                  >
                    Start your first assessment
                  </Link>
                </p>
              </div>
            </Card>

            {/* Physician Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Are you a physician?{' '}
                <Link
                  href="/physician/login"
                  className="text-secondary-accent hover:underline font-medium"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
