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
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    variant?: 'default' | 'simple'
  }
>(({ className, children, variant = 'default', ...props }, ref) => {
  if (variant === 'simple') {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border-2 border-border bg-background text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    )
  }

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:text-primary',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <span className="ml-4 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-background transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/10">
        <RadioGroupPrimitive.Indicator className="inline-flex h-3 w-3 rounded-full bg-primary shadow-inner" />
      </span>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }

