'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Baby, Menu, User, Sparkles, LogOut, ChevronDown, Settings, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
// Simple mobile menu button for parent users
// The actual sidebar will be handled by the ParentDashboardPage
const ParentSidebarMobileTrigger = () => {
  return (
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="w-5 h-5" />
    </Button>
  )
}

interface HeaderProps {
  userType?: 'parent' | 'physician' | 'guest'
  currentPath?: string
  onSidebarToggle?: () => void
  sidebarOpen?: boolean
  sidebarTrigger?: React.ReactNode
}

export function Header({ userType = 'guest', currentPath, onSidebarToggle, sidebarOpen, sidebarTrigger }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (userType === 'parent') {
      router.push('/login')
    } else if (userType === 'physician') {
      router.push('/physician/login')
    } else {
      router.push('/')
    }
  }

  const handleSectionClick = (sectionId: string) => {
    if (window.location.pathname === '/') {
      const section = document.getElementById(sectionId)
      if (section) {
        const headerHeight = 80 // Approximate header height
        const elementPosition = section.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - headerHeight

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
      setMobileMenuOpen(false)
    }
  }

  const handleFaqClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === '/') {
      e.preventDefault()
      handleSectionClick('faq')
    }
  }

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-sm transition-all">
      <div className={cn(
        "mx-auto py-3",
        userType === 'parent' ? "w-full pl-16 md:pl-4 pr-4" : 
        userType === 'physician' && sidebarTrigger ? "w-full pl-16 md:pl-4 pr-4" : 
        "container px-4"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 relative">
            {sidebarTrigger && (
              <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-50">
                {sidebarTrigger}
              </div>
            )}
            <Link 
              href={userType === 'parent' ? "/dashboard/parent" : userType === 'physician' ? "/dashboard/physician" : "/"}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">FirstSignFirst</span>
            </Link>
          </div>

          {/* Desktop Navigation - Only for guest users */}
          <nav className="hidden md:flex items-center gap-5">
            {/* Parent and Physician users: Navigation moved to sidebar, header only shows global actions */}
            {userType === 'guest' && (
              <>
                {currentPath !== '/' && (
                  <Link 
                    href="/"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                )}
                {currentPath === '/' && (
                  <>
                    <Link 
                      href="/#features"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        const section = document.getElementById('features')
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      Features
                    </Link>
                    <Link 
                      href="/#how-it-works"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        const section = document.getElementById('how-it-works')
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      How It Works
                    </Link>
                    <Link 
                      href="/#why-us"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        const section = document.getElementById('why-us')
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      Why Us
                    </Link>
                  </>
                )}
                <Link 
                  href="/#faq"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                  onClick={handleFaqClick}
                >
                  FAQ
                </Link>
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search and Notifications - Removed until implemented */}

            {/* Guest Login */}
            {userType === 'guest' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="default" 
                    className="!bg-gradient-to-r !from-primary !to-orange-700 hover:!from-primary/90 hover:!to-orange-700/90 !text-white text-sm font-medium h-10 px-4 shadow-lg hover:shadow-xl transition-all border-0"
                  >
                    Login
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="cursor-pointer">
                      Parent Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/physician/login" className="cursor-pointer">
                      Physician Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Logged-in User Menu */}
            {userType !== 'guest' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {userType === 'parent' ? 'P' : 'D'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {userType === 'parent' && (
                    <>
                      {/* Settings and Help - Removed until pages are created */}
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    FirstSignFirst
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {userType === 'parent' && (
                    <>
                      <Link 
                        href="/dashboard/parent"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-base font-medium transition-colors py-2 ${
                          currentPath === '/dashboard/parent' 
                            ? 'text-primary font-semibold' 
                            : 'text-foreground hover:text-primary'
                        }`}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/assessment"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-base font-medium transition-colors py-2 ${
                          currentPath === '/assessment' 
                            ? 'text-primary font-semibold' 
                            : 'text-foreground hover:text-primary'
                        }`}
                      >
                        New Assessment
                      </Link>
                    </>
                  )}
                  {/* Physician navigation moved to sidebar */}
                  {userType === 'guest' && (
                    <>
                      {currentPath !== '/' && (
                        <Link 
                          href="/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                        >
                          Home
                        </Link>
                      )}
                      {currentPath === '/' && (
                        <>
                          <Link 
                            href="/#features"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSectionClick('features')
                            }}
                            className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                          >
                            Features
                          </Link>
                          <Link 
                            href="/#how-it-works"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSectionClick('how-it-works')
                            }}
                            className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                          >
                            How It Works
                          </Link>
                          <Link 
                            href="/#why-us"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSectionClick('why-us')
                            }}
                            className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                          >
                            Why Us
                          </Link>
                        </>
                      )}
                      <Link 
                        href="/#faq"
                        onClick={(e) => {
                          handleFaqClick(e)
                        }}
                        className="text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                      >
                        FAQ
                      </Link>
                      <div className="border-t border-border pt-4 mt-2">
                        <p className="text-sm font-semibold text-muted-foreground mb-2 px-2">Login</p>
                        <Link 
                          href="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2 px-2 rounded-md hover:bg-muted"
                        >
                          Parent Login
                        </Link>
                        <Link 
                          href="/physician/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2 px-2 rounded-md hover:bg-muted"
                        >
                          Physician Login
                        </Link>
                      </div>
                    </>
                  )}
                  {userType !== 'guest' && (
                    <div className="border-t border-border pt-4 mt-2">
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full justify-start text-base font-medium"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

