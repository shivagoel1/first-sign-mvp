'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ParentSidebar } from '@/components/dashboard/parent-sidebar'
import ParentDashboardClient, {
  ChildRecord,
} from './parent-dashboard-client'
import { AllStorybooksView } from './storybooks/all-storybooks-view'

type DashboardWrapperProps = {
  profile: {
    full_name: string | null
    avatar_url?: string | null
  } | null
  children: ChildRecord[]
  showStorybooks?: boolean
}

export function DashboardWrapper({ profile, children: childRecords, showStorybooks = false }: DashboardWrapperProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const childParam = searchParams.get('child')
  // Get sidebar collapsed state to adjust main content margin
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Listen for sidebar collapse state changes
  useEffect(() => {
    const checkSidebarState = () => {
      const saved = localStorage.getItem('sidebar-collapsed')
      setSidebarCollapsed(saved === 'true')
    }
    checkSidebarState()
    // Check periodically for changes
    const interval = setInterval(checkSidebarState, 100)
    return () => clearInterval(interval)
  }, [])
  
  // Initialize from URL param or default to null (overview)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    childParam || null
  )

  // Sync with URL changes - URL is the source of truth
  // Use ref to track previous value and avoid setState in useEffect
  const prevChildParamRef = useRef<string | null>(null)
  useEffect(() => {
    const childParam = searchParams.get('child')
    const newChildId = childParam || null
    // Only update if different from previous value to avoid cascading renders
    if (prevChildParamRef.current !== childParam) {
      prevChildParamRef.current = childParam
      if (selectedChildId !== newChildId) {
        setSelectedChildId(newChildId)
      }
    }
  }, [searchParams, selectedChildId])

  const handleChildSelect = (childId: string | null) => {
    // Always update state immediately for instant UI feedback
    setSelectedChildId(childId)
    
    if (childId) {
      // Update URL with child param
      router.push(`/dashboard/parent?child=${childId}`, { scroll: false })
    } else {
      // Clear selection - use replace to remove query param
      // Force a hard navigation to clear any cached URL state
      router.replace('/dashboard/parent', { scroll: false })
      // Force router refresh to clear Next.js cache
      router.refresh()
    }
  }

  // If showing storybooks page, render it instead
  if (showStorybooks) {
    return (
      <>
        <ParentSidebar
          children={childRecords}
          profile={profile}
          selectedChildId={null}
          onChildSelect={handleChildSelect}
        />
        <main 
          className="flex-1 overflow-y-auto transition-all duration-300"
          style={{ 
            marginLeft: sidebarCollapsed ? '64px' : '256px' // Adjust margin based on sidebar state
          }}
        >
          <AllStorybooksView profile={profile} children={childRecords} />
        </main>
      </>
    )
  }

  return (
    <>
      <ParentSidebar
        children={childRecords}
        profile={profile}
        selectedChildId={selectedChildId}
        onChildSelect={handleChildSelect}
      />
      <main 
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px' // Adjust margin based on sidebar state
        }}
      >
        <ParentDashboardClient 
          profile={profile} 
          children={childRecords}
          selectedChildId={selectedChildId}
          onChildSelect={handleChildSelect}
        />
      </main>
    </>
  )
}

