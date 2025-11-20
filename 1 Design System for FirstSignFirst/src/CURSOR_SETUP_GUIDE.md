# 🚀 FirstSignFirst - Cursor IDE Setup Guide

Complete guide to export your Figma Make project to Cursor IDE.

## 📥 Quick Export Method

### Option 1: Download from Figma Make (Recommended)

1. **In Figma Make**, click the **Download/Export** button
2. This will download a `.zip` file with your entire project
3. Extract the ZIP file
4. Open the extracted folder in Cursor IDE

### Option 2: Manual File Copy

Follow the detailed instructions in `EXPORT_FILES_LIST.md`

---

## 🛠️ Setting Up in Cursor

### Step 1: Open Project in Cursor

```bash
# Navigate to your extracted/created project folder
cd firstsignfirst

# Open in Cursor
cursor .
```

Or simply: **File → Open Folder** in Cursor

### Step 2: Install Dependencies

Open the integrated terminal in Cursor (`Ctrl+`` or `Cmd+``) and run:

```bash
npm install
```

This will install all ~60 dependencies needed for the project.

### Step 3: Verify Project Structure

Your project should look like this:

```
firstsignfirst/
├── node_modules/          (created after npm install)
├── public/
├── src/
│   ├── components/
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   ├── ui/            (48 ShadCN components)
│   │   ├── AssessmentFlow.tsx
│   │   ├── Header.tsx
│   │   ├── HomePage.tsx
│   │   ├── ParentDashboard.tsx
│   │   ├── ParentLogin.tsx
│   │   ├── PhysicianDashboard.tsx
│   │   ├── PhysicianLogin.tsx
│   │   ├── ResultsPage.tsx
│   │   └── StorybookViewer.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── postcss.config.js
```

### Step 4: Run Development Server

```bash
npm run dev
```

You should see:

```
  VITE v5.2.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

Open http://localhost:5173/ in your browser.

### Step 5: Verify Everything Works

Test each page:
- ✅ Home page loads
- ✅ Assessment flow works
- ✅ Parent login → Dashboard
- ✅ Physician login → Dashboard
- ✅ Storybook viewer opens
- ✅ All interactions work

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Module Not Found Errors

**Error**: `Cannot find module './components/ui/button'`

**Solution**: Check import paths match your structure:
```typescript
// If using @ alias (configured in vite.config.ts)
import { Button } from "@/components/ui/button"

// Or relative imports
import { Button } from "./components/ui/button"
```

### Issue 2: Tailwind Styles Not Loading

**Error**: No styles applied, everything looks unstyled

**Solution**:
1. Ensure `globals.css` is imported in `main.tsx`:
   ```typescript
   import './styles/globals.css'
   ```
2. Check `postcss.config.js` exists
3. Restart dev server

### Issue 3: TypeScript Errors

**Error**: Various TS errors about types

**Solution**:
```bash
# Install type definitions
npm install -D @types/react @types/react-dom @types/node

# Run type check
npm run type-check
```

### Issue 4: Build Fails

**Error**: Build fails with various errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Issue 5: Images Not Loading

**Error**: Broken image icons

**Solution**:
- Unsplash images require internet connection
- Replace with your own images for production
- Check if `ImageWithFallback` component is properly imported

---

## 🎯 Next Development Steps

### 1. Backend Integration (Supabase)

Create a `.env` file in project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Install Supabase client:

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2. Replace Mock Data with Real API Calls

Current implementation uses mock data:
- `ParentDashboard.tsx` - Mock children and assessments
- `PhysicianDashboard.tsx` - Mock assessment queue
- `AssessmentFlow.tsx` - Mock milestone data

Replace with Supabase queries:

```typescript
// Example: Fetch assessments
const { data: assessments, error } = await supabase
  .from('assessments')
  .select('*')
  .eq('parent_id', userId)
```

### 3. Add Authentication

Implement real auth with Supabase:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'parent@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'parent@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()
```

### 4. Implement PDF Generation

For storybook PDFs, add:

```bash
npm install jspdf html2canvas
```

Create PDF generator:

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generateStorybookPDF(element: HTMLElement) {
  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF()
  pdf.addImage(imgData, 'PNG', 0, 0)
  pdf.save('storybook.pdf')
}
```

### 5. Set Up Database Schema

Supabase tables needed:

```sql
-- Users table (handled by Supabase Auth)

-- Children table
create table children (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid references auth.users(id),
  name text not null,
  date_of_birth date not null,
  created_at timestamp with time zone default now()
);

-- Assessments table
create table assessments (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid references children(id),
  status text not null,
  responses jsonb,
  storybook_ready boolean default false,
  physician_id uuid references auth.users(id),
  physician_notes text,
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone
);

-- Milestones table
create table milestones (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  category text not null,
  age_range text not null,
  question text not null,
  description text
);
```

---

## 📚 Useful Cursor Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint

# Install new package
npm install package-name

# Install dev dependency
npm install -D package-name
```

---

## 🎨 Customization Guide

### Change Color Scheme

Edit `src/styles/globals.css`:

```css
:root {
  /* Change primary color */
  --primary: #your-color-here;
  
  /* Change secondary accent */
  --secondary-accent: #your-color-here;
}
```

### Add New Components

```bash
# Using ShadCN CLI (if you want to add more UI components)
npx shadcn-ui@latest add [component-name]
```

### Modify Layout

The main layout is controlled by:
- `App.tsx` - Overall routing and page switching
- `Header.tsx` - Navigation header
- Individual page components for content

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Environment Variables for Production

Remember to add these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📖 Resources

- **React Documentation**: https://react.dev
- **Vite Documentation**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **ShadCN UI**: https://ui.shadcn.com
- **Supabase**: https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🆘 Getting Help

### In Cursor IDE

1. Use **Cursor AI Chat** (Cmd+L or Ctrl+L) to ask questions about the code
2. Select code and use **Cmd+K** or **Ctrl+K** for inline editing
3. Use **Copilot** for code suggestions

### Common AI Prompts for Cursor

- "Explain this component"
- "Add error handling to this function"
- "Convert this to use Supabase instead of mock data"
- "Add loading states to this component"
- "Write tests for this component"

---

## ✅ Final Checklist

Before you start developing:

- [ ] Project opens in Cursor
- [ ] All dependencies installed (`npm install`)
- [ ] Dev server runs (`npm run dev`)
- [ ] All pages load correctly
- [ ] No console errors in browser
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Ready to add backend integration

---

**Setup Complete! 🎉**

You're now ready to develop FirstSignFirst in Cursor IDE.

Start by:
1. Setting up Supabase backend
2. Connecting authentication
3. Replacing mock data with real API calls
4. Adding PDF generation
5. Testing with real data

Happy coding! 👨‍💻👩‍💻

---

**Last Updated**: November 18, 2025
**Figma Make → Cursor Export Guide**
**FirstSignFirst v1.0.0**
