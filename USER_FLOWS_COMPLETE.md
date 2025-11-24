# Complete User Flows Documentation

## Overview
This document maps all user flows, screens, API endpoints, forms, interactions, and PDF generation paths in the FirstSignFirst application.

---

## User Types
1. **Guest User** - Unauthenticated user taking assessment
2. **Parent User** - Authenticated parent with account
3. **Physician User** - Authenticated physician reviewer

---

## FLOW 1: Guest Assessment Flow (No Account Required)

### Screen 1: Landing Page (`/`)
**Route**: `app/page.tsx`
**User Action**: 
- User visits homepage
- Sees hero section with "Track Your Child's Growth Journey"
- Views features, how it works, why us, FAQ sections
- Clicks "Get Your Free Assessment" button

**Interactions**:
- Navigation links (Features, How It Works, Why Us, FAQ)
- "Get Your Free Assessment" CTA button → `/assessment`
- "Login" dropdown in header → `/login` or `/dashboard/physician`
- Mobile menu (hamburger) for navigation

**API Calls**: None

---

### Screen 2: Assessment Landing Page (`/assessment`)
**Route**: `app/assessment/page.tsx`
**User Action**:
- User enters child information:
  - Child's name (required)
  - Date of birth (required, validates age)
  - Focus area (required): Typically Developing, Autism Spectrum, Cerebral Palsy, Down Syndrome
- Clicks "Continue to Assessment" button

**Form Fields**:
- `childName`: Text input
- `dateOfBirth`: Date picker
- `focusArea`: Select dropdown

**Data Storage**: 
- Stored in `useGuestAssessmentStore` (Zustand) - client-side only
- Generates `guestSessionId` for tracking

**Validation**:
- All fields required
- Date must be valid
- Age calculated in months

**Next Step**: → `/assessment/questions`

**API Calls**: None (client-side only)

---

### Screen 3: Assessment Questions Page (`/assessment/questions`)
**Route**: `app/assessment/questions/page.tsx`
**User Action**:
- User answers milestone questions one at a time
- Questions are filtered by child's age (age-appropriate milestones)
- Each question shows:
  - Category badge (Social-Emotional, Language/Communication, Motor, Cognitive)
  - Question text
  - Response options (Yes frequently, Sometimes, Not yet)
  - Optional notes field
- Progress bar shows completion percentage
- Navigation: Previous/Next buttons
- Can navigate back to previous questions

**Form Fields**:
- Radio buttons for response (yes/sometimes/no)
- Optional textarea for notes per question

**Data Storage**:
- Responses stored in `useGuestAssessmentStore`
- Key: `milestone_id` → `{ response: string, notes?: string }`

**Question Loading**:
- Fetches milestones from Supabase based on:
  - Child's age in months
  - Focus area (disease)
  - Active milestones only

**Interactions**:
- Previous button (disabled on first question)
- Next button (disabled if no response selected)
- "Complete Assessment" button on last question
- Progress indicator
- Category color coding

**API Calls**:
- `GET /api/milestones` (via Supabase client) - Fetches age-appropriate milestones

**Next Step**: → `/assessment/review`

---

### Screen 4: Assessment Review Page (`/assessment/review`)
**Route**: `app/assessment/review/page.tsx`
**User Action**:
- User reviews:
  - Child information (name, DOB, age, focus area)
  - All assessment responses grouped by category
  - Can edit child info (returns to `/assessment`)
  - Can edit responses (returns to `/assessment/questions`)
- User must create account to submit:
  - Full name
  - Email
  - Password
  - Confirm password
- Clicks "Create Account & Submit Assessment"

**Form Fields**:
- Review section (read-only):
  - Child name, DOB, age, focus area
  - Responses by category (Social-Emotional, Language/Communication, Motor, Cognitive)
- Signup form:
  - Full name (required)
  - Email (required, validated)
  - Password (required, min length)
  - Confirm password (must match)

**Data Storage**:
- Assessment data from `useGuestAssessmentStore`
- New account created via Supabase Auth

**Interactions**:
- "Edit Child Info" button → `/assessment`
- "Edit Responses" button → `/assessment/questions`
- "Create Account & Submit Assessment" button
- Form validation with error messages

**API Calls**:
- `POST /api/assessment/submit` - Submits assessment and creates account
  - Creates/updates profile
  - Creates/updates child record
  - Creates/updates assessment
  - Inserts assessment responses
  - Creates assessment_result with status 'awaiting_review'
  - Creates physician_referral

**Next Step**: → `/dashboard/parent` (redirected after successful submission)

---

## FLOW 2: Parent Login & Dashboard Flow

### Screen 5: Parent Login Page (`/login`)
**Route**: `app/(auth)/login/page.tsx`
**User Action**:
- User enters:
  - Email
  - Password
- Clicks "Login to Dashboard"
- Optional: "Remember me" checkbox
- Link to "Forgot password?" (placeholder)

**Form Fields**:
- Email (required)
- Password (required)
- Remember me (checkbox)

**Interactions**:
- Login form submission
- If user has pending guest assessment, it's automatically submitted
- Redirects based on role:
  - Parent → `/dashboard/parent`
  - Physician → `/dashboard/physician`

**API Calls**:
- `POST /api/auth/signin` (via Supabase Auth)
- `POST /api/assessment/submit` (if pending guest assessment exists)

**Next Step**: → `/dashboard/parent` or `/dashboard/physician`

---

### Screen 6: Parent Dashboard Overview (`/dashboard/parent`)
**Route**: `app/dashboard/parent/page.tsx` (server) + `app/dashboard/parent/parent-dashboard-client.tsx` (client)

**User Action**:
- User sees dashboard with:
  - Welcome section (only in overview mode)
  - Progress Overview (aggregate stats across all children):
    - Approved assessments count
    - Pending assessments count
    - Generating assessments count
    - Report completion percentage
  - Quick Actions (only in overview):
    - Start New Assessment
  - Alerts & Notifications (only in overview):
    - Pending reviews count
    - Generating storybooks count
  - Recent Activity Feed (only in overview):
    - Last 5 assessments across all children
  - Your Children section (only if multiple children):
    - List/grid of children with:
      - Child name, age, gender
      - Last assessment date
      - Pending indicator badge
      - Progress bar
      - "View" and "New Assessment" buttons

**Interactions**:
- Click child name → Shows child detail view
- Click "View" on child card → Shows child detail view
- Click "New Assessment" → `/assessment`
- Sidebar navigation:
  - Dashboard (overview)
  - My Children (expandable list)
  - New Assessment
  - All Storybooks
- Header actions:
  - Search (placeholder)
  - Notifications (placeholder)
  - User menu (Settings, Help & Support, Logout)

**API Calls**:
- Server-side: Fetches children and assessments from Supabase
- Client-side: Polls for assessment status updates

**Data Displayed**:
- Children list with assessments
- Assessment statuses: pending, generating, approved, needs_revision, rejected
- Progress indicators
- Last assessment dates

---

### Screen 7: Parent Dashboard - Child Detail View (`/dashboard/parent?child={childId}`)
**Route**: Same as overview, but with `child` query parameter

**User Action**:
- User sees child-specific view:
  - Child's name header
  - Progress Overview (child-specific stats)
  - Assessments List:
    - All assessments for this child
    - Each assessment shows:
      - Assessment date and age
      - Status badge (Awaiting Review, Generating, Approved, etc.)
      - Preview image (if available)
      - Milestones met/needs support counts
      - Progress percentage
      - Quick actions: View Storybook, Download PDF, Favorite, Share
    - Filters: All, Approved, Pending, Generating
    - Search by assessment
    - Sort: Newest, Oldest, Progress
    - View modes: Grid, List, Compact

**Interactions**:
- Click "View Storybook" → Opens storybook viewer modal
- Click "Download PDF" → Downloads PDF from `parent_pdf_url`
- Click assessment card → Opens storybook viewer
- Filter by status
- Search assessments
- Sort assessments
- Toggle favorite
- Share assessment (native share API or clipboard)
- "New Assessment" button → `/assessment`

**API Calls**:
- `GET /api/parent/assessments/[assessmentId]/storybook` - Fetches latest storybook data
  - Returns: `ai_report`, `parent_pdf_url`, `updated_at`
  - Validates articles on retrieval

**Status Flow**:
1. **Awaiting Review** - Assessment submitted, waiting for physician
2. **Generating** - Physician approved, AI processing storybook
3. **Approved** - Storybook ready, visible to parent

---

### Screen 8: Storybook Viewer Modal
**Component**: `components/dashboard/storybook-viewer.tsx`
**User Action**:
- User views interactive storybook:
  - Page-by-page navigation (Previous/Next buttons)
  - Keyboard navigation (Arrow keys, Escape to close)
  - Each page shows:
    - Milestone image
    - Narrative text
    - Status badge (Milestone Met / Needs Support)
    - Category tag
    - For "Needs Support" pages: Helpful Resources section with articles
  - Download PDF button (if available)
  - Page counter (e.g., "Page 1 of 15")

**Interactions**:
- Previous/Next buttons
- Keyboard arrows
- Escape to close
- Click article link → Opens in new tab
- Download PDF button

**Data Source**:
- `ai_report` from assessment_result
- `parent_pdf_url` for download
- Articles validated on retrieval

**API Calls**:
- `GET /api/parent/assessments/[assessmentId]/storybook` - Fetches storybook data

---

### Screen 9: All Storybooks Page (`/dashboard/parent/storybooks`)
**Route**: `app/dashboard/parent/storybooks/page.tsx` + `app/dashboard/parent/storybooks/all-storybooks-view.tsx`

**User Action**:
- User sees all storybooks across all children:
  - Summary stats:
    - Total storybooks
    - Approved count
    - Pending count
    - Generating count
  - Filters:
    - Search by child name or assessment
    - Filter by status
    - Sort options
  - View modes: Grid or List
  - Each storybook card shows:
    - Child name
    - Assessment date
    - Preview image
    - Status badge
    - Total pages
    - Quick actions: View, Download PDF

**Interactions**:
- Search storybooks
- Filter by status
- Sort storybooks
- Toggle grid/list view
- Click storybook → Opens storybook viewer
- Download PDF

**API Calls**:
- Server-side: Fetches all children and assessments
- `GET /api/parent/assessments/[assessmentId]/storybook` - When viewing storybook

---

## FLOW 3: Physician Login & Review Flow

### Screen 10: Physician Login Page (`/dashboard/physician/login`)
**Route**: `app/(auth)/physician/login/page.tsx`
**User Action**:
- User can sign in or sign up:
  - **Sign In Mode**:
    - Professional email
    - Password
  - **Sign Up Mode**:
    - Full name (required)
    - Professional email
    - Password
- Toggle between sign in/sign up
- Clicks "Access Review Dashboard" or "Create Account"

**Form Fields**:
- Full name (sign up only, required)
- Email (required)
- Password (required)

**Interactions**:
- Toggle sign in/sign up mode
- Form submission
- Role verification (must be 'physician')

**API Calls**:
- `POST /api/auth/signup` (via Supabase Auth) - Creates physician account
- `POST /api/auth/signin` (via Supabase Auth) - Signs in physician
- Profile upsert with role='physician'

**Next Step**: → `/dashboard/physician`

---

### Screen 11: Physician Dashboard (`/dashboard/physician`)
**Route**: `app/dashboard/physician/page.tsx` (server) + `app/dashboard/physician/dashboard-client.tsx` (client)

**User Action**:
- User sees dashboard with:
  - Stats cards:
    - Pending Reviews count
    - Approved Assessments count
    - Average Review Time
  - Pending Reviews section:
    - List of assessments awaiting review
    - Each card shows:
      - Child name and age
      - Parent name and email
      - Red flag count
      - Completion date
      - Priority badge (High/Medium/Low)
      - AI processing status and progress (if generating)
      - Thumbnail preview (if available)
    - Filters: All, High Priority, Has Flags, Processing, Ready
    - Sort: Newest, Oldest, Most Flags, Priority, Name
    - Search functionality
    - "Review Next" button (highest priority)
  - Recently Reviewed section:
    - List of recently completed reviews
    - Shows child name, status, review date

**Interactions**:
- Click assessment card → Opens review modal
- "Review Next" button → Opens highest priority review
- Filter pending reviews
- Sort pending reviews
- Search assessments
- Scroll to "Pending Reviews" or "Recently Reviewed" sections
- Sidebar navigation:
  - Dashboard
  - Pending Reviews (with badge count)
  - Recently Reviewed
  - Logout

**API Calls**:
- Server-side: Fetches pending and reviewed assessments
- `GET /api/physician/assessments/[assessmentId]/detail` - Fetches assessment details for review

**Priority Calculation**:
- Based on: red flag count, time waiting, processing status
- High: >50 points, Medium: 20-50, Low: <20

---

### Screen 12: Physician Review Modal
**Component**: `components/physician/review-modal.tsx`
**User Action**:
- User reviews assessment:
  - **Assessment Overview**:
    - Child information (name, age, DOB)
    - Parent information (name, email)
    - Completion date
    - Review status badge
  - **Assessment Responses**:
    - All responses grouped by category
    - Shows question, response, notes
    - Red flags highlighted
  - **Storybook Preview**:
    - If AI processing: Shows progress bar (0-100%)
    - If completed: Shows storybook pages
    - Each page shows:
      - Image
      - Narrative text
      - Status (Milestone Met / Needs Support)
      - Category
      - For "Needs Support" pages: Helpful Resources with articles
  - **Review Actions**:
    - Approve (makes storybook visible to parent, triggers AI generation if not done)
    - Needs Revision (hides from parent, allows notes)
    - Rejected (hides from parent, allows notes)
    - Physician Notes (optional textarea)

**Form Fields**:
- Physician Notes (textarea, optional)
- Review action buttons (Approve, Needs Revision, Rejected)

**Interactions**:
- View storybook pages (if generated)
- Navigate storybook pages
- Click article links (opens in new tab)
- Select review action
- Enter physician notes
- Submit review
- "Retry AI Generation" button (if failed)
- "Regenerate PDF" button (if needed)

**API Calls**:
- `GET /api/physician/assessments/[assessmentId]/detail` - Fetches assessment details
- `POST /api/physician/assessment-results/[assessmentResultId]/review` - Submits review
  - Body: `{ action: 'approve' | 'needs_revision' | 'rejected', notes?: string }`
  - Updates: `status`, `parent_visible`, `physician_notes`, `reviewed_by`, `reviewed_at`
- `POST /api/physician/assessment-results/[assessmentResultId]/retry-ai` - Retries AI generation
- `POST /api/physician/assessment-results/[assessmentResultId]/regenerate-pdf` - Regenerates PDFs

**Review Actions**:
1. **Approve**:
   - Sets `status = 'approved'`
   - Sets `parent_visible = true`
   - If AI not generated, triggers AI processing
2. **Needs Revision**:
   - Sets `status = 'needs_revision'`
   - Sets `parent_visible = false`
3. **Rejected**:
   - Sets `status = 'rejected'`
   - Sets `parent_visible = false`

**Polling**:
- If `ai_processing_status === 'processing'`, polls every 1 second for progress updates
- Updates progress bar (0-100%)
- Auto-refreshes when status changes to 'completed'

---

## FLOW 4: AI Storybook Generation Flow

### Process: AI Storybook Generation
**Route**: `app/api/ai/process/route.ts`
**Trigger**: 
- Physician approves assessment (`status = 'approved'`)
- Or manual trigger via "Retry AI Generation"

**User Action** (Background Process):
1. **Milestone Verification** (5% progress)
   - Fetches assessment responses
   - Verifies milestones against CDC guidelines
   - Determines status (met/missed) for each milestone

2. **Selector Agent** (10-20% progress)
   - Optional: Reduces milestone set if too large
   - Selects most important milestones for storybook

3. **Storybook Agent** (20-35% progress)
   - Generates narrative text for each milestone
   - Creates illustration prompts
   - Uses CDC narratives (celebration/concern) as primary source

4. **Validation Agent** (35-45% progress)
   - Validates generated content
   - Ensures quality and accuracy

5. **Page Combination** (45-50% progress)
   - Combines pages into structured storybook
   - Orders: "Needs Support" pages first, then "Milestone Met"
   - Fetches article recommendations for "Needs Support" pages
   - Re-indexes pages sequentially

6. **Image Generation** (50-80% progress)
   - Generates images using DALL-E 3
   - Processes in parallel batches (10 images per batch)
   - Handles rate limits with retry queue
   - Uploads images to Supabase storage
   - Updates progress after each batch

7. **PDF Generation** (80-95% progress)
   - Generates parent PDF (82-88%)
   - Generates physician PDF (88-95%)
   - Uploads PDFs to Supabase storage
   - Updates `parent_pdf_url` and `physician_pdf_url`

8. **Finalization** (95-100% progress)
   - Updates `ai_report` (JSON) in database
   - Sets `ai_processing_status = 'completed'`
   - Sets `ai_processing_progress = 100`
   - Records costs and tokens

**API Calls**:
- `POST /api/ai/process` - Main processing endpoint
  - Body: `{ assessmentId: string, forceRegenerate?: boolean }`
  - Updates progress in database (polled by frontend)

**Progress Updates**:
- Frontend polls `ai_processing_progress` every 1 second
- Shows progress bar in physician review modal
- Updates assessment status in parent dashboard

**Article Recommendations**:
- For "Needs Support" pages only
- Priority: Database articles → AI articles → Static articles
- Validates URLs before returning
- Minimum 1 article, maximum 3 articles per page

---

## FLOW 5: PDF Generation & Download Flow

### Process: PDF Generation
**Route**: `lib/pdf/storybook-generator.tsx`
**Function**: `generateStorybookPDF(assessmentId, version, supabase)`

**User Action** (Background Process):
1. Fetches `ai_report` from database
2. Parses storybook pages
3. Downloads images from Supabase storage
4. Compresses images using Sharp
5. Generates PDF using `@react-pdf/renderer`:
   - Cover page with child info and progress summary
   - Content pages (one per milestone):
     - Header with logo and page number
     - Milestone image
     - Narrative text
     - Status badge
     - Category tag
     - For "Needs Support" pages: Helpful Resources section with articles
   - Footer with branding
6. Converts to Buffer
7. Uploads to Supabase storage (`storybook-pdfs` bucket)
8. Updates database with PDF URL

**PDF Versions**:
- **Parent PDF** (`version = 'parent'`):
  - Stored at: `parent_pdf_url`
  - Visible to parents
- **Physician PDF** (`version = 'physician'`):
  - Stored at: `physician_pdf_url`
  - May include additional clinical notes

**Download Flow**:
1. Parent clicks "Download PDF" in dashboard
2. Fetches `parent_pdf_url` from assessment
3. Opens PDF URL in new tab (Supabase public URL)
4. Browser downloads PDF

**Regeneration**:
- Physician can trigger PDF regeneration
- `POST /api/physician/assessment-results/[assessmentResultId]/regenerate-pdf`
- Deletes old PDFs from storage
- Regenerates both parent and physician PDFs
- Updates URLs in database

---

## API Endpoints Summary

### Assessment Endpoints
- `POST /api/assessment/submit`
  - Submits guest assessment and creates account
  - Creates child, assessment, responses, assessment_result, physician_referral

### Parent Endpoints
- `GET /api/parent/assessments/[assessmentId]/storybook`
  - Fetches latest storybook data for parent
  - Validates articles on retrieval
  - Returns: `ai_report`, `parent_pdf_url`, `updated_at`

### Physician Endpoints
- `GET /api/physician/assessments/[assessmentId]/detail`
  - Fetches assessment details for review
  - Returns: Full assessment data including responses, child info, parent info
- `POST /api/physician/assessment-results/[assessmentResultId]/review`
  - Submits review action (approve/needs_revision/rejected)
  - Updates status and visibility
- `POST /api/physician/assessment-results/[assessmentResultId]/retry-ai`
  - Retries AI generation if failed
- `POST /api/physician/assessment-results/[assessmentResultId]/regenerate-pdf`
  - Regenerates PDFs for assessment

### AI Processing Endpoints
- `POST /api/ai/process`
  - Processes assessment and generates storybook
  - Updates progress in database
  - Generates images and PDFs

### Auth Endpoints
- `POST /api/auth/logout`
  - Logs out user
  - Clears session

---

## Data Flow Summary

### Assessment Submission Flow
1. Guest completes assessment → Stored in Zustand store
2. Guest creates account → Supabase Auth
3. Assessment submitted → `POST /api/assessment/submit`
4. Creates child, assessment, responses, assessment_result
5. Status: `awaiting_review`
6. Creates physician_referral

### Review & Generation Flow
1. Physician views assessment → `GET /api/physician/assessments/[assessmentId]/detail`
2. Physician approves → `POST /api/physician/assessment-results/[assessmentResultId]/review`
3. Status: `approved`, `parent_visible = true`
4. AI processing triggered → `POST /api/ai/process`
5. Progress updates: 5% → 10% → 20% → 35% → 45% → 50% → 80% → 95% → 100%
6. Storybook generated → `ai_report` updated
7. PDFs generated → `parent_pdf_url`, `physician_pdf_url` updated
8. Status: `completed`
9. Parent can view storybook

### Storybook Viewing Flow
1. Parent opens dashboard → Sees assessments
2. Parent clicks "View Storybook" → `GET /api/parent/assessments/[assessmentId]/storybook`
3. Storybook viewer opens → Displays pages
4. Parent navigates pages → Views images, narratives, articles
5. Parent downloads PDF → Opens `parent_pdf_url`

---

## Form Interactions

### Assessment Form (`/assessment`)
- **Fields**: Child name, Date of birth, Focus area
- **Validation**: All required, date must be valid
- **Storage**: Zustand store (client-side)
- **Next**: `/assessment/questions`

### Questions Form (`/assessment/questions`)
- **Fields**: Response (radio), Notes (optional textarea)
- **Validation**: Response required to proceed
- **Storage**: Zustand store (client-side)
- **Navigation**: Previous/Next buttons
- **Next**: `/assessment/review`

### Review & Signup Form (`/assessment/review`)
- **Fields**: Full name, Email, Password, Confirm password
- **Validation**: All required, email format, password match
- **Storage**: Supabase Auth + Database
- **Action**: Creates account and submits assessment
- **Next**: `/dashboard/parent`

### Login Form (`/login`)
- **Fields**: Email, Password
- **Validation**: Both required
- **Action**: Signs in, submits pending assessment if exists
- **Next**: `/dashboard/parent` or `/dashboard/physician`

### Physician Login Form (`/dashboard/physician/login`)
- **Fields**: Full name (signup), Email, Password
- **Validation**: All required
- **Action**: Signs in/up as physician
- **Next**: `/dashboard/physician`

### Review Form (Physician Modal)
- **Fields**: Physician Notes (optional), Review Action (approve/needs_revision/rejected)
- **Validation**: Action required
- **Action**: Updates assessment status
- **Next**: Closes modal, refreshes dashboard

---

## PDF Generation Paths

### Parent PDF Generation
1. Triggered after AI storybook generation completes
2. Function: `generateStorybookPDF(assessmentId, 'parent', supabase)`
3. Generates PDF with:
   - Cover page
   - Milestone pages (images, narratives, status badges)
   - Helpful Resources for "Needs Support" pages
4. Uploads to Supabase storage
5. Updates `parent_pdf_url` in database

### Physician PDF Generation
1. Triggered after AI storybook generation completes
2. Function: `generateStorybookPDF(assessmentId, 'physician', supabase)`
3. Similar to parent PDF, may include additional clinical information
4. Uploads to Supabase storage
5. Updates `physician_pdf_url` in database

### PDF Download
1. User clicks "Download PDF" button
2. Fetches PDF URL from assessment data
3. Opens URL in new tab (Supabase public URL)
4. Browser handles download

### PDF Regeneration
1. Physician clicks "Regenerate PDF" in review modal
2. `POST /api/physician/assessment-results/[assessmentResultId]/regenerate-pdf`
3. Deletes old PDFs from storage
4. Regenerates both PDFs
5. Updates URLs in database

---

## Status Flow Diagram

```
Assessment Submitted
    ↓
Status: 'awaiting_review'
Parent Visible: false
    ↓
Physician Reviews
    ↓
[If Approved]
    ↓
Status: 'approved'
Parent Visible: true
AI Processing: 'processing'
    ↓
AI Generates Storybook
Progress: 5% → 100%
    ↓
AI Processing: 'completed'
Storybook Ready
PDFs Generated
    ↓
Parent Can View Storybook
Download PDF Available

[If Needs Revision]
    ↓
Status: 'needs_revision'
Parent Visible: false

[If Rejected]
    ↓
Status: 'rejected'
Parent Visible: false
```

---

## Key Interactions

### Navigation
- **Header**: Logo, Navigation links, Login dropdown, User menu
- **Sidebar** (Parent): Dashboard, My Children, New Assessment, All Storybooks, Logout
- **Sidebar** (Physician): Dashboard, Pending Reviews, Recently Reviewed, Logout
- **Breadcrumbs**: Context navigation (not currently used)

### Search & Filter
- **Parent Dashboard**: Search assessments, Filter by status, Sort options
- **All Storybooks**: Search storybooks, Filter by status, Sort options
- **Physician Dashboard**: Search assessments, Filter by priority/status, Sort options

### Modals & Dialogs
- **Storybook Viewer**: Full-screen modal with page navigation
- **Review Modal**: Large modal with assessment details and storybook preview
- **Mobile Menu**: Slide-out drawer for mobile navigation

### Real-time Updates
- **Progress Polling**: Physician dashboard polls every 1 second for AI processing progress
- **Status Polling**: Parent dashboard polls for assessment status changes
- **Cache Busting**: Image URLs include timestamp to prevent stale cache

---

## Error Handling

### Assessment Errors
- Missing data → Error message, prevent submission
- Invalid date → Validation error
- Network error → Retry option

### Login Errors
- Invalid credentials → Error message
- Account not found → Error message
- Role mismatch → Redirect to correct dashboard

### Review Errors
- Assessment not found → 404 error
- Unauthorized → 403 error
- Review submission failed → Error toast, retry option

### AI Processing Errors
- Generation failed → "Retry AI Generation" button
- Rate limit → Automatic retry with backoff
- Content policy violation → Fallback prompts

### PDF Errors
- Generation failed → "Regenerate PDF" button
- Download failed → Error message
- Missing PDF → Shows placeholder

---

## Storage & State Management

### Client-Side State
- **Zustand Store** (`lib/stores/guest-assessment-store.ts`):
  - Child name, DOB, focus area
  - Guest session ID
  - Assessment responses
  - Persists in localStorage

### Server-Side State
- **Supabase Database**:
  - Profiles, Children, Assessments
  - Assessment Responses
  - Assessment Results
  - Physician Referrals
  - Articles

### File Storage
- **Supabase Storage**:
  - `storybook-images` bucket: AI-generated images
  - `storybook-pdfs` bucket: Generated PDFs

---

## Authentication & Authorization

### Guest Users
- No authentication required
- Can take assessment
- Data stored in Zustand (client-side only)
- Must create account to submit

### Parent Users
- Authenticated via Supabase Auth
- Role: 'parent'
- Can view own children and assessments
- RLS policies enforce data access

### Physician Users
- Authenticated via Supabase Auth
- Role: 'physician'
- Can view all assessments
- Can review and approve/reject
- Admin client used for data access

---

## Article Recommendation Flow

### Article Retrieval
1. For "Needs Support" pages only
2. Priority order:
   - Database articles (from `articles` table)
   - AI-generated articles (via Perplexity/OpenAI)
   - Static fallback articles
3. Validates URLs before returning
4. Minimum 1 article, maximum 3 articles per page

### Article Display
- **Storybook Viewer**: Shows articles in "Helpful Resources" section
- **Review Modal**: Shows articles in storybook preview
- **PDF**: Includes articles in "Helpful Resources" section
- Articles include: Title, URL, Source (CDC/HealthyChildren/AAP/Other), Description

---

## Complete Flow List

### Flow A: New Guest Assessment
1. Landing Page → Click "Get Your Free Assessment"
2. Assessment Landing → Enter child info → Continue
3. Questions Page → Answer all questions → Complete
4. Review Page → Review → Create account → Submit
5. Dashboard → View assessment status

### Flow B: Returning Parent
1. Login Page → Enter credentials → Login
2. Dashboard Overview → View all children
3. Click Child → View child detail
4. Click Assessment → View storybook
5. Download PDF

### Flow C: Physician Review
1. Physician Login → Sign in
2. Dashboard → View pending reviews
3. Click Assessment → Review modal opens
4. Review assessment → Approve/Needs Revision/Reject
5. If approved → AI generates storybook (background)
6. Monitor progress → Storybook completes
7. Parent can now view storybook

### Flow D: Storybook Regeneration
1. Physician Dashboard → Click assessment
2. Review Modal → Click "Regenerate PDF" or "Retry AI"
3. Background processing → Progress updates
4. Storybook regenerated → New images/PDFs
5. Parent sees updated storybook

### Flow E: Multiple Children Management
1. Parent Dashboard → Overview mode
2. View all children → Click child name
3. Child detail view → View assessments
4. Start new assessment → `/assessment`
5. Complete assessment → Returns to dashboard
6. View all storybooks → `/dashboard/parent/storybooks`

---

## Screen Inventory

### Public Screens
1. Landing Page (`/`)
2. Assessment Landing (`/assessment`)
3. Assessment Questions (`/assessment/questions`)
4. Assessment Review (`/assessment/review`)
5. Parent Login (`/login`)
6. Physician Login (`/dashboard/physician/login`)

### Authenticated Screens
7. Parent Dashboard Overview (`/dashboard/parent`)
8. Parent Dashboard - Child Detail (`/dashboard/parent?child={id}`)
9. All Storybooks (`/dashboard/parent/storybooks`)
10. Physician Dashboard (`/dashboard/physician`)

### Modals/Components
11. Storybook Viewer Modal
12. Physician Review Modal
13. Mobile Navigation Drawer
14. User Menu Dropdown

---

## API Route Inventory

### Assessment APIs
- `POST /api/assessment/submit` - Submit assessment and create account

### Parent APIs
- `GET /api/parent/assessments/[assessmentId]/storybook` - Get storybook data

### Physician APIs
- `GET /api/physician/assessments/[assessmentId]/detail` - Get assessment details
- `POST /api/physician/assessment-results/[assessmentResultId]/review` - Submit review
- `POST /api/physician/assessment-results/[assessmentResultId]/retry-ai` - Retry AI generation
- `POST /api/physician/assessment-results/[assessmentResultId]/regenerate-pdf` - Regenerate PDFs

### AI APIs
- `POST /api/ai/process` - Process assessment and generate storybook

### Auth APIs
- `POST /api/auth/logout` - Logout user

---

## Form Inventory

1. **Child Information Form** (`/assessment`)
2. **Assessment Questions Form** (`/assessment/questions`)
3. **Review & Signup Form** (`/assessment/review`)
4. **Parent Login Form** (`/login`)
5. **Physician Login/Signup Form** (`/dashboard/physician/login`)
6. **Review Form** (Physician Modal)

---

## Interaction Inventory

### Buttons
- CTA buttons (Get Your Free Assessment, Start New Assessment)
- Navigation buttons (Previous, Next, Back)
- Action buttons (View Storybook, Download PDF, Approve, Reject)
- Filter/Sort buttons
- Toggle buttons (Grid/List view, Favorite)

### Inputs
- Text inputs (Name, Email, Search)
- Date picker (Date of birth)
- Select dropdowns (Focus area, Filters, Sort)
- Radio buttons (Assessment responses)
- Textareas (Notes, Physician notes)
- Checkboxes (Remember me)

### Navigation
- Header links
- Sidebar navigation
- Breadcrumbs (not currently used)
- Mobile menu drawer
- Keyboard navigation (Arrow keys in storybook viewer)

### Modals
- Storybook Viewer (full-screen)
- Review Modal (large)
- Mobile Menu (drawer)

---

## Data Models

### Assessment
- `id`, `child_id`, `parent_id`, `age_at_assessment_months`
- `status`: 'in_progress' | 'completed' | 'abandoned' | 'in_review' | 'reviewed'
- `completed_at`, `created_at`

### Assessment Result
- `id`, `assessment_id`
- `status`: 'pending' | 'generating' | 'awaiting_review' | 'approved' | 'needs_revision' | 'rejected'
- `ai_report` (JSON), `parent_pdf_url`, `physician_pdf_url`
- `ai_processing_status`, `ai_processing_progress`
- `parent_visible`, `physician_notes`, `reviewed_by`, `reviewed_at`

### Assessment Response
- `id`, `assessment_id`, `milestone_id`
- `response`: 'yes' | 'no' | 'sometimes' | 'not_sure'
- `notes` (optional)

### Child
- `id`, `parent_id`, `child_name`, `date_of_birth`, `gender`

### Profile
- `id`, `email`, `full_name`, `role`: 'parent' | 'physician' | 'admin'

### Physician Referral
- `id`, `assessment_result_id`, `parent_id`, `physician_id`
- `status`, `review_status`

---

## Complete User Journey Examples

### Journey 1: First-Time Parent
1. Visits landing page
2. Clicks "Get Your Free Assessment"
3. Enters child info (Emma, 18 months, Typically Developing)
4. Answers 25 milestone questions
5. Reviews responses
6. Creates account (email, password)
7. Assessment submitted
8. Redirected to dashboard
9. Sees "Awaiting Review" status
10. Waits for physician review (24-48 hours)
11. Receives notification (future feature)
12. Sees "Generating" status with progress bar
13. Storybook completes
14. Sees "Approved" status
15. Views storybook (15 pages)
16. Downloads PDF
17. Shares with family

### Journey 2: Physician Review
1. Logs into physician dashboard
2. Sees 12 pending reviews
3. Sorts by priority (highest first)
4. Clicks highest priority assessment
5. Reviews child info (Emma, 18 months)
6. Reviews responses (3 red flags in Motor category)
7. Sees storybook is generating (45% progress)
8. Waits for completion (polls every 1 second)
9. Reviews generated storybook (15 pages)
10. Checks articles for "Needs Support" pages
11. Adds physician notes
12. Approves assessment
13. Storybook now visible to parent
14. Moves to next review

### Journey 3: Returning Parent with Multiple Children
1. Logs into dashboard
2. Sees overview with 3 children
3. Clicks "Emma" → Views Emma's assessments
4. Sees 2 approved assessments
5. Views latest storybook
6. Downloads PDF
7. Returns to overview
8. Clicks "Lucas" → Views Lucas's assessments
9. Starts new assessment for Lucas
10. Completes assessment
11. Returns to dashboard
12. Views "All Storybooks" page
13. Sees all storybooks across all children
14. Filters by "Approved"
15. Downloads multiple PDFs

---

## Edge Cases & Error Flows

### Edge Case 1: Guest Assessment Abandoned
- User starts assessment but closes browser
- Data remains in Zustand store (localStorage)
- User can return and continue
- If user creates account, pending assessment is submitted

### Edge Case 2: AI Generation Failure
- AI processing fails
- Status shows "Failed"
- Physician sees "Retry AI Generation" button
- Can retry without re-approving

### Edge Case 3: PDF Generation Failure
- PDF generation fails
- Storybook still viewable online
- Physician can regenerate PDF
- Parent sees "Download PDF" disabled until PDF ready

### Edge Case 4: Article URL Invalid
- Article URL returns 404
- Article validation filters it out
- Falls back to next article in priority
- Ensures at least 1 article per "Needs Support" page

### Edge Case 5: Multiple Assessments for Same Child
- Parent can create multiple assessments
- Each assessment is independent
- Dashboard shows all assessments
- Can compare progress over time

---

## Future Flow Considerations

### Not Yet Implemented
- Email notifications
- Assessment reminders
- Progress tracking over time
- Comparison charts
- Export data functionality
- Print storybook
- Share storybook link
- Assessment history timeline
- Milestone calendar view

---

## Summary

This application supports three main user types (Guest, Parent, Physician) with distinct flows:

1. **Guest Flow**: Assessment → Review → Signup → Dashboard
2. **Parent Flow**: Login → Dashboard → View Storybooks → Download PDFs
3. **Physician Flow**: Login → Review → Approve → Monitor Generation

All flows converge on the storybook generation process, which creates personalized developmental storybooks with AI-generated images, narratives, and article recommendations.

