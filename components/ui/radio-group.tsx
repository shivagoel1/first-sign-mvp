import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    className={cn('grid gap-2', className)}
    {...props}
    ref={ref}
  />
))
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700',
      className
    )}
    {...props}
  >
    <span>{children}</span>
    <span className="ml-4 inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-white transition-colors data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600/10">
      <RadioGroupPrimitive.Indicator className="inline-flex h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-inner" />
    </span>
  </RadioGroupPrimitive.Item>
))
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }

