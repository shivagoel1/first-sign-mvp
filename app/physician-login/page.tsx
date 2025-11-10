import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { PhysicianLoginForm } from './physician-login-form'

export default async function PhysicianLoginPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile?.role === 'physician') {
      redirect('/physician-dashboard')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-16">
      <Card className="w-full max-w-lg border-transparent bg-white shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl font-semibold text-slate-900">
            Physician Portal
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            Sign in to review developmental assessments and support families with timely guidance.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <PhysicianLoginForm />
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3 text-sm text-slate-600">
          <Link href="/" className="text-xs text-slate-400 transition hover:text-slate-500">
            ← Back to home
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}


