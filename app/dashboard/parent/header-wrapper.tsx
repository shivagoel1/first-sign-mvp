'use client'

import { Header } from '@/components/header'
import { ParentSidebarTrigger } from '@/components/dashboard/parent-sidebar'

export function ParentHeaderWrapper() {
  return (
    <div className="relative">
      <Header userType="parent" currentPath="/dashboard/parent" />
      {/* Inject sidebar trigger into header */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
        <ParentSidebarTrigger />
      </div>
    </div>
  )
}

