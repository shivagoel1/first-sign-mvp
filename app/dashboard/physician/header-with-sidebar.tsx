'use client'

import { Header } from '@/components/header'
import { PhysicianSidebarTrigger } from '@/components/dashboard/physician-sidebar'

export function PhysicianHeaderWithSidebar() {
  return (
    <Header 
      userType="physician" 
      currentPath="/dashboard/physician"
      sidebarTrigger={<PhysicianSidebarTrigger />}
    />
  )
}

