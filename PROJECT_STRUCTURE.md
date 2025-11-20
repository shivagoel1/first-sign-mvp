# FirstSignFirst - Project Structure

## 📁 Directory Structure

```
app/
├── (auth)/                    # Authentication routes (route group)
│   ├── login/                 # Parent login: /login
│   │   ├── page.tsx
│   │   └── login-form.tsx
│   └── physician/
│       └── login/             # Physician login: /physician/login
│           ├── page.tsx
│           └── login-form.tsx
│
├── (dashboard)/               # Dashboard routes (route group)
│   └── physician/             # Physician dashboard: /dashboard/physician
│       ├── page.tsx
│       └── dashboard-client.tsx
│
├── assessment/                 # Assessment flow (guest users)
│   ├── page.tsx               # /assessment - Landing page
│   ├── questions/              # /assessment/questions
│   │   └── page.tsx
│   └── review/                 # /assessment/review
│       └── page.tsx
│
├── dashboard/                  # Parent dashboard
│   ├── page.tsx               # /dashboard - Redirects to /dashboard/parent
│   └── parent/                 # /dashboard/parent
│       ├── page.tsx
│       └── parent-dashboard-client.tsx
│
├── api/                       # API routes
│   ├── assessment/
│   │   └── submit/             # POST /api/assessment/submit
│   │       └── route.ts
│   ├── ai/
│   │   └── process/            # POST /api/ai/process
│   │       └── route.ts
│   └── physician/
│       ├── assessments/
│       │   └── [assessmentId]/
│       │       └── detail/     # GET /api/physician/assessments/[id]/detail
│       │           └── route.ts
│       └── assessment-results/
│           └── [assessmentResultId]/
│               ├── retry-ai/   # POST /api/physician/assessment-results/[id]/retry-ai
│               │   └── route.ts
│               ├── regenerate-pdf/  # POST /api/physician/assessment-results/[id]/regenerate-pdf
│               │   └── route.ts
│               └── review/     # POST /api/physician/assessment-results/[id]/review
│                   └── route.ts
│
├── layout.tsx                 # Root layout
├── page.tsx                    # Home page: /
├── globals.css                 # Global styles
└── favicon.ico

components/
├── dashboard/                 # Dashboard-specific components
│   └── storybook-viewer.tsx
├── physician/                 # Physician-specific components
│   └── review-modal.tsx
└── ui/                        # Shared UI components (shadcn)
    ├── accordion.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── progress.tsx
    ├── radio-group.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sonner.tsx
    └── textarea.tsx

lib/
├── ai/                        # AI-related utilities
│   ├── agents.ts
│   ├── combine-pages.ts
│   ├── image-generation.ts
│   └── storybook-helpers.ts
├── pdf/                       # PDF generation
│   └── storybook-generator.tsx
├── stores/                    # State management (Zustand)
│   └── guest-assessment-store.ts
├── supabase/                  # Supabase clients
│   ├── admin.ts
│   ├── client.ts
│   ├── server.ts
│   └── service.ts
├── database.types.ts          # TypeScript types for database
└── utils.ts                   # Utility functions

supabase/
└── migrations/                # Database migrations
    └── 20241110_add_ai_processing_status.sql
```

## 🎯 Route Organization

### Public Routes
- `/` - Home page
- `/assessment` - Assessment landing
- `/assessment/questions` - Assessment questions
- `/assessment/review` - Assessment review & signup

### Auth Routes
- `/login` - Parent login
- `/physician/login` - Physician login

### Dashboard Routes
- `/dashboard` - Redirects to `/dashboard/parent`
- `/dashboard/parent` - Parent dashboard
- `/dashboard/physician` - Physician dashboard

### API Routes
- `/api/assessment/submit` - Submit assessment
- `/api/ai/process` - Process AI report generation
- `/api/physician/assessments/[id]/detail` - Get assessment details
- `/api/physician/assessment-results/[id]/retry-ai` - Retry AI generation
- `/api/physician/assessment-results/[id]/regenerate-pdf` - Regenerate PDF
- `/api/physician/assessment-results/[id]/review` - Submit review

## 📦 Component Organization

### Feature Components
- `components/dashboard/` - Dashboard-specific components
- `components/physician/` - Physician-specific components

### Shared Components
- `components/ui/` - Reusable UI components (shadcn)

## 🔧 Benefits of This Structure

1. **Clear Separation**: Routes organized by feature (auth, dashboard, assessment)
2. **Consistent Patterns**: Route groups used effectively
3. **Easy Navigation**: Logical folder structure
4. **Scalable**: Easy to add new features
5. **Maintainable**: Related code grouped together

