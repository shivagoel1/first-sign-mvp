
import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase/client'



export async function GET() {

  try {

    // Test 1: Check if client is initialized

    if (!supabase) {

      return NextResponse.json(

        { error: 'Supabase client not initialized' },

        { status: 500 }

      )

    }



    // Test 2: Query database to list all tables

    const { data, error } = await supabase

      .from('milestones')

      .select('count', { count: 'exact', head: true })



    if (error) {

      return NextResponse.json(

        {

          success: false,

          error: error.message,

          hint: 'Make sure you have created the tables in Supabase SQL Editor'

        },

        { status: 400 }

      )

    }



    return NextResponse.json({

      success: true,

      message: 'Successfully connected to Supabase!',

      tableCount: data,

      timestamp: new Date().toISOString()

    })



  } catch (error: any) {

    return NextResponse.json(

      {

        success: false,

        error: error.message

      },

      { status: 500 }

    )

  }

}

