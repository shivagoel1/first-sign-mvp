# 📋 Simple Copy Guide - UI Components Only

Since you can't download files from Figma Make, here's how to copy each file manually.

## Step 1: Files You Need to Copy

### Main Components (9 files)
Copy these from Figma Make to your Cursor project:

1. **AssessmentFlow.tsx**
   - In Figma Make: Open `/components/AssessmentFlow.tsx`
   - In Cursor: Create `src/components/AssessmentFlow.tsx`
   - Action: Select All (Cmd+A / Ctrl+A), Copy, Paste

2. **Header.tsx**
   - In Figma Make: Open `/components/Header.tsx`
   - In Cursor: Create `src/components/Header.tsx`
   - Action: Select All, Copy, Paste

3. **HomePage.tsx**
   - In Figma Make: Open `/components/HomePage.tsx`
   - In Cursor: Create `src/components/HomePage.tsx`
   - Action: Select All, Copy, Paste

4. **ParentDashboard.tsx**
   - In Figma Make: Open `/components/ParentDashboard.tsx`
   - In Cursor: Create `src/components/ParentDashboard.tsx`
   - Action: Select All, Copy, Paste

5. **ParentLogin.tsx**
   - In Figma Make: Open `/components/ParentLogin.tsx`
   - In Cursor: Create `src/components/ParentLogin.tsx`
   - Action: Select All, Copy, Paste

6. **PhysicianDashboard.tsx**
   - In Figma Make: Open `/components/PhysicianDashboard.tsx`
   - In Cursor: Create `src/components/PhysicianDashboard.tsx`
   - Action: Select All, Copy, Paste

7. **PhysicianLogin.tsx**
   - In Figma Make: Open `/components/PhysicianLogin.tsx`
   - In Cursor: Create `src/components/PhysicianLogin.tsx`
   - Action: Select All, Copy, Paste

8. **ResultsPage.tsx**
   - In Figma Make: Open `/components/ResultsPage.tsx`
   - In Cursor: Create `src/components/ResultsPage.tsx`
   - Action: Select All, Copy, Paste

9. **StorybookViewer.tsx**
   - In Figma Make: Open `/components/StorybookViewer.tsx`
   - In Cursor: Create `src/components/StorybookViewer.tsx`
   - Action: Select All, Copy, Paste

### Style File (1 file)

10. **globals.css**
    - In Figma Make: Open `/styles/globals.css`
    - In Cursor: Create `src/styles/globals.css`
    - Action: Select All, Copy, Paste

---

## Step 2: UI Components (ShadCN)

You have two options:

### Option A: Install via ShadCN CLI (Recommended)

```bash
# In Cursor terminal, initialize ShadCN
npx shadcn-ui@latest init

# Add the components you need
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add alert
```

### Option B: Copy from Figma Make

If you want to copy the exact UI components:
- Copy all files from `/components/ui/` in Figma Make
- Paste into `src/components/ui/` in Cursor
- There are 48 files total

---

## Step 3: Quick Checklist

After copying, verify you have:

```
src/
├── components/
│   ├── AssessmentFlow.tsx          ✓
│   ├── Header.tsx                  ✓
│   ├── HomePage.tsx                ✓
│   ├── ParentDashboard.tsx         ✓
│   ├── ParentLogin.tsx             ✓
│   ├── PhysicianDashboard.tsx      ✓
│   ├── PhysicianLogin.tsx          ✓
│   ├── ResultsPage.tsx             ✓
│   ├── StorybookViewer.tsx         ✓
│   └── ui/                         ✓ (48 files)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ... (45 more)
└── styles/
    └── globals.css                 ✓
```

---

## Step 4: File Locations Reference

| Figma Make Path | Cursor Path |
|----------------|-------------|
| `/components/AssessmentFlow.tsx` | `src/components/AssessmentFlow.tsx` |
| `/components/Header.tsx` | `src/components/Header.tsx` |
| `/components/HomePage.tsx` | `src/components/HomePage.tsx` |
| `/components/ParentDashboard.tsx` | `src/components/ParentDashboard.tsx` |
| `/components/ParentLogin.tsx` | `src/components/ParentLogin.tsx` |
| `/components/PhysicianDashboard.tsx` | `src/components/PhysicianDashboard.tsx` |
| `/components/PhysicianLogin.tsx` | `src/components/PhysicianLogin.tsx` |
| `/components/ResultsPage.tsx` | `src/components/ResultsPage.tsx` |
| `/components/StorybookViewer.tsx` | `src/components/StorybookViewer.tsx` |
| `/styles/globals.css` | `src/styles/globals.css` |
| `/components/ui/*` | `src/components/ui/*` |

---

## Step 5: Update Import Paths (If Needed)

If your imports show errors, you may need to update them:

**Current (Figma Make):**
```typescript
import { Button } from "./components/ui/button";
```

**Updated (Cursor):**
```typescript
import { Button } from "../ui/button";
// or
import { Button } from "@/components/ui/button";
```

---

## Quick Copy Method (One-by-One)

1. **In Figma Make:** Click on file in sidebar → Click inside editor → `Cmd+A` (or `Ctrl+A`) → `Cmd+C` (or `Ctrl+C`)

2. **In Cursor:** Right-click in file explorer → New File → Name it → Paste (`Cmd+V` or `Ctrl+V`) → Save

3. **Repeat** for each of the 10 main files

---

## Total Time Estimate

- 10 main files: ~10 minutes (1 min each)
- UI components (if using ShadCN CLI): ~5 minutes
- UI components (if copying manually): ~20 minutes

**Total: 15-30 minutes**

---

## Need the UI component files listed?

If you want to copy the UI components manually from Figma Make, here's the complete list of 48 files you need from `/components/ui/`:

1. accordion.tsx
2. alert-dialog.tsx
3. alert.tsx
4. aspect-ratio.tsx
5. avatar.tsx
6. badge.tsx
7. breadcrumb.tsx
8. button.tsx
9. calendar.tsx
10. card.tsx
11. carousel.tsx
12. chart.tsx
13. checkbox.tsx
14. collapsible.tsx
15. command.tsx
16. context-menu.tsx
17. dialog.tsx
18. drawer.tsx
19. dropdown-menu.tsx
20. form.tsx
21. hover-card.tsx
22. input-otp.tsx
23. input.tsx
24. label.tsx
25. menubar.tsx
26. navigation-menu.tsx
27. pagination.tsx
28. popover.tsx
29. progress.tsx
30. radio-group.tsx
31. resizable.tsx
32. scroll-area.tsx
33. select.tsx
34. separator.tsx
35. sheet.tsx
36. sidebar.tsx
37. skeleton.tsx
38. slider.tsx
39. sonner.tsx
40. switch.tsx
41. table.tsx
42. tabs.tsx
43. textarea.tsx
44. toggle-group.tsx
45. toggle.tsx
46. tooltip.tsx
47. use-mobile.ts
48. utils.ts

---

## Alternative: Use Figma Make's File Browser

1. In Figma Make, look for a **file tree/browser** on the left side
2. Right-click on files and see if there's an "Export" or "Download" option
3. Some platforms allow multi-select to download multiple files at once

---

## That's It!

Once you've copied all files:
1. Your UI components are ready
2. You can integrate with your existing backend
3. Start customizing for your needs

**No documentation files needed - just the UI code!**
