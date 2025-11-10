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
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    redirect('/dashboard/parent')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-16 text-white">
      <Card className="w-full max-w-md border-white/10 bg-white/10 backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Welcome back to FirstSign</CardTitle>
          <CardDescription className="text-sm text-white/80">
            Sign in to review assessments and celebrate milestones together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <span>New to FirstSign?</span>
            <Link
              href="/signup"
              className="font-semibold text-white transition hover:text-white/90"
            >
              Create an account
            </Link>
          </div>
          <Link href="/" className="text-xs text-white/60 transition hover:text-white/80">
            ← Back to home
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
