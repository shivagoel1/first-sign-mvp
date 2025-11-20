# FirstSignFirst Program Structure Documentation
## Complete System Architecture & Flow

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Directory Structure](#directory-structure)
3. [User Flows](#user-flows)
4. [Data Flow](#data-flow)
5. [API Routes](#api-routes)
6. [AI Processing Pipeline](#ai-processing-pipeline)
7. [Database Schema](#database-schema)
8. [Component Architecture](#component-architecture)

---

## System Overview

**FirstSignFirst** is a Next.js 16 application that helps parents assess their child's developmental milestones and generates personalized AI storybooks.

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini, DALL-E 3
- **State Management**: Zustand (for guest assessments)
- **UI**: Radix UI + Tailwind CSS
- **PDF Generation**: @react-pdf/renderer

---

## Directory Structure

```
first-sign-mvp/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group (doesn't affect URL)
│   │   ├── login/                # Parent login: /login
│   │   └── physician/
│   │       └── login/            # Physician login: /physician/login
│   │
│   ├── api/                      # API Routes
│   │   ├── ai/
│   │   │   └── process/         # POST /api/ai/process
│   │   ├── assessment/
│   │   │   └── submit/          # POST /api/assessment/submit
│   │   └── physician/           # Physician API endpoints
│   │
│   ├── assessment/               # Assessment flow
│   │   ├── page.tsx             # /assessment (landing)
│   │   ├── questions/           # /assessment/questions
│   │   └── review/              # /assessment/review
│   │
│   ├── dashboard/
│   │   ├── page.tsx             # /dashboard (redirects by role)
│   │   ├── parent/              # /dashboard/parent
│   │   └── physician/           # /dashboard/physician
│   │
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage: /
│
├── components/                   # React Components
│   ├── dashboard/
│   │   └── storybook-viewer.tsx  # Storybook modal viewer
│   ├── figma/
│   │   └── image-with-fallback.tsx
│   ├── header.tsx               # Navigation header
│   ├── physician/
│   │   └── review-modal.tsx     # Physician review UI
│   └── ui/                      # Reusable UI components
│
├── lib/                         # Library/Utility Code
│   ├── ai/
│   │   ├── agents.ts            # AI agents (selector, polish)
│   │   ├── combine-pages.ts    # Combines milestones into pages
│   │   ├── image-generation.ts  # DALL-E image generation
│   │   └── storybook-helpers.ts # Main AI storybook logic
│   ├── pdf/
│   │   └── storybook-generator.tsx # PDF generation
│   ├── stores/
│   │   └── guest-assessment-store.ts # Zustand store
│   └── supabase/               # Supabase clients
│
└── supabase/
    └── migrations/              # Database migrations
```

---

## User Flows

### Flow 1: Guest Assessment (No Account Required)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Homepage (/)                                             │
│    - User clicks "Start Free Assessment"                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Assessment Landing (/assessment)                        │
│    - User enters:                                           │
│      • Child's name                                         │
│      • Date of birth                                        │
│      • Focus area (Typically Developing, Autism, etc.)      │
│    - Data stored in Zustand (localStorage)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Assessment Questions (/assessment/questions)             │
│    - Fetches milestones from database                       │
│    - Filters by child's age and focus area                  │
│    - Shows one question at a time                           │
│    - User selects: Yes/Sometimes/Not yet                   │
│    - Can add notes                                          │
│    - Progress bar shows completion                          │
│    - Responses stored in Zustand (localStorage)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Assessment Review (/assessment/review)                   │
│    - Shows all responses grouped by category                │
│    - User can edit responses                               │
│    - User creates account OR logs in                       │
│    - Submits assessment                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. API: /api/assessment/submit                              │
│    - Creates child record                                  │
│    - Creates assessment record                              │
│    - Saves all responses to database                        │
│    - Creates assessment_results record                      │
│    - Triggers AI processing                                 │
│    - Returns assessmentId                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. AI Processing (Background)                               │
│    - POST /api/ai/process                                   │
│    - Generates storybook                                    │
│    - Generates images                                        │
│    - Generates PDFs                                         │
│    - Updates assessment_results                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Parent Dashboard (/dashboard/parent)                     │
│    - Shows child and assessments                           │
│    - Displays storybook when ready                          │
│    - Can download PDF                                       │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Authenticated User Assessment

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User logs in (/login)                                    │
│    - Email/password authentication                          │
│    - Supabase Auth handles session                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Parent Dashboard (/dashboard/parent)                    │
│    - Shows existing children                                │
│    - Can start new assessment                               │
│    - Views existing assessments                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Assessment Flow (Same as Guest Flow)                     │
│    - But data is linked to user account                    │
│    - No account creation needed                            │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Physician Review Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Physician Login (/physician/login)                       │
│    - Email/password                                         │
│    - Role check: must be 'physician'                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Physician Dashboard (/dashboard/physician)               │
│    - Shows pending reviews                                  │
│    - Shows recently reviewed                                │
│    - Statistics                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Review Assessment                                        │
│    - Opens review modal                                     │
│    - Views storybook                                        │
│    - Adds physician notes                                  │
│    - Approves/Rejects/Requests Revision                    │
│    - POST /api/physician/assessment-results/[id]/review    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Assessment Status Updated                                │
│    - Status: 'approved' / 'needs_revision' / 'rejected'    │
│    - parent_visible flag set                               │
│    - Parent can now see storybook                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Assessment Submission Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: /assessment/review                                 │
│ - User clicks "Submit Assessment"                           │
│ - Calls: POST /api/assessment/submit                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JSON: {
                     │   userId, email, fullName,
                     │   childName, dateOfBirth, disease,
                     │   responses: { milestoneId: {response, notes} }
                     │ }
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ API: /api/assessment/submit                                  │
│ 1. Creates/updates child record                             │
│ 2. Creates assessment record                                │
│ 3. Creates assessment_responses (one per milestone)        │
│ 4. Creates assessment_results record                        │
│ 5. Returns assessmentId                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ assessmentId
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Triggers AI Processing                             │
│ - Calls: POST /api/ai/process                                │
│ - Body: { assessmentId }                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ AI Processing Pipeline (see detailed flow below)             │
└─────────────────────────────────────────────────────────────┘
```

### State Management

**Guest Assessment (Zustand Store)**:
```
localStorage (persisted)
└── guest-assessment-storage
    ├── guestSessionId: UUID
    ├── childName: string
    ├── dateOfBirth: string
    ├── ageMonths: number
    ├── disease: string (focus area)
    ├── responses: {
    │   [milestoneId]: {
    │     response: 'yes' | 'no' | 'sometimes' | 'not_sure',
    │     notes?: string
    │   }
    │ }
    └── currentStep: number
```

**Authenticated User**:
- Data stored in Supabase database
- No localStorage needed
- Session managed by Supabase Auth

---

## API Routes

### 1. `/api/assessment/submit` (POST)

**Purpose**: Submit completed assessment

**Request Body**:
```typescript
{
  userId?: string,           // If user is logged in
  email: string,
  fullName: string,
  guestSessionId: string,
  childName: string,
  dateOfBirth: string,
  disease: string,           // Focus area
  responses: {
    [milestoneId]: {
      response: 'yes' | 'no' | 'sometimes' | 'not_sure',
      notes?: string
    }
  }
}
```

**Process**:
1. Creates/updates `children` record
2. Creates `assessments` record
3. Creates `assessment_responses` records
4. Creates `assessment_results` record (with status='pending')
5. Returns `{ assessmentId: string }`

**Response**:
```typescript
{
  assessmentId: string
}
```

---

### 2. `/api/ai/process` (POST)

**Purpose**: Generate AI storybook from assessment

**Request Body**:
```typescript
{
  assessmentId: string,
  verifiedMilestones?: unknown,  // Optional seed data
  forceRegenerate?: boolean
}
```

**Process** (see detailed pipeline below):
1. Check if storybook already exists
2. Get verified milestones
3. Run AI agents (storybook, validation)
4. Generate images
5. Generate PDFs
6. Update database

**Response**:
```typescript
{
  success: boolean,
  assessmentId: string,
  storybook: { pages: [...] },
  images: [...],
  pdfs: {
    parent: string | null,
    physician: string | null
  },
  aiGenerationCost: number,
  aiTokensUsed: number,
  aiImagesGenerated: number
}
```

---

### 3. `/api/physician/assessment-results/[id]/review` (POST)

**Purpose**: Physician reviews and approves/rejects assessment

**Request Body**:
```typescript
{
  status: 'approved' | 'needs_revision' | 'rejected',
  physician_notes?: string,
  parent_visible?: boolean
}
```

**Process**:
1. Updates `assessment_results` record
2. Sets `physician_reviewed = true`
3. Sets `reviewed_by = physician_id`
4. Sets `reviewed_at = now()`
5. Sets `parent_visible` flag

---

## AI Processing Pipeline

### Detailed Flow: `/api/ai/process`

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Check Existing Storybook                            │
│ - Query: assessment_results.ai_report                       │
│ - If exists and not forceRegenerate → return existing      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Get Verified Milestones                              │
│ Function: getVerifiedMilestones(assessmentId)               │
│                                                              │
│ Process:                                                     │
│ 1. Fetch assessment_responses                                │
│ 2. Join with milestones table                               │
│ 3. Join with cdcguidelines table                            │
│ 4. Convert responses to 'met'/'missed' status               │
│    - 'yes' → 'met'                                          │
│    - 'no' → 'missed'                                        │
│    - 'sometimes' → 'met' (with note)                        │
│    - 'not_sure' → 'missed'                                  │
│                                                              │
│ Returns: VerifiedMilestone[]                                │
│   - milestone_code                                          │
│   - category                                                │
│   - age_months                                              │
│   - status: 'met' | 'missed'                                 │
│   - celebration_narrative                                   │
│   - concern_narrative                                       │
│   - parental_encouragement                                   │
│   - red_flag_icon                                           │
│   - storybook_scene_description                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Progress: 20%
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Optional - Selector Agent                           │
│ Function: callSelectorAgent(verified)                       │
│ Condition: if (USE_SELECTOR_AGENT === 'true')               │
│                                                              │
│ Purpose: Reduces number of milestones to process            │
│ - Prioritizes missed/red-flag items                        │
│ - Ensures category coverage                                 │
│ - Limits total to maxSelected (default: 20)                 │
│                                                              │
│ Process:                                                     │
│ - Calls OpenAI GPT-4o-mini                                   │
│ - Prompt: "Select most important milestones"              │
│ - Returns: Set of milestone_code strings                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Storybook Agent                                      │
│ Function: callStorybookAgent(verified)                       │
│                                                              │
│ Process:                                                     │
│ - Calls OpenAI GPT-4o-mini                                   │
│ - Model: gpt-4o-mini                                        │
│ - Temperature: 0.8                                          │
│ - Response Format: JSON                                     │
│                                                              │
│ Prompt:                                                      │
│ - "Generate JSON storybook"                                 │
│ - Use CDC narratives (celebration/concern)                 │
│ - Create unique narrative for each page                     │
│ - Generate illustration prompts                             │
│                                                              │
│ Returns:                                                     │
│ {                                                            │
│   completion: ChatCompletion,                               │
│   storybook: {                                               │
│     pages: [{                                                │
│       page_number: number,                                   │
│       milestone_code: string,                                │
│       display_text: string,                                 │
│       narrative_text: string,                               │
│       visual_flag: string,                                  │
│       illustration_prompts: string[],                       │
│       status: 'met' | 'missed'                               │
│     }]                                                       │
│   }                                                          │
│ }                                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Progress: 40%
                     │ Cost: Calculated from tokens
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Validation Agent                                     │
│ Function: callValidationAgent(draftStorybook, verified)      │
│ Condition: if (SKIP_AI_VALIDATION !== 'true')               │
│                                                              │
│ Purpose: Validates storybook quality                         │
│                                                              │
│ Process:                                                     │
│ - Calls OpenAI GPT-4o-mini                                   │
│ - Checks:                                                    │
│   • Tone is supportive                                       │
│   • Statements align with milestone status                  │
│   • Red flags are present when needed                        │
│   • Illustration prompts are relevant                       │
│                                                              │
│ Returns:                                                     │
│ {                                                            │
│   approved: boolean,                                        │
│   issues: string[],                                          │
│   storybook: { pages: [...] } (corrected if needed)        │
│ }                                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Progress: 50%
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Combine Pages                                        │
│ Function: combinePages(rawPages, verified)                  │
│                                                              │
│ Purpose: Groups multiple small milestones into single pages │
│                                                              │
│ Process:                                                     │
│ - Groups milestones by category                             │
│ - Combines related milestones                               │
│ - Creates combined narrative                                │
│ - Merges illustration prompts                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Optional - Polish Agent                             │
│ Function: callPolishCombinedPage(page)                       │
│ Condition: if (USE_POLISH_AGENT === 'true')                 │
│                                                              │
│ Purpose: Refines captions and illustration prompts           │
│                                                              │
│ Process:                                                     │
│ - Calls OpenAI GPT-4o-mini per page                         │
│ - Refines narrative_text                                    │
│ - Refines illustration_prompts                              │
│ - Maintains CDC narrative style                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 8: Generate Images                                      │
│ Function: generateStorybookImages(imagePrompts, assessmentId)│
│                                                              │
│ Process:                                                     │
│ - For each page:                                             │
│   1. Create image prompt from illustration_prompts          │
│   2. Call DALL-E 3 API                                      │
│   3. Download generated image                               │
│   4. Upload to Supabase Storage (storybook-images bucket)   │
│   5. Get public URL                                          │
│                                                              │
│ - Retry logic: 2 attempts per image                         │
│ - Fallback: placeholder image if fails                      │
│                                                              │
│ Returns: GeneratedImage[]                                    │
│   - page_number                                             │
│   - image_url                                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Progress: 75%
                     │ Cost: $0.04 per image
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 9: Generate PDFs                                        │
│ Function: generateStorybookPDF(storybook, child, version)  │
│                                                              │
│ Process:                                                     │
│ - For 'parent' and 'physician' versions:                    │
│   1. Download and compress images                            │
│   2. Build PDF using @react-pdf/renderer                    │
│   3. Compress PDF buffer                                    │
│   4. Upload to Supabase Storage (storybook-pdfs bucket)    │
│   5. Get public URL                                          │
│                                                              │
│ - Retry logic: 2 attempts                                    │
│                                                              │
│ Returns: publicUrl (string | null)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Progress: 90%
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 10: Update Database                                     │
│ - Updates assessment_results:                                │
│   • ai_report: JSON string of storybook                     │
│   • parent_pdf_url: string                                  │
│   • physician_pdf_url: string                               │
│   • status: 'awaiting_review'                                │
│   • ai_processing_status: 'completed'                       │
│   • ai_processing_progress: 100                              │
│   • ai_generation_cost: number                              │
│   • ai_tokens_used: number                                  │
│   • ai_images_generated: number                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Key Tables

#### 1. `assessments`
```sql
- id: UUID (PK)
- child_id: UUID (FK → children)
- parent_id: UUID (FK → profiles, nullable)
- age_at_assessment_months: INTEGER
- status: 'in_progress' | 'completed' | 'abandoned' | 'in_review' | 'reviewed'
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- guest_session_id: TEXT (for guest assessments)
```

#### 2. `assessment_responses`
```sql
- id: UUID (PK)
- assessment_id: UUID (FK → assessments)
- milestone_id: UUID (FK → milestones)
- response: 'yes' | 'no' | 'sometimes' | 'not_sure'
- notes: TEXT (nullable)
```

#### 3. `assessment_results`
```sql
- id: UUID (PK)
- assessment_id: UUID (FK → assessments, UNIQUE)
- status: 'pending' | 'generating' | 'awaiting_review' | 'approved' | 'needs_revision' | 'rejected'
- ai_report: TEXT (JSON string of storybook)
- parent_pdf_url: TEXT
- physician_pdf_url: TEXT
- parent_visible: BOOLEAN
- physician_reviewed: BOOLEAN
- physician_notes: TEXT
- reviewed_by: UUID (FK → profiles)
- ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed'
- ai_processing_progress: INTEGER (0-100)
- ai_generation_cost: NUMERIC
- ai_tokens_used: INTEGER
- ai_images_generated: INTEGER
```

#### 4. `milestones`
```sql
- id: UUID (PK)
- milestone_code: TEXT (UNIQUE)
- category: 'Social-Emotional' | 'Language/Communication' | 'Motor' | 'Cognitive'
- age_months: INTEGER
- question: TEXT
- options: TEXT (JSON string)
```

#### 5. `cdcguidelines`
```sql
- guidelinecode: TEXT (PK, FK → milestones.milestone_code)
- focusarea: TEXT
- agemonthsmin: INTEGER
- agemonthsmax: INTEGER
- category: TEXT
- guidelinetext: TEXT
- storybookscenedescription: TEXT
- celebrationnarrative: TEXT
- concernnarrative: TEXT
- parental_encouragement: TEXT
- red_flag_icon: TEXT
```

#### 6. `children`
```sql
- id: UUID (PK)
- parent_id: UUID (FK → profiles)
- child_name: TEXT
- date_of_birth: DATE
- gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
```

#### 7. `profiles`
```sql
- id: UUID (PK, FK → auth.users)
- email: TEXT (UNIQUE)
- full_name: TEXT
- role: 'parent' | 'physician' | 'admin'
```

---

## Component Architecture

### Page Components

```
app/
├── page.tsx                    # Homepage
├── layout.tsx                  # Root layout (provides auth context)
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx            # Parent login page
│   └── physician/login/
│       └── page.tsx            # Physician login page
│
├── assessment/
│   ├── page.tsx                # Assessment landing (child info form)
│   ├── questions/
│   │   └── page.tsx            # Question-by-question assessment
│   └── review/
│       └── page.tsx            # Review all responses, submit
│
└── dashboard/
    ├── page.tsx                # Redirects by role
    ├── parent/
    │   ├── page.tsx            # Server component (fetches data)
    │   └── parent-dashboard-client.tsx  # Client component (UI)
    └── physician/
        ├── page.tsx            # Server component
        └── dashboard-client.tsx # Client component
```

### Reusable Components

```
components/
├── header.tsx                  # Navigation header (all pages)
├── dashboard/
│   └── storybook-viewer.tsx    # Modal for viewing storybook
├── physician/
│   └── review-modal.tsx        # Physician review interface
└── ui/                         # Radix UI components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── ...
```

### Library Functions

```
lib/
├── ai/
│   ├── storybook-helpers.ts   # Main AI logic
│   │   ├── getVerifiedMilestones()
│   │   ├── callStorybookAgent()
│   │   └── callValidationAgent()
│   ├── agents.ts              # Additional agents
│   │   ├── callSelectorAgent()
│   │   └── callPolishCombinedPage()
│   ├── combine-pages.ts       # Page combination logic
│   └── image-generation.ts    # DALL-E image generation
│
├── pdf/
│   └── storybook-generator.tsx # PDF generation
│
├── stores/
│   └── guest-assessment-store.ts  # Zustand store
│
└── supabase/
    ├── server.ts              # Server-side Supabase client
    ├── client.ts              # Client-side Supabase client
    └── service.ts             # Service-role client (bypasses RLS)
```

---

## Key Functions & Their Purposes

### Data Processing

**`getVerifiedMilestones(assessmentId)`**
- Fetches assessment responses from database
- Joins with milestones and cdcguidelines
- Converts responses to 'met'/'missed' status
- Returns structured data for AI processing

**`verifyMilestones(data)`**
- Converts raw response data to verified milestone format
- Maps responses: yes→met, no→missed, sometimes→met, not_sure→missed

### AI Agents

**`callStorybookAgent(verified)`**
- Main storybook generation
- Uses GPT-4o-mini
- Generates narrative text and illustration prompts
- Returns JSON storybook structure

**`callValidationAgent(storybook, verified)`**
- Validates storybook quality
- Checks tone, accuracy, completeness
- Returns approved/not approved with issues

**`callSelectorAgent(verified)`**
- Optional: Reduces milestone set
- Prioritizes important milestones
- Returns set of selected milestone codes

**`callPolishCombinedPage(page)`**
- Optional: Refines page content
- Improves narrative and prompts
- Maintains CDC style

### Image & PDF Generation

**`generateStorybookImages(prompts, assessmentId)`**
- Generates images using DALL-E 3
- Uploads to Supabase Storage
- Returns image URLs

**`generateStorybookPDF(storybook, child, version)`**
- Generates PDF using @react-pdf/renderer
- Creates parent and physician versions
- Uploads to Supabase Storage
- Returns PDF URLs

### State Management

**`useGuestAssessmentStore()`**
- Zustand store for guest assessments
- Persists to localStorage
- Manages: child info, responses, current step

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User visits protected route                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Component checks auth                              │
│    - await supabase.auth.getUser()                          │
│    - If no user → redirect('/login')                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Check user role                                           │
│    - Query profiles table                                   │
│    - If role === 'physician' → redirect('/dashboard/physician')│
│    - Else → redirect('/dashboard/parent')                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Storage Structure

### Supabase Storage Buckets

**`storybook-images/`**
```
{assessmentId}/
  ├── 1.png
  ├── 2.png
  └── ...
```

**`storybook-pdfs/`**
```
{assessmentId}/
  ├── parent.pdf
  └── physician.pdf
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini  # Default

# Optional Feature Flags
USE_SELECTOR_AGENT=false
USE_POLISH_AGENT=false
SKIP_AI_VALIDATION=false
SELECTOR_MAX_ITEMS=20
AI_PROCESSING_TIMEOUT_MS=300000
```

---

## Error Handling

### Assessment Submission
- Validates all required fields
- Normalizes response values to database enum
- Validates milestone IDs exist
- Returns detailed error messages

### AI Processing
- Timeout protection (5 minutes default)
- Retry logic for images (2 attempts)
- Retry logic for PDFs (2 attempts)
- Fallback to placeholder images
- Updates `ai_processing_status` to 'failed' on error
- Logs detailed error information

---

## Performance Considerations

1. **AI Processing**: Runs asynchronously (doesn't block user)
2. **Image Generation**: Parallel processing (Promise.all)
3. **PDF Generation**: Sequential (one at a time)
4. **Database Queries**: Uses joins to minimize queries
5. **Caching**: Storybook stored in database (no regeneration needed)
6. **Progress Tracking**: Real-time updates to `ai_processing_progress`

---

*This documentation represents the current state of the FirstSignFirst application as of the latest implementation.*

