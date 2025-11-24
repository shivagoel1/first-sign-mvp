'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Baby,
  Menu,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useSidebar } from './sidebar-context'

type ParentSidebarProps = {
  children: Array<{
    id: string
    child_name: string
    date_of_birth: string
    assessments: Array<{
      id: string
      status: string | null
      parent_visible: boolean | null
    }>
  }>
  profile: {
    full_name: string | null
    avatar_url?: string | null
  } | null
  onChildSelect?: (childId: string | null) => void
  selectedChildId?: string | null
}

export function ParentSidebar({
  children,
  profile,
  onChildSelect,
  selectedChildId,
}: ParentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Use lazy initialization to read from localStorage without useEffect
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved === 'true'
    }
    return false
  })
  const { isMobileOpen, setIsMobileOpen } = useSidebar()

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  // Logout moved to header user menu

  // Removed stats calculation - not needed without Quick Filters

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    const months = Math.floor(
      (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    if (months < 12) return `${months}m`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 flex flex-col"
          aria-label="Navigation menu"
        >
          <SidebarContent
            isMobile={true}
            pathname={pathname}
            selectedChildId={selectedChildId}
            isCollapsed={false}
            childRecords={children}
            onChildSelect={onChildSelect}
            setIsMobileOpen={setIsMobileOpen}
            calculateAge={calculateAge}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-64px)] bg-card border-r border-border transition-all duration-300 flex flex-col',
          isCollapsed ? 'w-16' : 'w-64'
        )}
        aria-label="Main navigation"
      >
        <SidebarContent
          isMobile={false}
          pathname={pathname}
          selectedChildId={selectedChildId}
          isCollapsed={isCollapsed}
          childRecords={children}
          onChildSelect={onChildSelect}
          setIsMobileOpen={setIsMobileOpen}
          calculateAge={calculateAge}
        />
        {/* Collapse Toggle - Positioned inside sidebar border */}
        <div className="absolute -right-3 top-4 z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-2 border-background bg-card shadow-md hover:bg-muted"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}

// Move SidebarContent outside to prevent recreation on every render
type SidebarContentProps = {
  isMobile: boolean
  pathname: string
  selectedChildId?: string | null
  isCollapsed: boolean
  childRecords: Array<{
    id: string
    child_name: string
    date_of_birth: string
    assessments: Array<{
      id: string
      status: string | null
      parent_visible: boolean | null
    }>
  }>
  onChildSelect?: (childId: string | null) => void
  setIsMobileOpen: (open: boolean) => void
  calculateAge: (dob: string) => string
}

function SidebarContent({
  isMobile = false,
  pathname,
  selectedChildId,
  isCollapsed,
  childRecords,
  onChildSelect,
  setIsMobileOpen,
  calculateAge,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {/* Dashboard */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsMobileOpen(false)
            // Clear child selection and navigate to dashboard overview
            // Call onChildSelect which will handle URL clearing and state update
            onChildSelect?.(null)
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
            pathname === '/dashboard/parent' && !selectedChildId
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground hover:bg-muted',
            isCollapsed && !isMobile && 'justify-center'
          )}
          aria-label="Dashboard"
          aria-current={pathname === '/dashboard/parent' && !selectedChildId ? 'page' : undefined}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && <span>Dashboard</span>}
        </button>

        {/* My Children */}
        <div className="space-y-1">
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground',
              isCollapsed && !isMobile && 'justify-center'
            )}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="font-medium">My Children</span>
            )}
          </div>
            {(!isCollapsed || isMobile) && childRecords.length > 0 && (
            <div className="pl-8 space-y-1">
              {childRecords.map((child) => (
                <Link
                  key={child.id}
                  href={`/dashboard/parent?child=${child.id}`}
                  onClick={() => {
                    onChildSelect?.(child.id)
                    setIsMobileOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedChildId === child.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  aria-label={`View ${child.child_name}'s assessments`}
                  aria-current={selectedChildId === child.id ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4" aria-hidden="true" />
                    <span>{child.child_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground" aria-label={`Age: ${calculateAge(child.date_of_birth)}`}>
                    {calculateAge(child.date_of_birth)}
                  </span>
                </Link>
              ))}
              <Link
                href="/assessment"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors"
                aria-label="Add a new child"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Child</span>
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* New Assessment */}
        <Link
          href="/assessment"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-muted',
            isCollapsed && !isMobile && 'justify-center'
          )}
          aria-label="Start new assessment"
        >
          <Plus className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && <span>New Assessment</span>}
        </Link>

        {/* All Storybooks */}
        <Link
          href="/dashboard/parent/storybooks"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            pathname === '/dashboard/parent/storybooks'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground hover:bg-muted',
            isCollapsed && !isMobile && 'justify-center'
          )}
          aria-label="View all storybooks"
          aria-current={pathname === '/dashboard/parent/storybooks' ? 'page' : undefined}
        >
          <BookOpen className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && <span>All Storybooks</span>}
        </Link>
      </nav>

      {/* Bottom Section - Removed user profile and logout (moved to header) */}
    </div>
  )
}

// Export mobile menu trigger for header
export function ParentSidebarTrigger() {
  const { setIsMobileOpen } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setIsMobileOpen(true)}
      aria-label="Open navigation menu"
      aria-expanded={false}
    >
      <Menu className="w-5 h-5" aria-hidden="true" />
    </Button>
  )
}

