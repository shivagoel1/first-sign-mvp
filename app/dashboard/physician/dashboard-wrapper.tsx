'use client'

import { useState, useEffect } from 'react'
import { PhysicianSidebar } from '@/components/dashboard/physician-sidebar'
import PhysicianDashboardClient, {
  DashboardStats,
  PendingReview,
  PhysicianInfo,
  ReviewedAssessment,
} from './dashboard-client'

type PhysicianDashboardWrapperProps = {
  stats: DashboardStats
  physician: PhysicianInfo
  pendingReviews: PendingReview[]
  recentlyReviewed: ReviewedAssessment[]
}

export function PhysicianDashboardWrapper({
  stats,
  physician,
  pendingReviews,
  recentlyReviewed,
}: PhysicianDashboardWrapperProps) {
  // Get sidebar collapsed state to adjust main content margin
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Listen for sidebar collapse state changes
  useEffect(() => {
    const checkSidebarState = () => {
      const saved = localStorage.getItem('physician-sidebar-collapsed')
      setSidebarCollapsed(saved === 'true')
    }
    checkSidebarState()
    // Check periodically for changes
    const interval = setInterval(checkSidebarState, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <PhysicianSidebar pendingReviewsCount={stats.pendingReviews} />
      <main 
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '64px' : '256px', // Adjust margin based on sidebar state (w-16 = 64px, w-64 = 256px)
          minHeight: 'calc(100vh - 64px)' // Ensure main content fills available height
        }}
      >
        <PhysicianDashboardClient
          stats={stats}
          physician={physician}
          pendingReviews={pendingReviews}
          recentlyReviewed={recentlyReviewed}
        />
      </main>
    </>
  )
}

