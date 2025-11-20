import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardIndex() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check user role and redirect accordingly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'physician') {
      redirect('/dashboard/physician')
    }
  }

  // Default to parent dashboard
  redirect('/dashboard/parent')
}
