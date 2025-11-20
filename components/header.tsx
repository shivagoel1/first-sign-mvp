'use client'

import Link from 'next/link'
import { Baby, Menu, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  userType?: 'parent' | 'physician' | 'guest'
  currentPath?: string
}

export function Header({ userType = 'guest', currentPath }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg">FirstSignFirst</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {userType === 'parent' && (
              <>
                <Link 
                  href="/dashboard/parent"
                  className={`text-sm transition-colors ${
                    currentPath === '/dashboard/parent' 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/assessment"
                  className={`text-sm transition-colors ${
                    currentPath === '/assessment' 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  New Assessment
                </Link>
              </>
            )}
            {userType === 'physician' && (
              <>
                <Link 
                  href="/dashboard/physician"
                  className={`text-sm transition-colors ${
                    currentPath === '/dashboard/physician' 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  Review Queue
                </Link>
              </>
            )}
            {userType === 'guest' && (
              <>
                <Link 
                  href="/"
                  className={`text-sm transition-colors ${
                    currentPath === '/' 
                      ? 'text-primary' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/login"
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  Parent Login
                </Link>
                <Link 
                  href="/physician/login"
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  Physician Login
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {userType !== 'guest' && (
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            )}
            {userType === 'guest' && (
              <Button 
                variant="default"
                className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <Link href="/assessment">
                  Start Assessment
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

