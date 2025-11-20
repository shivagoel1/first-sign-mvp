# Cursor Quick Start - FirstSignFirst

## Where to Find Everything

### Design System & Colors
**Read this file FIRST for all design decisions:**
- `src/styles/globals.css` - All color tokens, CSS variables, and design system (UPDATED with warm colors)

### Reference Implementation
**Copy patterns from these working files:**
- `src/components/HomePage.tsx` - Complete reference with hero images, shadows, depth (UPDATED)
- `src/components/ParentDashboard.tsx` - Dashboard patterns, cards, data display
- `src/components/PhysicianDashboard.tsx` - Table layouts, review workflows
- `src/components/AssessmentFlow.tsx` - Form layouts, progress indicators
- `src/components/ParentLogin.tsx` - Login page patterns
- `src/components/PhysicianLogin.tsx` - Login page patterns
- `src/components/StorybookViewer.tsx` - Modal dialogs, pagination

### UI Component Library
**All reusable components are here:**
- `src/components/ui/` - 48 ShadCN components with proper styling

---

## Rules for Cursor

1. **Always read `src/styles/globals.css` first** to understand the warm color palette
2. **Look at existing component files** to see visual patterns (images, shadows, depth)
3. **Use Tailwind classes** from the design system (bg-primary, text-muted-foreground, etc.)
4. **Add visual depth** with shadows (shadow-lg, shadow-xl), images, and decorative elements
5. **Do NOT add** font-size, font-weight, or line-height classes (handled in globals.css)
6. **Match existing patterns** - HomePage shows how to add hero images, background blurs, shadows

---

## How to Approach Changes

When making ANY design change:

**Step 1:** Read `src/styles/globals.css` to understand warm colors and tokens

**Step 2:** Look at `src/components/HomePage.tsx` to see visual richness patterns:
- Hero images with ImageWithFallback
- Background blur elements for depth
- Card shadows (shadow-lg hover:shadow-xl)
- Decorative badges and floating elements
- Connecting lines between steps

**Step 3:** Copy the pattern and adapt it

---

## Design System Summary (UPDATED)

Read from `src/styles/globals.css`:
- **Primary:** Vibrant Orange (#ea580c)
- **Secondary Accent:** Warm Orange (#f97316) 
- **Success:** Warm Lime Green (#65a30d)
- **Warning:** Amber (#f59e0b)
- **Backgrounds:** Warm peachy cream (#fff7ed) with subtle variations
- **Text:** Warm brown tones (#431407, #78350f)
- **Borders:** Peachy orange (#fed7aa)
- **Muted sections:** Peachy/cream (#ffedd5)

**Visual Elements to Include:**
- Hero images (use ImageWithFallback from "./figma/ImageWithFallback")
- Shadows for depth (shadow-lg, shadow-xl on cards)
- Background blur circles for ambiance (blur-3xl with opacity-20/30)
- Decorative floating elements
- Connecting lines between steps

**All details are in globals.css and HomePage.tsx - read these files for complete information.**