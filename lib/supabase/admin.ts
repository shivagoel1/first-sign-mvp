import { createClient } from '@supabase/supabase-js'

import { Database } from '@/lib/database.types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration.')
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

