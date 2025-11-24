'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  ClipboardCheck,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useSidebar } from './sidebar-context'
import { createClient } from '@/lib/supabase/client'

type PhysicianSidebarProps = {
  pendingReviewsCount?: number
  onLogout?: () => void
}

export function PhysicianSidebar({
  pendingReviewsCount = 0,
  onLogout,
}: PhysicianSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Use lazy initialization to read from localStorage without useEffect
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('physician-sidebar-collapsed')
      return saved === 'true'
    }
    return false
  })
  const { isMobileOpen, setIsMobileOpen } = useSidebar()
  const supabase = createClient()

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('physician-sidebar-collapsed', String(newState))
  }

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      await supabase.auth.signOut()
      router.push('/physician/login')
    }
    setIsMobileOpen(false)
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
            isCollapsed={false}
            pendingReviewsCount={pendingReviewsCount}
            handleLogout={handleLogout}
            setIsMobileOpen={setIsMobileOpen}
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
          isCollapsed={isCollapsed}
          pendingReviewsCount={pendingReviewsCount}
          handleLogout={handleLogout}
          setIsMobileOpen={setIsMobileOpen}
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
  isCollapsed: boolean
  pendingReviewsCount: number
  handleLogout: () => void
  setIsMobileOpen: (open: boolean) => void
}

function SidebarContent({
  isMobile = false,
  pathname,
  isCollapsed,
  pendingReviewsCount,
  handleLogout,
  setIsMobileOpen,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard/physician"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            pathname === '/dashboard/physician'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground hover:bg-muted',
            isCollapsed && !isMobile && 'justify-center'
          )}
          aria-label="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && (
            <span className="flex-1">Dashboard</span>
          )}
        </Link>

        {/* Pending Reviews */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsMobileOpen(false)
            // Scroll to pending reviews section
            if (typeof window !== 'undefined') {
              const element = document.getElementById('pending-reviews')
              if (element) {
                const headerHeight = 64 // Header height matches marginTop: 64px
                const elementPosition = element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset)
                const offsetPosition = elementPosition - headerHeight
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                })
              }
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
            'text-foreground hover:bg-muted', // Always use hover state, never active state
            isCollapsed && !isMobile && 'justify-center relative'
          )}
          aria-label="Pending Reviews"
        >
          <ClipboardCheck className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center justify-between flex-1">
              <span>Pending Reviews</span>
              {pendingReviewsCount > 0 && (
                <span className="bg-warning text-warning-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingReviewsCount}
                </span>
              )}
            </div>
          )}
          {isCollapsed && !isMobile && pendingReviewsCount > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-warning text-warning-foreground text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
              {pendingReviewsCount > 9 ? '9+' : pendingReviewsCount}
            </span>
          )}
        </button>

        {/* Recently Reviewed */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsMobileOpen(false)
            // Scroll to recently reviewed section
            if (typeof window !== 'undefined') {
              const element = document.getElementById('recently-reviewed')
              if (element) {
                const headerHeight = 64 // Header height matches marginTop: 64px
                const elementPosition = element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset)
                const offsetPosition = elementPosition - headerHeight
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
                })
              }
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
            'text-foreground hover:bg-muted', // Always use hover state, never active state
            isCollapsed && !isMobile && 'justify-center'
          )}
          aria-label="Recently Reviewed"
        >
          <Clock className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && <span>Recently Reviewed</span>}
        </button>

        {/* Divider */}
        {(!isCollapsed || isMobile) && (
          <div className="h-px bg-border my-2" />
        )}

        {/* Settings (Optional - can be removed if not needed) */}
        {false && (
          <Link
            href="/dashboard/physician/settings"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              pathname === '/dashboard/physician/settings'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted',
              isCollapsed && !isMobile && 'justify-center'
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            {(!isCollapsed || isMobile) && <span>Settings</span>}
          </Link>
        )}
      </nav>

      {/* Bottom Section - Logout */}
      <div className="px-2 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-foreground hover:bg-muted',
            isCollapsed && !isMobile && 'justify-center'
          )}
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

// Export mobile menu trigger for header
export function PhysicianSidebarTrigger() {
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

