
import { NextResponse } from 'next/server'



export async function GET() {

  return NextResponse.json({

    env: {

      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,

      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',

      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'

    }

  })

}

