import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase service client is not configured (URL or SERVICE_ROLE_KEY missing).')
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}


