'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
    >
      <Link
        href="/dashboard/parent"
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            {isLast || !item.href ? (
              <span className={cn(isLast && 'text-foreground font-medium')}>{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

