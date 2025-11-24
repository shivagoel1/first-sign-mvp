'use client'

import { Header } from '@/components/header'
import { ParentSidebarTrigger } from '@/components/dashboard/parent-sidebar'

export function ParentHeaderWithSidebar() {
  return (
    <div className="relative">
      <div className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 z-50">
        <ParentSidebarTrigger />
      </div>
      <Header userType="parent" currentPath="/dashboard/parent" />
    </div>
  )
}

