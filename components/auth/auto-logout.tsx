'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Component that automatically logs out users when they close the window or tab
 */
export function AutoLogout() {
  const supabaseRef = useRef(createClient())
  const isNavigatingAwayRef = useRef(false)

  useEffect(() => {
    const supabase = supabaseRef.current

    const handlePageHide = async (event: PageTransitionEvent) => {
      // pagehide fires when the page is being unloaded (closing tab/window)
      // persisted is false when the page is being discarded (closed)
      if (!event.persisted) {
        isNavigatingAwayRef.current = true
        try {
          const session = await supabase.auth.getSession()
          if (session.data.session) {
            // Use fetch with keepalive for reliable logout
            fetch('/api/auth/logout', {
              method: 'POST',
              keepalive: true,
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => {
              // Fallback to direct signOut if API fails
              supabase.auth.signOut().catch(() => {})
            })
          }
        } catch (error) {
          console.error('[auto-logout] Error during page hide logout:', error)
        }
      }
    }

    const handleBeforeUnload = () => {
      // Mark that we're navigating away
      isNavigatingAwayRef.current = true
    }

    // Listen for page hide (more reliable than beforeunload for detecting actual close)
    window.addEventListener('pagehide', handlePageHide)
    
    // Also listen for beforeunload as backup
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Handle browser back/forward navigation
    const handlePopState = () => {
      isNavigatingAwayRef.current = true
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return null // This component doesn't render anything
}

