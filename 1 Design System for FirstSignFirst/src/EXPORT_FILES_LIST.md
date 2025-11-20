# Complete File Export List for FirstSignFirst

Use this checklist to ensure you've copied all files from Figma Make to your Cursor project.

## 📦 Step-by-Step Export Instructions

### Step 1: Create Project Structure in Cursor

Create the following folder structure in your Cursor project:

```
your-project/
├── src/
│   ├── components/
│   │   ├── figma/
│   │   └── ui/
│   └── styles/
```

### Step 2: Copy Main Application Files

#### Root Level Files
- [x] `package.json` - Dependencies configuration
- [x] Copy from Figma Make to Cursor root

#### Source Files (src/)
- [x] `App.tsx` - Main application router
  - Copy from: `/App.tsx`
  - Copy to: `src/App.tsx`

#### Styles (src/styles/)
- [x] `globals.css` - Design tokens and global styles
  - Copy from: `/styles/globals.css`
  - Copy to: `src/styles/globals.css`

### Step 3: Copy Component Files

#### Main Components (src/components/)

1. **AssessmentFlow.tsx**
   - Copy from: `/components/AssessmentFlow.tsx`
   - Copy to: `src/components/AssessmentFlow.tsx`
   - Purpose: 5-10 minute milestone assessment flow

2. **Header.tsx**
   - Copy from: `/components/Header.tsx`
   - Copy to: `src/components/Header.tsx`
   - Purpose: Global navigation header

3. **HomePage.tsx**
   - Copy from: `/components/HomePage.tsx`
   - Copy to: `src/components/HomePage.tsx`
   - Purpose: Landing page with hero and features

4. **ParentDashboard.tsx**
   - Copy from: `/components/ParentDashboard.tsx`
   - Copy to: `src/components/ParentDashboard.tsx`
   - Purpose: Parent dashboard with multi-child tracking

5. **ParentLogin.tsx**
   - Copy from: `/components/ParentLogin.tsx`
   - Copy to: `src/components/ParentLogin.tsx`
   - Purpose: Parent authentication page

6. **PhysicianDashboard.tsx**
   - Copy from: `/components/PhysicianDashboard.tsx`
   - Copy to: `src/components/PhysicianDashboard.tsx`
   - Purpose: Physician review dashboard

7. **PhysicianLogin.tsx**
   - Copy from: `/components/PhysicianLogin.tsx`
   - Copy to: `src/components/PhysicianLogin.tsx`
   - Purpose: Physician authentication page

8. **ResultsPage.tsx**
   - Copy from: `/components/ResultsPage.tsx`
   - Copy to: `src/components/ResultsPage.tsx`
   - Purpose: Assessment results display

9. **StorybookViewer.tsx**
   - Copy from: `/components/StorybookViewer.tsx`
   - Copy to: `src/components/StorybookViewer.tsx`
   - Purpose: AI-generated storybook viewer dialog

### Step 4: Copy System Components

#### Figma Components (src/components/figma/)

1. **ImageWithFallback.tsx** ⚠️ PROTECTED
   - Copy from: `/components/figma/ImageWithFallback.tsx`
   - Copy to: `src/components/figma/ImageWithFallback.tsx`
   - ⚠️ **DO NOT MODIFY THIS FILE**

### Step 5: Copy UI Components (ShadCN)

#### All UI Components (src/components/ui/)

Copy ALL the following files from `/components/ui/` to `src/components/ui/`:

1. `accordion.tsx`
2. `alert-dialog.tsx`
3. `alert.tsx`
4. `aspect-ratio.tsx`
5. `avatar.tsx`
6. `badge.tsx`
7. `breadcrumb.tsx`
8. `button.tsx`
9. `calendar.tsx`
10. `card.tsx`
11. `carousel.tsx`
12. `chart.tsx`
13. `checkbox.tsx`
14. `collapsible.tsx`
15. `command.tsx`
16. `context-menu.tsx`
17. `dialog.tsx`
18. `drawer.tsx`
19. `dropdown-menu.tsx`
20. `form.tsx`
21. `hover-card.tsx`
22. `input-otp.tsx`
23. `input.tsx`
24. `label.tsx`
25. `menubar.tsx`
26. `navigation-menu.tsx`
27. `pagination.tsx`
28. `popover.tsx`
29. `progress.tsx`
30. `radio-group.tsx`
31. `resizable.tsx`
32. `scroll-area.tsx`
33. `select.tsx`
34. `separator.tsx`
35. `sheet.tsx`
36. `sidebar.tsx`
37. `skeleton.tsx`
38. `slider.tsx`
39. `sonner.tsx`
40. `switch.tsx`
41. `table.tsx`
42. `tabs.tsx`
43. `textarea.tsx`
44. `toggle-group.tsx`
45. `toggle.tsx`
46. `tooltip.tsx`
47. `use-mobile.ts`
48. `utils.ts`

### Step 6: Additional Configuration Files

You'll need to create these additional files in Cursor:

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### tsconfig.json
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

#### tsconfig.node.json
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### index.html (in root)
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FirstSignFirst - Pediatric Developmental Milestones</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### src/main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Step 7: Update Import Paths

If your project structure is different, you may need to update imports:

**Current structure (Figma Make):**
- Components: `./components/ComponentName`
- UI Components: `./components/ui/component-name`
- Styles: Imported via Figma Make system

**New structure (Cursor):**
- Components: `./components/ComponentName` or `@/components/ComponentName`
- UI Components: `./components/ui/component-name` or `@/components/ui/component-name`
- Styles: `import './styles/globals.css'` in main.tsx

## 📋 Quick Verification Checklist

After copying all files, verify:

- [ ] All 9 main component files copied
- [ ] All 48 UI component files copied
- [ ] 1 Figma system component copied
- [ ] globals.css copied
- [ ] package.json copied
- [ ] Configuration files created
- [ ] Dependencies installed (`npm install`)
- [ ] Project builds successfully (`npm run build`)
- [ ] Development server runs (`npm run dev`)
- [ ] All pages accessible and functional

## 🚀 Installation Commands

```bash
# Navigate to your project
cd your-project

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚠️ Important Notes

1. **Protected Files**: `/components/figma/ImageWithFallback.tsx` should not be modified
2. **Import Paths**: Update if your structure differs from Figma Make
3. **Environment Variables**: Add `.env` file for any API keys (Supabase, etc.)
4. **Tailwind Config**: Using Tailwind v4 - no config file needed, tokens in globals.css
5. **Images**: Update Unsplash image URLs with your own assets in production

## 🎨 Design System

All design tokens are in `globals.css`:
- Primary: `#ea580c` (Deep Orange)
- Secondary Accent: `#1e40af` (Deep Blue)
- Success: `#16a34a` (Green)
- Warning: `#ea580c` (Orange)

## 📝 File Count Summary

- **Main Components**: 9 files
- **UI Components**: 48 files
- **System Components**: 1 file
- **Style Files**: 1 file
- **Config Files**: 6 files
- **Total**: 65 files

## 🔄 Next Steps After Export

1. ✅ Copy all files
2. ✅ Install dependencies
3. ✅ Test locally
4. 🔲 Connect to Supabase backend
5. 🔲 Add authentication
6. 🔲 Replace mock data with real API calls
7. 🔲 Add PDF generation for storybooks
8. 🔲 Deploy to production

---

**Export Date**: November 18, 2025
**Project**: FirstSignFirst v1.0.0
**Status**: ✅ Ready for Cursor Export

