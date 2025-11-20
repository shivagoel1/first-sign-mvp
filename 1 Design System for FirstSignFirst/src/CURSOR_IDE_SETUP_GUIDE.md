# Cursor IDE Setup Guide - FirstSignFirst UI Components

This guide shows you exactly what to do in Cursor IDE when copying files from Figma Make.

---

## Prerequisites

Before starting, make sure you have:
- ✅ Cursor IDE installed
- ✅ Node.js installed (v18 or higher)
- ✅ A new or existing React project in Cursor

---

## Part 1: Project Setup in Cursor

### Step 1: Create/Open Your Project

**Option A: Start Fresh Project**
```bash
# In Cursor terminal (Ctrl+` or Cmd+`)
npx create-react-app firstsignfirst --template typescript
cd firstsignfirst
```

**Option B: Use Existing Project**
```bash
# Open your existing project folder in Cursor
# File → Open Folder → Select your project
```

### Step 2: Install Required Dependencies

Open Cursor's integrated terminal (`Ctrl+`` or `Cmd+``) and run:

```bash
# Core dependencies
npm install lucide-react
npm install recharts
npm install class-variance-authority
npm install clsx
npm install tailwind-merge

# Radix UI dependencies (for ShadCN components)
npm install @radix-ui/react-slot
npm install @radix-ui/react-dialog
npm install @radix-ui/react-avatar
npm install @radix-ui/react-progress
npm install @radix-ui/react-radio-group
npm install @radix-ui/react-select
npm install @radix-ui/react-label
npm install @radix-ui/react-tabs
npm install @radix-ui/react-alert-dialog
npm install @radix-ui/react-accordion
npm install @radix-ui/react-aspect-ratio
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-collapsible
npm install @radix-ui/react-context-menu
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-hover-card
npm install @radix-ui/react-menubar
npm install @radix-ui/react-navigation-menu
npm install @radix-ui/react-popover
npm install @radix-ui/react-scroll-area
npm install @radix-ui/react-separator
npm install @radix-ui/react-slider
npm install @radix-ui/react-switch
npm install @radix-ui/react-toast
npm install @radix-ui/react-toggle
npm install @radix-ui/react-toggle-group
npm install @radix-ui/react-tooltip

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Create Folder Structure

In Cursor, create these folders:

**Method 1: Using Terminal**
```bash
mkdir -p src/components/ui
mkdir -p src/components/figma
mkdir -p src/styles
```

**Method 2: Using Cursor File Explorer**
1. Right-click on `src` folder in left sidebar
2. Select "New Folder"
3. Name it `components`
4. Inside `components`, create folders: `ui` and `figma`
5. In `src`, create folder: `styles`

Your structure should look like:
```
src/
├── components/
│   ├── ui/           ← UI components go here
│   └── figma/        ← ImageWithFallback goes here
└── styles/           ← globals.css goes here
```

---

## Part 2: Copying Files from Figma Make

### Method 1: Direct Copy-Paste (Recommended)

For each file in the checklist:

#### **Step-by-Step for Each File:**

1. **In Figma Make:**
   - Click file in sidebar (e.g., `/components/AssessmentFlow.tsx`)
   - Press `Cmd+A` (Mac) or `Ctrl+A` (Windows) to select all
   - Press `Cmd+C` (Mac) or `Ctrl+C` (Windows) to copy

2. **In Cursor:**
   - **Right-click** on the destination folder in file explorer
     - For main components: Right-click `src/components/`
     - For UI components: Right-click `src/components/ui/`
     - For system components: Right-click `src/components/figma/`
     - For styles: Right-click `src/styles/`
   
   - Select **"New File"**
   
   - **Name the file** (e.g., `AssessmentFlow.tsx`)
     - ⚠️ Use exact name from checklist
     - ⚠️ Include file extension (.tsx, .ts, or .css)
   
   - Cursor will open the empty file
   
   - **Paste** the code: `Cmd+V` (Mac) or `Ctrl+V` (Windows)
   
   - **Save**: `Cmd+S` (Mac) or `Ctrl+S` (Windows)
   
   - ✅ Cursor will auto-format the file

3. **Check for Errors:**
   - Look at the bottom status bar
   - If you see red squiggly lines, hover to see the error
   - Common issues are covered in Part 4 below

---

### Method 2: Drag & Drop (If Available)

Some versions of Figma Make might allow:
1. Select file in Figma Make
2. Copy entire file
3. In Cursor, create new file with same name
4. Paste content

---

## Part 3: File-by-File Instructions

### **Group 1: Utilities First (Start Here)**

These files are needed by other components, so copy them first:

#### 1. `/components/ui/utils.ts`
```
In Cursor: Right-click src/components/ui/ → New File → Name: utils.ts
Paste content from Figma Make
Save
```

#### 2. `/components/ui/use-mobile.ts`
```
In Cursor: Right-click src/components/ui/ → New File → Name: use-mobile.ts
Paste content from Figma Make
Save
```

#### 3. `/styles/globals.css`
```
In Cursor: Right-click src/styles/ → New File → Name: globals.css
Paste content from Figma Make
Save
```

### **Group 2: UI Components (Core)**

Copy these essential UI components next:

#### 4-15. Core UI Components
Copy in this order:
1. `button.tsx`
2. `card.tsx`
3. `input.tsx`
4. `label.tsx`
5. `badge.tsx`
6. `dialog.tsx`
7. `avatar.tsx`
8. `progress.tsx`
9. `radio-group.tsx`
10. `select.tsx`
11. `textarea.tsx`
12. `table.tsx`

**For each:**
```
In Cursor: Right-click src/components/ui/ → New File → Name: [filename].tsx
Paste content from Figma Make
Save
```

### **Group 3: Remaining UI Components**

Copy all remaining UI components from the checklist:
- accordion.tsx through tooltip.tsx

**Same process:**
```
In Cursor: Right-click src/components/ui/ → New File → Name: [filename].tsx
Paste content from Figma Make
Save
```

### **Group 4: System Component**

#### `/components/figma/ImageWithFallback.tsx`
```
In Cursor: Right-click src/components/figma/ → New File → Name: ImageWithFallback.tsx
Paste content from Figma Make
Save
⚠️ Do not modify this file
```

### **Group 5: Main Application Components**

Copy your main feature components:

#### AssessmentFlow.tsx, Header.tsx, etc.
```
In Cursor: Right-click src/components/ → New File → Name: [ComponentName].tsx
Paste content from Figma Make
Save
```

For each of the 9 main components:
1. AssessmentFlow.tsx
2. Header.tsx
3. HomePage.tsx
4. ParentDashboard.tsx
5. ParentLogin.tsx
6. PhysicianDashboard.tsx
7. PhysicianLogin.tsx
8. ResultsPage.tsx
9. StorybookViewer.tsx

### **Group 6: App Entry Point**

#### `/App.tsx`
```
In Cursor: Right-click src/ → New File → Name: App.tsx
Paste content from Figma Make
Save
```

---

## Part 4: Fix Import Paths (Important!)

After pasting all files, you may need to fix import paths.

### Issue: Import paths might not match

**Figma Make uses:**
```typescript
import { Button } from "./components/ui/button";
```

**Cursor might need:**
```typescript
import { Button } from "../ui/button";
// or
import { Button } from "@/components/ui/button";
```

### Solution 1: Set Up Path Alias (Recommended)

**1. Create/update `tsconfig.json` in project root:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**2. Update imports using Find & Replace in Cursor:**
   - Press `Cmd+Shift+F` (Mac) or `Ctrl+Shift+F` (Windows)
   - Find: `from "./components/ui/`
   - Replace: `from "@/components/ui/`
   - Click "Replace All"

   - Find: `from "./components/figma/`
   - Replace: `from "@/components/figma/`
   - Click "Replace All"

### Solution 2: Manual Fix (If needed)

If you see import errors:
1. Click on the red squiggly line
2. Cursor will show "Quick Fix" option
3. Select "Update import path"
4. Cursor will auto-correct the path

---

## Part 5: Configure Tailwind CSS

### 1. Update `tailwind.config.js`

Replace content with:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        "secondary-accent": {
          DEFAULT: "hsl(var(--secondary-accent))",
          foreground: "hsl(var(--secondary-accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

### 2. Update `src/index.css` or create it

Import your globals.css:
```css
@import './styles/globals.css';
```

OR if globals.css has all the styles, replace `src/index.css` content with the content from `/styles/globals.css`

### 3. Update `src/main.tsx` or `src/index.tsx`

Make sure it imports the CSS:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // or './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## Part 6: Verify Everything Works

### 1. Check for TypeScript Errors

In Cursor:
- Look at the **Problems** panel (View → Problems or `Cmd+Shift+M`)
- Should show 0 errors
- If errors appear, see Part 7 below

### 2. Run the Development Server

In Cursor terminal:
```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Open in Browser

- Click the link in terminal (Cmd+Click or Ctrl+Click)
- OR manually go to `http://localhost:5173/`
- Your app should load without errors

### 4. Check Browser Console

- Press F12 in browser
- Check Console tab
- Should have no red errors

---

## Part 7: Troubleshooting Common Issues

### Issue 1: "Cannot find module" errors

**Error:**
```
Cannot find module '@/components/ui/button'
```

**Fix:**
1. Check `tsconfig.json` has the `paths` configuration (Part 4)
2. Restart TypeScript server in Cursor:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - Type "TypeScript: Restart TS Server"
   - Press Enter

### Issue 2: "cn is not defined"

**Error:**
```
'cn' is not defined
```

**Fix:**
Make sure `src/components/ui/utils.ts` exists with this content:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Issue 3: Radix UI import errors

**Error:**
```
Cannot find module '@radix-ui/react-slot'
```

**Fix:**
Install the missing package:
```bash
npm install @radix-ui/react-slot
```

Repeat for any other missing @radix-ui packages.

### Issue 4: Tailwind classes not working

**Fix:**
1. Make sure `tailwind.config.js` includes your src folder:
   ```javascript
   content: ["./src/**/*.{js,ts,jsx,tsx}"]
   ```
2. Make sure `globals.css` is imported
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue 5: Component not found

**Error:**
```
Module not found: Can't resolve './components/AssessmentFlow'
```

**Fix:**
1. Check the file exists at `src/components/AssessmentFlow.tsx`
2. Check spelling and capitalization match exactly
3. Make sure file extension is `.tsx` not `.ts`

---

## Part 8: Using Cursor AI Features

Cursor has AI built-in. Use it to help:

### Quick Fix Imports
1. When you see import error
2. Press `Cmd+.` (Mac) or `Ctrl+.` (Windows)
3. Select "Quick Fix"
4. Cursor AI will suggest the fix

### Auto-complete Imports
1. Start typing component name: `<AssessmentFlow`
2. Cursor will suggest import
3. Press `Tab` to accept

### Ask Cursor AI for Help
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
2. Type your question:
   - "Why is this import not working?"
   - "How do I fix this path?"
   - "Update all imports to use @ alias"
3. Cursor AI will analyze and suggest fixes

### Use Cursor Chat
1. Press `Cmd+L` (Mac) or `Ctrl+L` (Windows)
2. Ask questions about your code
3. Example: "Check if all my components are imported correctly"

---

## Part 9: Final Checklist

After completing all steps:

```
✅ All 60 files copied from Figma Make
✅ All dependencies installed (npm install)
✅ Folder structure created (components, ui, figma, styles)
✅ Import paths configured (tsconfig.json)
✅ Tailwind configured (tailwind.config.js)
✅ No TypeScript errors in Problems panel
✅ Dev server runs without errors (npm run dev)
✅ App loads in browser without errors
✅ Browser console has no errors
```

---

## Part 10: Next Steps

Once everything is working:

1. **Test Navigation:**
   - Click through different pages
   - Check all buttons work
   - Verify forms function

2. **Integrate Backend:**
   - Connect to your existing API
   - Replace mock data with real data
   - Add authentication

3. **Customize:**
   - Update colors in `globals.css`
   - Modify components as needed
   - Add your own features

4. **Deploy:**
   - Build for production: `npm run build`
   - Deploy to Vercel, Netlify, etc.

---

## Quick Reference: Cursor Keyboard Shortcuts

### File Operations
- **New File**: Right-click folder → New File
- **Save**: `Cmd+S` / `Ctrl+S`
- **Save All**: `Cmd+K S` / `Ctrl+K S`

### Navigation
- **Quick Open**: `Cmd+P` / `Ctrl+P`
- **Go to Symbol**: `Cmd+Shift+O` / `Ctrl+Shift+O`
- **Go to Definition**: `F12`

### Editing
- **Select All**: `Cmd+A` / `Ctrl+A`
- **Copy**: `Cmd+C` / `Ctrl+C`
- **Paste**: `Cmd+V` / `Ctrl+V`
- **Find**: `Cmd+F` / `Ctrl+F`
- **Find in Files**: `Cmd+Shift+F` / `Ctrl+Shift+F`
- **Replace**: `Cmd+H` / `Ctrl+H`

### Terminal
- **Toggle Terminal**: `Ctrl+`` / `Cmd+``
- **New Terminal**: `Ctrl+Shift+`` / `Cmd+Shift+``

### Cursor AI
- **Inline Edit**: `Cmd+K` / `Ctrl+K`
- **Chat**: `Cmd+L` / `Ctrl+L`
- **Quick Fix**: `Cmd+.` / `Ctrl+.`

---

## Support

If you run into issues:

1. **Check Cursor's built-in terminal output** for specific errors
2. **Use Cursor AI Chat** (`Cmd+L` / `Ctrl+L`) to ask for help
3. **Check the Problems panel** (`Cmd+Shift+M` / `Ctrl+Shift+M`) for all errors
4. **Restart TypeScript Server**: `Cmd+Shift+P` / `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

---

## Time Estimate

- **Setup (Parts 1-2)**: 10-15 minutes
- **Copying Files (Part 3)**: 30-45 minutes
- **Configuration (Parts 4-5)**: 10 minutes
- **Verification (Part 6)**: 5 minutes
- **Troubleshooting (if needed)**: 10-20 minutes

**Total: 1-2 hours**

---

That's it! You now have a complete guide for setting up your FirstSignFirst UI in Cursor IDE.
