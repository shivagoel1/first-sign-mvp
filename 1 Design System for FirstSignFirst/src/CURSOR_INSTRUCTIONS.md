# Instructions for Cursor IDE - FirstSignFirst Design System

## IMPORTANT: Read the Design System File First

Before making ANY changes to the UI, you MUST read this file:

**File to check:** `src/styles/globals.css`

This file contains the COMPLETE design system with all color tokens, CSS variables, and theme configuration.

---

## Design System Color Palette

### Primary Colors (Orange Theme)
```css
--primary: #ea580c;              /* Deep orange - main brand color */
--primary-foreground: #ffffff;    /* White text on orange */
--primary-light: #fed7aa;         /* Light orange */
--primary-lighter: #ffedd5;       /* Very light orange */
```

### Secondary Colors (Blue Accent)
```css
--secondary: #eff6ff;             /* Very light blue background */
--secondary-foreground: #1e3a8a;  /* Dark blue text */
--secondary-accent: #1e40af;      /* Deep blue - accent color */
```

### Semantic Colors
```css
--success: #16a34a;               /* Green for success states */
--warning: #ea580c;               /* Orange for warnings (same as primary) */
--destructive: #dc2626;           /* Red for errors/destructive actions */
```

### Neutral Colors
```css
--background: #fafaf9;            /* Off-white page background */
--foreground: #1c1917;            /* Almost black text */
--card: #ffffff;                  /* Pure white cards */
--muted: #f5f5f4;                 /* Muted gray background */
--muted-foreground: #57534e;      /* Muted gray text */
--border: #e7e5e4;                /* Light gray borders */
```

---

## Design Style Guidelines

### Background Treatments
1. **Main background**: Use `bg-background` (off-white #fafaf9)
2. **Section alternates**: Use `bg-muted/30` for subtle gray sections
3. **Accent sections**: Use `bg-primary/5` for light orange tint
4. **NO GRADIENTS**: The design uses solid colors with subtle opacity variations

### Typography
- **Headlines (h1)**: Already styled in globals.css
- **Body text (p)**: Already styled in globals.css
- **DO NOT** add Tailwind font-size, font-weight, or line-height classes unless specifically requested

### Spacing & Layout
- Use consistent padding: `py-20` for sections, `py-8` for cards
- Container: `container mx-auto px-4 max-w-{size}`
- Gap between elements: `gap-6`, `gap-8`, `mb-6`, `mb-8`

### Cards & Components
- Cards: `border-2 hover:border-primary/30 transition-all`
- Buttons: `bg-primary hover:bg-primary/90 text-primary-foreground`
- Icons containers: `bg-primary/10 rounded-2xl` (or other color variants)

---

## Current HomePage Design (Correct Implementation)

The HomePage component in `src/components/HomePage.tsx` already follows the correct design:

### Hero Section
- Background: Default `bg-background` (no gradient)
- Trust badge: `bg-primary/10 text-primary` with rounded-full
- Headline: Large text, centered
- CTA Button: `bg-primary` with icon
- Feature checks: Green checkmarks with `text-success`

### What You'll Get Section
- Background: `bg-muted/30` (subtle gray)
- Cards: White with `border-2 hover:border-primary/30`
- Icons: Colored backgrounds (`bg-primary/10`, `bg-secondary-accent/10`, `bg-success/10`)

### Trust Section
- Background: `bg-primary/5` (very light orange tint)
- Cards: Pure white `bg-white` on the tinted background

---

## How to Use Tailwind Classes Correctly

### ✅ CORRECT Usage
```tsx
// Using design system colors via Tailwind
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary-accent/10"> {/* 10% opacity */}
<div className="text-muted-foreground">
<Card className="border-2 hover:border-primary/30 transition-all">
```

### ❌ WRONG Usage
```tsx
// Don't use hex values directly
<div style={{ backgroundColor: '#ea580c' }}>

// Don't add font classes (already in globals.css)
<h1 className="text-4xl font-bold">

// Don't create gradients unless specified
<div className="bg-gradient-to-br from-primary to-secondary">
```

---

## Component File Locations

All component files are in `src/components/`:
- `AssessmentFlow.tsx`
- `Header.tsx`
- `HomePage.tsx`
- `ParentDashboard.tsx`
- `ParentLogin.tsx`
- `PhysicianDashboard.tsx`
- `PhysicianLogin.tsx`
- `ResultsPage.tsx`
- `StorybookViewer.tsx`

All UI components are in `src/components/ui/`:
- 48 ShadCN component files
- `utils.ts` - helper functions
- `use-mobile.ts` - mobile detection hook

---

## When Making Changes

### Step 1: Always Read These Files First
1. `src/styles/globals.css` - Design system tokens
2. The specific component file you're editing
3. Any referenced UI components from `src/components/ui/`

### Step 2: Use Existing Design Tokens
- Use `bg-primary`, `text-primary`, `border-primary`
- Use opacity modifiers: `/5`, `/10`, `/20`, `/30`, `/50`, `/90`
- Use `bg-muted`, `text-muted-foreground` for neutral elements
- Use `bg-success`, `bg-warning`, `bg-destructive` for states

### Step 3: Match Existing Patterns
Look at similar components and copy their structure:
- Card layouts
- Button styles
- Icon containers
- Section backgrounds

---

## Common Mistakes to Avoid

1. ❌ Creating gradients when the design uses solid colors
2. ❌ Adding font-size/font-weight classes (handled by globals.css)
3. ❌ Using inline styles instead of Tailwind classes
4. ❌ Inventing new colors instead of using design tokens
5. ❌ Not checking globals.css before asking about colors

---

## Quick Reference: Color Classes

| Purpose | Tailwind Class | Hex Value |
|---------|---------------|-----------|
| Primary button | `bg-primary` | #ea580c |
| Primary button hover | `bg-primary/90` | #ea580c at 90% |
| Button text | `text-primary-foreground` | #ffffff |
| Secondary accent | `bg-secondary-accent` | #1e40af |
| Success/checkmarks | `text-success` | #16a34a |
| Muted text | `text-muted-foreground` | #57534e |
| Card background | `bg-card` | #ffffff |
| Page background | `bg-background` | #fafaf9 |
| Borders | `border-border` | #e7e5e4 |

---

## Example: Making a Feature Card

```tsx
<Card className="p-8 border-2 hover:border-primary/30 transition-all text-center">
  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
    <Baby className="w-8 h-8 text-primary" />
  </div>
  <h3 className="text-xl mb-4">Feature Title</h3>
  <p className="text-muted-foreground">
    Feature description text here
  </p>
</Card>
```

---

## When You Don't Know Something

**ALWAYS check these files in this order:**

1. `src/styles/globals.css` - All design tokens
2. `src/components/HomePage.tsx` - Reference implementation
3. `src/components/ui/[component].tsx` - UI component API
4. Other component files for similar patterns

**DO NOT:**
- Assume colors or styles
- Create new design tokens
- Add gradients or effects not in the design
- Override typography styles

---

## Summary

The FirstSignFirst design is:
- ✅ Clean and minimal (no complex gradients)
- ✅ Orange (#ea580c) primary, Blue (#1e40af) accent
- ✅ Uses opacity variations (`/5`, `/10`, `/30`) for subtle effects
- ✅ White cards on light backgrounds
- ✅ Typography pre-styled in globals.css
- ✅ Consistent spacing and layout patterns

**All design tokens are in `src/styles/globals.css` - READ THIS FILE FIRST!**
