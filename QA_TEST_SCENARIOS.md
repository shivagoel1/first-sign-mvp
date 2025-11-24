# QA Test Scenarios - Complete Test Coverage

## Overview
This document contains comprehensive QA test scenarios for all user flows in the FirstSignFirst application, covering happy paths, edge cases, error handling, and failure states.

---

## FLOW 1: Guest Assessment Flow (No Account Required)

### Test Suite 1.1: Landing Page (`/`)

#### TC-1.1.1: Happy Path - Landing Page Load
**Given**: User visits the homepage  
**When**: Page loads  
**Then**:
- Hero section displays with "Track Your Child's Growth Journey" headline
- "Get Your Free Assessment" button is visible and clickable
- All navigation links are visible (Features, How It Works, Why Us, FAQ)
- Header displays correctly with logo and navigation
- Footer displays correctly
- No console errors
- Page load time < 3 seconds

#### TC-1.1.2: Navigation Links Functionality
**Given**: User is on landing page  
**When**: User clicks navigation links  
**Then**:
- "Features" link scrolls to features section smoothly
- "How It Works" link scrolls to how-it-works section smoothly
- "Why Us" link scrolls to why-us section smoothly
- "FAQ" link scrolls to FAQ section smoothly
- Scroll offset accounts for fixed header (no content hidden behind header)
- Active section is highlighted (if implemented)

#### TC-1.1.3: CTA Button Click
**Given**: User is on landing page  
**When**: User clicks "Get Your Free Assessment" button  
**Then**:
- User is redirected to `/assessment`
- No errors occur
- Page transition is smooth
- URL changes correctly

#### TC-1.1.4: Mobile Responsiveness
**Given**: User is on landing page on mobile device  
**When**: Page loads  
**Then**:
- Mobile menu (hamburger) is visible
- Desktop navigation is hidden
- All sections stack vertically
- Text is readable (no overflow)
- Buttons are appropriately sized for touch
- Images scale correctly
- No horizontal scrolling

#### TC-1.1.5: Header Login Dropdown
**Given**: User is on landing page  
**When**: User clicks "Login" dropdown  
**Then**:
- Dropdown menu opens
- "Parent Login" option is visible
- "Physician Login" option is visible
- Clicking "Parent Login" redirects to `/login`
- Clicking "Physician Login" redirects to `/dashboard/physician/login`
- Dropdown closes after selection

#### TC-1.1.6: Edge Case - Slow Network
**Given**: User has slow network connection  
**When**: Landing page loads  
**Then**:
- Loading states are shown for images
- Page remains functional even if some images fail to load
- No broken image icons
- Fallback images display if primary images fail

#### TC-1.1.7: Edge Case - Browser Back Button
**Given**: User navigates from landing page to assessment  
**When**: User clicks browser back button  
**Then**:
- User returns to landing page
- Page state is preserved
- No errors occur

---

### Test Suite 1.2: Assessment Landing Page (`/assessment`)

#### TC-1.2.1: Happy Path - Complete Assessment Form
**Given**: User is on assessment landing page  
**When**: User fills form correctly:
- Child name: "Emma"
- Date of birth: "2023-01-15" (18 months old)
- Focus area: "Typically Developing"
**And**: User clicks "Continue to Assessment"  
**Then**:
- Form validates successfully
- User is redirected to `/assessment/questions`
- Data is stored in Zustand store
- No errors occur

#### TC-1.2.2: Form Validation - Empty Fields
**Given**: User is on assessment landing page  
**When**: User clicks "Continue to Assessment" without filling fields  
**Then**:
- Error message appears: "Please enter your child's name."
- Error message appears: "Please provide a date of birth."
- Error message appears: "Please select a focus area."
- User remains on same page
- Form does not submit

#### TC-1.2.3: Form Validation - Invalid Date
**Given**: User is on assessment landing page  
**When**: User enters invalid date (e.g., "2025-12-31" - future date)  
**And**: User clicks "Continue to Assessment"  
**Then**:
- Error message appears: "Please enter a valid date."
- User remains on same page
- Form does not submit

#### TC-1.2.4: Form Validation - Date Too Old
**Given**: User is on assessment landing page  
**When**: User enters date of birth > 5 years ago  
**And**: User clicks "Continue to Assessment"  
**Then**:
- Age calculation shows > 60 months
- Warning message may appear (if implemented)
- Form may still submit (check business rules)
- Appropriate milestones are loaded for age

#### TC-1.2.5: Form Validation - Special Characters in Name
**Given**: User is on assessment landing page  
**When**: User enters child name with special characters: "Emma-Jane O'Brien"  
**And**: User clicks "Continue to Assessment"  
**Then**:
- Form accepts the name
- Special characters are preserved
- No errors occur
- Name displays correctly in subsequent pages

#### TC-1.2.6: Edge Case - Very Long Name
**Given**: User is on assessment landing page  
**When**: User enters very long name (100+ characters)  
**And**: User clicks "Continue to Assessment"  
**Then**:
- Form accepts the name (or shows max length error if limit exists)
- Name displays correctly (may truncate in UI)
- No database errors occur
- Name is stored correctly

#### TC-1.2.7: Edge Case - Browser Refresh
**Given**: User fills assessment form but doesn't submit  
**When**: User refreshes browser  
**Then**:
- Form data is lost (Zustand store may persist in localStorage)
- User returns to empty form
- No errors occur

#### TC-1.2.8: Edge Case - Age Calculation
**Given**: User is on assessment landing page  
**When**: User enters date of birth: "2023-06-15" (today is 2024-12-15)  
**Then**:
- Age is calculated as 18 months
- Age displays correctly
- Appropriate milestones are loaded for 18 months

#### TC-1.2.9: UI Bug Check - Form Alignment
**Given**: User is on assessment landing page  
**When**: Page loads  
**Then**:
- Form fields are aligned correctly
- Labels are properly positioned
- Error messages appear below fields
- Focus area dropdown is styled correctly
- Button is properly positioned
- No overlapping elements
- Responsive on all screen sizes

#### TC-1.2.10: Response Latency - Slow API
**Given**: User is on assessment landing page  
**When**: User submits form with slow network  
**Then**:
- Loading indicator appears on button
- Button is disabled during submission
- User cannot double-submit
- After timeout, error message appears (if timeout implemented)
- Form can be resubmitted

---

### Test Suite 1.3: Assessment Questions Page (`/assessment/questions`)

#### TC-1.3.1: Happy Path - Complete All Questions
**Given**: User is on questions page with 25 questions  
**When**: User answers all questions:
- Selects response for each question
- Optionally adds notes
- Clicks "Next" for each question
- Clicks "Complete Assessment" on last question  
**Then**:
- All responses are saved to Zustand store
- Progress bar updates correctly (0% → 100%)
- User is redirected to `/assessment/review`
- All data is preserved

#### TC-1.3.2: Form Validation - No Response Selected
**Given**: User is on questions page  
**When**: User tries to click "Next" without selecting a response  
**Then**:
- "Next" button is disabled
- User cannot proceed
- Visual indicator shows field is required (if implemented)

#### TC-1.3.3: Navigation - Previous Button
**Given**: User is on question 5 of 25  
**When**: User clicks "Previous" button  
**Then**:
- User returns to question 4
- Previous response is pre-selected
- Notes are preserved (if entered)
- Progress bar updates correctly

#### TC-1.3.4: Navigation - First Question
**Given**: User is on first question  
**When**: User views the page  
**Then**:
- "Previous" button is disabled
- Only "Next" button is enabled
- Progress shows "1 of 25"

#### TC-1.3.5: Navigation - Last Question
**Given**: User is on last question (25 of 25)  
**When**: User views the page  
**Then**:
- "Next" button text changes to "Complete Assessment"
- "Previous" button is enabled
- Progress shows "25 of 25" or "100%"

#### TC-1.3.6: Progress Bar Accuracy
**Given**: User is on questions page with 25 questions  
**When**: User is on question 10  
**Then**:
- Progress bar shows 40% (10/25)
- Progress text shows "10 of 25"
- Progress updates correctly for each question

#### TC-1.3.7: Category Badge Display
**Given**: User is on questions page  
**When**: Question displays  
**Then**:
- Category badge shows correct category (Social-Emotional, Language/Communication, Motor, Cognitive)
- Badge has correct color:
  - Social-Emotional: Primary color
  - Language/Communication: Secondary-accent color
  - Cognitive: Success color
  - Motor: Warning color

#### TC-1.3.8: Notes Field Functionality
**Given**: User is on questions page  
**When**: User enters notes in textarea  
**Then**:
- Notes are saved to Zustand store
- Notes persist when navigating back/forward
- Notes are included in review page
- Notes are submitted with assessment

#### TC-1.3.9: Edge Case - Very Long Notes
**Given**: User is on questions page  
**When**: User enters very long notes (1000+ characters)  
**Then**:
- Notes are accepted (or max length error if limit exists)
- Notes are stored correctly
- Notes display correctly in review page
- No database errors occur

#### TC-1.3.10: Edge Case - Browser Back Button
**Given**: User is on question 10  
**When**: User clicks browser back button  
**Then**:
- User returns to `/assessment` page
- Responses 1-9 are preserved in Zustand store
- User can return to questions and continue from question 10

#### TC-1.3.11: Edge Case - Page Refresh
**Given**: User is on question 10 with responses saved  
**When**: User refreshes browser  
**Then**:
- Responses are preserved (Zustand localStorage)
- User returns to question 10 (or first question - check behavior)
- All previous responses are loaded
- User can continue assessment

#### TC-1.3.12: Edge Case - Network Disconnection
**Given**: User is answering questions  
**When**: Network disconnects  
**Then**:
- Responses continue to save locally (Zustand)
- User can continue answering
- When network reconnects, data is preserved
- Assessment can be completed offline (until submission)

#### TC-1.3.13: Response Latency - Slow Milestone Loading
**Given**: User navigates to questions page  
**When**: Milestones API is slow (> 5 seconds)  
**Then**:
- Loading indicator appears
- User sees "Loading questions..." message
- Page remains responsive
- Questions load when API responds
- No errors occur

#### TC-1.3.14: UI Bug Check - Question Display
**Given**: User is on questions page  
**When**: Question displays  
**Then**:
- Question text is fully visible
- No text overflow or truncation
- Response options are clearly visible
- Radio buttons are properly aligned
- Notes textarea is properly sized
- Category badge doesn't overlap text
- Progress bar is visible and accurate

#### TC-1.3.15: Age-Appropriate Questions
**Given**: User has child age 18 months  
**When**: Questions page loads  
**Then**:
- Only milestones for 18 months (or age range including 18 months) are shown
- No milestones for other ages are shown
- Total question count matches expected for age
- Questions are relevant to child's age

#### TC-1.3.16: Focus Area Filtering
**Given**: User selected "Autism Spectrum" as focus area  
**When**: Questions page loads  
**Then**:
- Questions may be filtered by focus area (if implemented)
- Or all age-appropriate questions are shown
- Focus area is preserved in store

#### TC-1.3.17: Response Options Display
**Given**: User is on questions page  
**When**: Question displays with custom options from database  
**Then**:
- Custom options are displayed (if question has `options` field)
- Options are parsed correctly from JSON
- Default options are used if no custom options
- Options are clickable and selectable

#### TC-1.3.18: Failure State - API Error Loading Questions
**Given**: User is on questions page  
**When**: Milestones API returns error (500, 404, etc.)  
**Then**:
- Error message is displayed: "Unable to load questions. Please try again."
- Retry button is shown (if implemented)
- User can navigate back to assessment page
- No crash occurs

---

### Test Suite 1.4: Assessment Review Page (`/assessment/review`)

#### TC-1.4.1: Happy Path - Review and Signup
**Given**: User has completed all questions  
**When**: User reviews:
- Child information is correct
- All responses are displayed correctly
- User fills signup form:
  - Full name: "Jane Smith"
  - Email: "jane@example.com"
  - Password: "SecurePass123"
  - Confirm password: "SecurePass123"
**And**: User clicks "Create Account & Submit Assessment"  
**Then**:
- Form validates successfully
- Account is created via Supabase Auth
- Assessment is submitted via API
- User is redirected to `/dashboard/parent`
- No errors occur

#### TC-1.4.2: Form Validation - Empty Signup Fields
**Given**: User is on review page  
**When**: User clicks "Create Account & Submit Assessment" without filling fields  
**Then**:
- Error messages appear for empty fields
- Form does not submit
- User remains on review page

#### TC-1.4.3: Form Validation - Invalid Email
**Given**: User is on review page  
**When**: User enters invalid email: "notanemail"  
**And**: User clicks "Create Account & Submit Assessment"  
**Then**:
- Error message appears: "Please enter a valid email address."
- Form does not submit
- User remains on review page

#### TC-1.4.4: Form Validation - Password Mismatch
**Given**: User is on review page  
**When**: User enters:
- Password: "SecurePass123"
- Confirm password: "DifferentPass456"
**And**: User clicks "Create Account & Submit Assessment"  
**Then**:
- Error message appears: "Passwords do not match."
- Form does not submit
- User remains on review page

#### TC-1.4.5: Form Validation - Weak Password
**Given**: User is on review page  
**When**: User enters weak password: "123"  
**And**: User clicks "Create Account & Submit Assessment"  
**Then**:
- Error message appears (if min length enforced): "Password must be at least X characters."
- Form does not submit
- User remains on review page

#### TC-1.4.6: Review Data Accuracy
**Given**: User is on review page  
**When**: User reviews displayed information  
**Then**:
- Child name matches entered value
- Date of birth matches entered value
- Age calculation is correct
- Focus area matches selection
- All responses are displayed correctly
- Responses are grouped by category
- Notes are displayed (if entered)

#### TC-1.4.7: Edit Child Info
**Given**: User is on review page  
**When**: User clicks "Edit Child Info" button  
**Then**:
- User is redirected to `/assessment`
- Form is pre-filled with existing data
- User can modify and resubmit

#### TC-1.4.8: Edit Responses
**Given**: User is on review page  
**When**: User clicks "Edit Responses" button  
**Then**:
- User is redirected to `/assessment/questions`
- All responses are preserved
- User can navigate to any question and modify
- Progress reflects current position

#### TC-1.4.9: Edge Case - Duplicate Email
**Given**: User is on review page  
**When**: User enters email that already exists: "existing@example.com"  
**And**: User clicks "Create Account & Submit Assessment"  
**Then**:
- Error message appears: "Email already registered. Please sign in instead."
- Link to login page is provided (if implemented)
- Form does not submit
- User can navigate to login page

#### TC-1.4.10: Edge Case - Network Error During Submission
**Given**: User is on review page with form filled  
**When**: Network disconnects  
**And**: User clicks "Create Account & Submit Assessment"  
**Then**:
- Error message appears: "Unable to submit assessment. Please check your connection and try again."
- Form data is preserved
- User can retry submission
- No data loss occurs

#### TC-1.4.11: Edge Case - Partial Submission Failure
**Given**: User submits assessment  
**When**: Account creation succeeds but assessment submission fails  
**Then**:
- User account is created
- Error message appears: "Account created but assessment submission failed. Please try again."
- User can retry assessment submission
- User is logged in
- User can access dashboard

#### TC-1.4.12: Response Latency - Slow Submission
**Given**: User is on review page  
**When**: User submits with slow network (> 10 seconds)  
**Then**:
- Loading indicator appears on button
- Button shows "Creating Account..." or similar
- Button is disabled during submission
- User cannot double-submit
- After successful submission, redirect occurs

#### TC-1.4.13: UI Bug Check - Review Page Layout
**Given**: User is on review page  
**When**: Page loads  
**Then**:
- Child information section is clearly visible
- Responses are grouped by category
- Each category section is distinct
- Edit buttons are properly positioned
- Signup form is clearly visible
- No overlapping elements
- Responsive on all screen sizes

#### TC-1.4.14: Failure State - API Timeout
**Given**: User is on review page  
**When**: API request times out (> 30 seconds)  
**Then**:
- Error message appears: "Request timed out. Please try again."
- User can retry submission
- Form data is preserved
- No crash occurs

#### TC-1.4.15: Failure State - Server Error (500)
**Given**: User is on review page  
**When**: Server returns 500 error  
**Then**:
- Error message appears: "Server error. Please try again later."
- User can retry submission
- Form data is preserved
- No crash occurs

---

## FLOW 2: Parent Login & Dashboard Flow

### Test Suite 2.1: Parent Login (`/login`)

#### TC-2.1.1: Happy Path - Successful Login
**Given**: User has existing account  
**When**: User enters:
- Email: "parent@example.com"
- Password: "correctpassword"
**And**: User clicks "Login to Dashboard"  
**Then**:
- User is authenticated via Supabase
- User is redirected to `/dashboard/parent`
- No errors occur
- Session is established

#### TC-2.1.2: Form Validation - Empty Fields
**Given**: User is on login page  
**When**: User clicks "Login to Dashboard" without entering credentials  
**Then**:
- Error messages appear for empty fields
- Form does not submit
- User remains on login page

#### TC-2.1.3: Form Validation - Invalid Credentials
**Given**: User is on login page  
**When**: User enters incorrect email or password  
**And**: User clicks "Login to Dashboard"  
**Then**:
- Error message appears: "Invalid email or password."
- Form does not submit
- User remains on login page
- Password field is cleared (security)

#### TC-2.1.4: Remember Me Functionality
**Given**: User is on login page  
**When**: User checks "Remember me" checkbox  
**And**: User logs in successfully  
**Then**:
- Session persists across browser sessions (if implemented)
- User remains logged in after closing browser
- Cookie/session settings are correct

#### TC-2.1.5: Edge Case - Pending Guest Assessment
**Given**: User has pending guest assessment in Zustand store  
**When**: User logs in successfully  
**Then**:
- Pending assessment is automatically submitted
- Assessment is associated with user account
- User sees assessment in dashboard
- No data loss occurs

#### TC-2.1.6: Edge Case - Physician Logging into Parent Login
**Given**: Physician user with role 'physician'  
**When**: Physician logs in via `/login`  
**Then**:
- Login succeeds
- User is redirected to `/dashboard/physician` (not parent dashboard)
- Role is correctly identified

#### TC-2.1.7: Edge Case - Already Logged In
**Given**: User is already logged in  
**When**: User visits `/login`  
**Then**:
- User is automatically redirected to appropriate dashboard
- Login page is not displayed
- No errors occur

#### TC-2.1.8: Response Latency - Slow Authentication
**Given**: User is on login page  
**When**: Authentication API is slow (> 5 seconds)  
**Then**:
- Loading indicator appears on button
- Button shows "Logging in..."
- Button is disabled during authentication
- User cannot double-submit
- After response, redirect occurs or error is shown

#### TC-2.1.9: Failure State - Network Error
**Given**: User is on login page  
**When**: Network disconnects during login  
**Then**:
- Error message appears: "Unable to connect. Please check your connection."
- User can retry login
- Form data is preserved (email only, password cleared)

#### TC-2.1.10: Failure State - Account Locked (if implemented)
**Given**: User has exceeded login attempts  
**When**: User tries to log in  
**Then**:
- Error message appears: "Account temporarily locked. Please try again later."
- Login is blocked
- Timeout period is enforced

---

### Test Suite 2.2: Parent Dashboard Overview (`/dashboard/parent`)

#### TC-2.2.1: Happy Path - Dashboard Load
**Given**: User is logged in as parent  
**When**: User navigates to `/dashboard/parent`  
**Then**:
- Dashboard loads successfully
- Welcome section displays with user's name
- Progress Overview shows correct stats
- Children list displays (if children exist)
- No errors occur
- Page load time < 3 seconds

#### TC-2.2.2: Progress Overview - Correct Stats
**Given**: User has 3 children with multiple assessments  
**When**: Dashboard loads  
**Then**:
- Approved count is correct
- Pending count is correct
- Generating count is correct
- Report completion percentage is accurate
- Stats update correctly when assessments change

#### TC-2.2.3: Empty State - No Children
**Given**: User has no children  
**When**: Dashboard loads  
**Then**:
- Empty state message displays: "Start tracking your child's developmental milestones today."
- "Start New Assessment" button is visible
- Welcome section is shown
- No errors occur

#### TC-2.2.4: Empty State - No Assessments
**Given**: User has children but no assessments  
**When**: Dashboard loads  
**Then**:
- Children are displayed
- Empty state for assessments is shown
- "Start New Assessment" button is visible
- No errors occur

#### TC-2.2.5: Child Selection - Click Child Name
**Given**: User has multiple children  
**When**: User clicks child name in "Your Children" section  
**Then**:
- URL updates to `/dashboard/parent?child={childId}`
- Child detail view is displayed
- Welcome section is hidden
- Child-specific assessments are shown
- Sidebar highlights selected child

#### TC-2.2.6: Child Selection - Click View Button
**Given**: User has multiple children  
**When**: User clicks "View" button on child card  
**Then**:
- Same behavior as clicking child name
- URL updates correctly
- Child detail view displays

#### TC-2.2.7: New Assessment - From Overview
**Given**: User is on dashboard overview  
**When**: User clicks "Start New Assessment"  
**Then**:
- User is redirected to `/assessment`
- Assessment form loads
- No errors occur

#### TC-2.2.8: Sidebar Navigation
**Given**: User is on dashboard  
**When**: User interacts with sidebar  
**Then**:
- "Dashboard" link navigates to overview (clears child selection)
- "My Children" expands to show children list
- "New Assessment" link navigates to `/assessment`
- "All Storybooks" link navigates to `/dashboard/parent/storybooks`
- Sidebar collapses/expands correctly (desktop)
- Mobile menu works correctly

#### TC-2.2.9: Recent Activity Feed
**Given**: User has multiple assessments across children  
**When**: Dashboard loads  
**Then**:
- Last 5 assessments are displayed
- Assessments are sorted by completion date (newest first)
- Each activity shows child name, assessment date, status
- Clicking activity navigates to child detail view
- Activity feed updates when new assessments are created

#### TC-2.2.10: Alerts & Notifications
**Given**: User has pending and generating assessments  
**When**: Dashboard loads  
**Then**:
- Pending reviews count is displayed
- Generating storybooks count is displayed
- Alerts are clickable (if implemented)
- Alert counts are accurate

#### TC-2.2.11: Edge Case - Very Long Child Names
**Given**: User has child with very long name (50+ characters)  
**When**: Dashboard loads  
**Then**:
- Child name displays correctly (may truncate with ellipsis)
- No layout breaking
- Full name is visible on hover (if tooltip implemented)
- No overflow issues

#### TC-2.2.12: Edge Case - Many Children (10+)
**Given**: User has 15 children  
**When**: Dashboard loads  
**Then**:
- All children are displayed
- Grid/list view works correctly
- Pagination or scroll works (if implemented)
- Performance is acceptable (< 2 seconds load)

#### TC-2.2.13: Edge Case - Many Assessments (50+)
**Given**: User has child with 50+ assessments  
**When**: Dashboard loads  
**Then**:
- Assessments are displayed correctly
- Pagination or infinite scroll works (if implemented)
- Filters and search work correctly
- Performance is acceptable

#### TC-2.2.14: Response Latency - Slow Data Loading
**Given**: User is on dashboard  
**When**: Data API is slow (> 5 seconds)  
**Then**:
- Loading skeleton or spinner is shown
- Page remains responsive
- Data loads when API responds
- No errors occur

#### TC-2.2.15: UI Bug Check - Layout Alignment
**Given**: User is on dashboard  
**When**: Page loads  
**Then**:
- Header is fixed at top
- Sidebar is fixed on left (desktop)
- Main content area has correct margins
- No overlapping elements
- Responsive on all screen sizes
- Mobile sidebar works correctly

#### TC-2.2.16: Failure State - API Error
**Given**: User is on dashboard  
**When**: API returns error (500, 404, etc.)  
**Then**:
- Error message is displayed: "Unable to load dashboard. Please try again."
- Retry button is shown (if implemented)
- User can refresh page
- No crash occurs

#### TC-2.2.17: Failure State - Unauthorized Access
**Given**: User's session expires  
**When**: User tries to access dashboard  
**Then**:
- User is redirected to `/login`
- Error message may appear: "Session expired. Please log in again."
- No dashboard data is displayed

---

### Test Suite 2.3: Parent Dashboard - Child Detail View (`/dashboard/parent?child={childId}`)

#### TC-2.3.1: Happy Path - Child Detail View
**Given**: User has child with assessments  
**When**: User navigates to child detail view  
**Then**:
- Child's name is displayed in header
- Progress Overview shows child-specific stats
- Assessments list displays all assessments for this child
- Each assessment shows correct information
- No errors occur

#### TC-2.3.2: Assessment Status Display
**Given**: User has assessments with different statuses  
**When**: Child detail view loads  
**Then**:
- "Awaiting Review" assessments show correct badge
- "Generating" assessments show progress indicator
- "Approved" assessments show correct badge
- Status badges have correct colors
- Status messages are accurate

#### TC-2.3.3: View Storybook - Approved Assessment
**Given**: User has approved assessment with storybook  
**When**: User clicks "View Storybook" button  
**Then**:
- Storybook viewer modal opens
- Storybook pages load correctly
- Images display correctly
- Navigation works (Previous/Next)
- Articles are displayed for "Needs Support" pages
- No errors occur

#### TC-2.3.4: View Storybook - Generating Assessment
**Given**: User has assessment with status "generating"  
**When**: User views assessment card  
**Then**:
- "View Storybook" button is disabled or shows "Generating..."
- Progress indicator is shown
- User cannot open storybook until complete

#### TC-2.3.5: Download PDF - Available
**Given**: User has approved assessment with PDF  
**When**: User clicks "Download PDF" button  
**Then**:
- PDF download starts
- PDF opens in new tab or downloads
- PDF content is correct
- PDF includes all pages
- PDF includes articles (if applicable)
- No errors occur

#### TC-2.3.6: Download PDF - Not Available
**Given**: User has assessment without PDF  
**When**: User views assessment card  
**Then**:
- "Download PDF" button is disabled or hidden
- Or button shows "PDF Generating..." if in progress

#### TC-2.3.7: Filters - By Status
**Given**: User has assessments with different statuses  
**When**: User selects filter: "Approved"  
**Then**:
- Only approved assessments are displayed
- Filter state is preserved
- Count updates correctly

#### TC-2.3.8: Search - By Assessment
**Given**: User has multiple assessments  
**When**: User searches for assessment date or identifier  
**Then**:
- Matching assessments are displayed
- Search is case-insensitive
- Search works in real-time (if implemented)
- Clear search button works

#### TC-2.3.9: Sort - By Date
**Given**: User has multiple assessments  
**When**: User selects sort: "Newest"  
**Then**:
- Assessments are sorted by completion date (newest first)
- Sort state is preserved
- UI updates correctly

#### TC-2.3.10: Sort - By Progress
**Given**: User has multiple assessments  
**When**: User selects sort: "Progress"  
**Then**:
- Assessments are sorted by progress percentage
- Highest progress first
- Sort state is preserved

#### TC-2.3.11: View Modes - Grid/List/Compact
**Given**: User is on child detail view  
**When**: User toggles view mode  
**Then**:
- Grid view displays assessments in grid
- List view displays assessments in list
- Compact view shows condensed cards
- View preference is preserved (if implemented)

#### TC-2.3.12: Favorite Toggle
**Given**: User is on child detail view  
**When**: User clicks favorite/star icon  
**Then**:
- Assessment is marked as favorite
- Icon changes to filled star
- Favorite persists across sessions
- Favorites filter works (if implemented)

#### TC-2.3.13: Share Assessment
**Given**: User has approved assessment  
**When**: User clicks "Share" button  
**Then**:
- Native share dialog opens (if supported)
- Or clipboard copy is used
- Share link/URL is generated (if implemented)
- Success message appears

#### TC-2.3.14: Edge Case - URL Parameter Manipulation
**Given**: User is on dashboard  
**When**: User manually changes URL to `/dashboard/parent?child=invalid-id`  
**Then**:
- Error handling occurs
- User sees "Child not found" message (if implemented)
- Or user is redirected to overview
- No crash occurs

#### TC-2.3.15: Edge Case - Child Deleted
**Given**: User has child that was deleted  
**When**: User tries to access child detail view  
**Then**:
- Error handling occurs
- User sees appropriate message
- User is redirected to overview
- No crash occurs

#### TC-2.3.16: Response Latency - Slow Storybook Loading
**Given**: User clicks "View Storybook"  
**When**: Storybook API is slow (> 5 seconds)  
**Then**:
- Loading indicator appears in modal
- Modal remains responsive
- Storybook loads when API responds
- No errors occur

#### TC-2.3.17: UI Bug Check - Assessment Cards
**Given**: User is on child detail view  
**When**: Assessments display  
**Then**:
- Cards are properly aligned
- Images display correctly (no broken images)
- Text is readable
- Buttons are clickable
- Status badges are visible
- No overlapping elements
- Responsive on all screen sizes

#### TC-2.3.18: Failure State - Storybook API Error
**Given**: User clicks "View Storybook"  
**When**: Storybook API returns error  
**Then**:
- Error message appears in modal: "Unable to load storybook. Please try again."
- Modal can be closed
- User can retry
- No crash occurs

---

### Test Suite 2.4: Storybook Viewer Modal

#### TC-2.4.1: Happy Path - View Storybook
**Given**: User opens storybook viewer  
**When**: Storybook loads  
**Then**:
- All pages are loaded
- First page is displayed
- Images load correctly
- Narrative text is displayed
- Status badges are correct
- Page counter shows "Page 1 of 15"
- No errors occur

#### TC-2.4.2: Navigation - Next Button
**Given**: User is on page 1 of 15  
**When**: User clicks "Next" button  
**Then**:
- Page 2 is displayed
- Page counter updates to "Page 2 of 15"
- Previous button becomes enabled
- Smooth transition

#### TC-2.4.3: Navigation - Previous Button
**Given**: User is on page 5 of 15  
**When**: User clicks "Previous" button  
**Then**:
- Page 4 is displayed
- Page counter updates to "Page 4 of 15"
- Next button remains enabled
- Smooth transition

#### TC-2.4.4: Navigation - Keyboard Arrows
**Given**: User is viewing storybook  
**When**: User presses Right Arrow key  
**Then**:
- Next page is displayed
- Same behavior as clicking Next button

#### TC-2.4.5: Navigation - Keyboard Escape
**Given**: User is viewing storybook  
**When**: User presses Escape key  
**Then**:
- Modal closes
- User returns to dashboard
- No errors occur

#### TC-2.4.6: Navigation - First Page
**Given**: User is on page 1  
**When**: User tries to go previous  
**Then**:
- Previous button is disabled
- User cannot navigate before first page
- No errors occur

#### TC-2.4.7: Navigation - Last Page
**Given**: User is on last page (15 of 15)  
**When**: User tries to go next  
**Then**:
- Next button is disabled
- User cannot navigate after last page
- No errors occur

#### TC-2.4.8: Image Display - Correct Sizing
**Given**: User is viewing storybook page  
**When**: Page loads  
**Then**:
- Image displays correctly
- Image is not too wide (max-width: 576px)
- Image is not too tall (max-height: 400px)
- Image uses object-contain (not cropped)
- Text is visible without scrolling

#### TC-2.4.9: Image Display - Missing Image
**Given**: Storybook page has no image  
**When**: Page loads  
**Then**:
- Placeholder image is shown
- Or image fallback is displayed
- Page still functions correctly
- No broken image icon

#### TC-2.4.10: Image Display - Slow Loading
**Given**: User is viewing storybook  
**When**: Image takes time to load  
**Then**:
- Loading indicator is shown
- Image loads when ready
- Smooth transition
- No layout shift

#### TC-2.4.11: Articles Display - Needs Support Pages
**Given**: User is on "Needs Support" page with articles  
**When**: Page loads  
**Then**:
- "Helpful Resources" section is displayed
- Articles are listed (1-3 articles)
- Each article shows:
  - Source badge (CDC, HealthyChildren, AAP, Other)
  - Title
  - Description (if available)
  - External link icon
- Articles are clickable

#### TC-2.4.12: Articles Display - Milestone Met Pages
**Given**: User is on "Milestone Met" page  
**When**: Page loads  
**Then**:
- "Helpful Resources" section is NOT displayed
- Only milestone content is shown
- No articles are shown

#### TC-2.4.13: Articles - Click Article Link
**Given**: User is viewing article in storybook  
**When**: User clicks article link  
**Then**:
- Article opens in new tab
- External link icon indicates new tab
- Original storybook remains open
- No errors occur

#### TC-2.4.14: Articles - Invalid URL
**Given**: Storybook has article with invalid URL  
**When**: User clicks article link  
**Then**:
- Article should have been filtered out during validation
- If not filtered, error handling occurs
- User sees appropriate message

#### TC-2.4.15: Download PDF from Modal
**Given**: User is viewing storybook  
**When**: User clicks "Download PDF" button in modal  
**Then**:
- PDF download starts
- PDF opens in new tab or downloads
- PDF content matches storybook
- Modal remains open
- No errors occur

#### TC-2.4.16: Edge Case - Very Long Narrative Text
**Given**: Storybook page has very long narrative text  
**When**: Page displays  
**Then**:
- Text is readable
- Text wraps correctly
- No overflow issues
- Scroll works if needed

#### TC-2.4.17: Edge Case - Many Pages (30+)
**Given**: Storybook has 30 pages  
**When**: User navigates through pages  
**Then**:
- All pages load correctly
- Navigation works smoothly
- Performance is acceptable
- No memory issues

#### TC-2.4.18: Edge Case - Cache Busting
**Given**: Storybook was regenerated  
**When**: User opens storybook viewer  
**Then**:
- New images are loaded (not cached)
- Cache-busting query parameter is included
- Updated content is displayed
- No stale images

#### TC-2.4.19: Response Latency - Slow Image Loading
**Given**: User is viewing storybook  
**When**: Images load slowly  
**Then**:
- Loading indicators are shown
- Images load progressively
- User can still navigate pages
- No blocking behavior

#### TC-2.4.20: UI Bug Check - Modal Layout
**Given**: User opens storybook viewer  
**When**: Modal displays  
**Then**:
- Modal is centered
- Modal is properly sized
- Close button is visible
- Navigation buttons are accessible
- Content is scrollable if needed
- Responsive on all screen sizes
- No overlapping elements

#### TC-2.4.21: Failure State - Storybook API Error
**Given**: User clicks "View Storybook"  
**When**: Storybook API returns error  
**Then**:
- Error message appears in modal
- Modal can be closed
- User can retry
- No crash occurs

#### TC-2.4.22: Failure State - Missing Storybook Data
**Given**: Assessment has no storybook  
**When**: User tries to view storybook  
**Then**:
- Error message appears: "Storybook not available yet."
- Or button is disabled
- User cannot open viewer

---

### Test Suite 2.5: All Storybooks Page (`/dashboard/parent/storybooks`)

#### TC-2.5.1: Happy Path - View All Storybooks
**Given**: User has multiple children with storybooks  
**When**: User navigates to `/dashboard/parent/storybooks`  
**Then**:
- All storybooks across all children are displayed
- Summary stats are correct (total, approved, pending, generating)
- Storybooks are grouped or listed correctly
- No errors occur

#### TC-2.5.2: Empty State - No Storybooks
**Given**: User has no storybooks  
**When**: User navigates to all storybooks page  
**Then**:
- Empty state message displays
- "Start New Assessment" button is visible
- No errors occur

#### TC-2.5.3: Filters - By Status
**Given**: User has storybooks with different statuses  
**When**: User filters by "Approved"  
**Then**:
- Only approved storybooks are displayed
- Filter state is preserved
- Count updates correctly

#### TC-2.5.4: Search - By Child or Assessment
**Given**: User has multiple storybooks  
**When**: User searches for child name  
**Then**:
- Matching storybooks are displayed
- Search works correctly
- Clear search works

#### TC-2.5.5: Sort - By Date
**Given**: User has multiple storybooks  
**When**: User sorts by "Newest"  
**Then**:
- Storybooks are sorted by completion date
- Newest first
- Sort state is preserved

#### TC-2.5.6: View Modes - Grid/List
**Given**: User is on all storybooks page  
**When**: User toggles view mode  
**Then**:
- Grid view displays correctly
- List view displays correctly
- View preference is preserved

#### TC-2.5.7: Click Storybook - Opens Viewer
**Given**: User is on all storybooks page  
**When**: User clicks storybook card  
**Then**:
- Storybook viewer modal opens
- Correct storybook is displayed
- No errors occur

#### TC-2.5.8: Download PDF from List
**Given**: User is on all storybooks page  
**When**: User clicks "Download PDF" on storybook card  
**Then**:
- PDF download starts
- Correct PDF is downloaded
- No errors occur

#### TC-2.5.9: Edge Case - Many Storybooks (100+)
**Given**: User has 100+ storybooks  
**When**: Page loads  
**Then**:
- All storybooks are displayed (or paginated)
- Performance is acceptable
- Filters and search work correctly
- No memory issues

#### TC-2.5.10: UI Bug Check - Storybook Cards
**Given**: User is on all storybooks page  
**When**: Storybooks display  
**Then**:
- Cards are properly aligned
- Images display correctly
- Text is readable
- Buttons are clickable
- No overlapping elements
- Responsive on all screen sizes

---

## FLOW 3: Physician Login & Review Flow

### Test Suite 3.1: Physician Login (`/dashboard/physician/login`)

#### TC-3.1.1: Happy Path - Sign In
**Given**: Physician has existing account  
**When**: Physician enters:
- Email: "doctor@hospital.com"
- Password: "correctpassword"
**And**: Physician clicks "Access Review Dashboard"  
**Then**:
- Physician is authenticated
- Physician is redirected to `/dashboard/physician`
- No errors occur

#### TC-3.1.2: Happy Path - Sign Up
**Given**: Physician is new user  
**When**: Physician:
- Toggles to "Sign Up" mode
- Enters full name: "Dr. Jane Smith"
- Enters email: "newdoctor@hospital.com"
- Enters password: "SecurePass123"
**And**: Physician clicks "Create Account"  
**Then**:
- Account is created
- Profile is created with role='physician'
- Physician is logged in
- Physician is redirected to dashboard
- No errors occur

#### TC-3.1.3: Form Validation - Empty Fields
**Given**: Physician is on login page  
**When**: Physician tries to submit without filling fields  
**Then**:
- Error messages appear
- Form does not submit
- User remains on page

#### TC-3.1.4: Form Validation - Invalid Credentials
**Given**: Physician is on login page  
**When**: Physician enters incorrect credentials  
**Then**:
- Error message appears
- Form does not submit
- User remains on page

#### TC-3.1.5: Toggle Sign In/Sign Up
**Given**: Physician is on login page  
**When**: Physician toggles between sign in and sign up  
**Then**:
- Form fields update correctly
- Full name field appears/disappears
- Button text updates
- No errors occur

#### TC-3.1.6: Edge Case - Non-Physician Tries Physician Login
**Given**: User with role 'parent'  
**When**: User tries to access physician login  
**And**: User tries to sign in  
**Then**:
- Login may succeed but user is redirected to parent dashboard
- Or access is denied with error message
- Role is checked correctly

#### TC-3.1.7: Edge Case - Duplicate Email Signup
**Given**: Physician tries to sign up with existing email  
**When**: Physician submits signup form  
**Then**:
- Error message appears: "Email already registered. Please sign in."
- Form does not submit
- Toggle to sign in is suggested

#### TC-3.1.8: Response Latency - Slow Authentication
**Given**: Physician is on login page  
**When**: Authentication is slow  
**Then**:
- Loading indicator appears
- Button is disabled
- User cannot double-submit
- After response, redirect or error occurs

#### TC-3.1.9: Failure State - Network Error
**Given**: Physician is on login page  
**When**: Network disconnects  
**Then**:
- Error message appears
- User can retry
- Form data is preserved

---

### Test Suite 3.2: Physician Dashboard (`/dashboard/physician`)

#### TC-3.2.1: Happy Path - Dashboard Load
**Given**: Physician is logged in  
**When**: Physician navigates to dashboard  
**Then**:
- Dashboard loads successfully
- Stats cards display correctly:
  - Pending Reviews count
  - Approved Assessments count
  - Average Review Time
- Pending Reviews section displays
- Recently Reviewed section displays
- No errors occur

#### TC-3.2.2: Pending Reviews - Display
**Given**: Physician has pending reviews  
**When**: Dashboard loads  
**Then**:
- All pending reviews are displayed
- Each card shows:
  - Child name and age
  - Parent name and email
  - Red flag count
  - Completion date
  - Priority badge
  - AI processing status (if applicable)
- Cards are clickable

#### TC-3.2.3: Priority Calculation
**Given**: Physician has reviews with different priority levels  
**When**: Dashboard loads  
**Then**:
- High priority reviews are displayed first (if sorted by priority)
- Priority badges are correct (High/Medium/Low)
- Priority calculation is accurate:
  - High: >50 points
  - Medium: 20-50 points
  - Low: <20 points

#### TC-3.2.4: Filters - By Priority
**Given**: Physician has reviews with different priorities  
**When**: Physician filters by "High Priority"  
**Then**:
- Only high priority reviews are displayed
- Filter state is preserved
- Count updates correctly

#### TC-3.2.5: Filters - By Status
**Given**: Physician has reviews with different AI processing statuses  
**When**: Physician filters by "Ready"  
**Then**:
- Only completed AI processing reviews are displayed
- Filter works correctly

#### TC-3.2.6: Sort - By Priority
**Given**: Physician has multiple reviews  
**When**: Physician sorts by "Priority"  
**Then**:
- Reviews are sorted by priority (highest first)
- Sort state is preserved

#### TC-3.2.7: Sort - By Most Flags
**Given**: Physician has multiple reviews  
**When**: Physician sorts by "Most Flags"  
**Then**:
- Reviews are sorted by red flag count (highest first)
- Sort state is preserved

#### TC-3.2.8: Search - By Child or Parent Name
**Given**: Physician has multiple reviews  
**When**: Physician searches for child name  
**Then**:
- Matching reviews are displayed
- Search works correctly
- Clear search works

#### TC-3.2.9: Review Next Button
**Given**: Physician has pending reviews  
**When**: Physician clicks "Review Next" button  
**Then**:
- Highest priority review modal opens
- Review modal displays correctly
- No errors occur

#### TC-3.2.10: Click Review Card
**Given**: Physician has pending review  
**When**: Physician clicks review card  
**Then**:
- Review modal opens
- Assessment details are loaded
- No errors occur

#### TC-3.2.11: Recently Reviewed Section
**Given**: Physician has reviewed assessments  
**When**: Dashboard loads  
**Then**:
- Recently reviewed assessments are displayed
- Shows child name, status, review date
- Sorted by review date (newest first)
- Limited to recent items (e.g., last 10)

#### TC-3.2.12: Edge Case - No Pending Reviews
**Given**: Physician has no pending reviews  
**When**: Dashboard loads  
**Then**:
- Empty state message displays
- "Review Next" button is disabled or hidden
- No errors occur

#### TC-3.2.13: Edge Case - Many Pending Reviews (50+)
**Given**: Physician has 50+ pending reviews  
**When**: Dashboard loads  
**Then**:
- All reviews are displayed (or paginated)
- Performance is acceptable
- Filters and search work correctly
- No memory issues

#### TC-3.2.14: Response Latency - Slow Data Loading
**Given**: Physician is on dashboard  
**When**: Data API is slow  
**Then**:
- Loading skeleton or spinner is shown
- Page remains responsive
- Data loads when API responds
- No errors occur

#### TC-3.2.15: UI Bug Check - Dashboard Layout
**Given**: Physician is on dashboard  
**When**: Page loads  
**Then**:
- Header is fixed at top
- Sidebar is fixed on left
- Main content has correct margins
- No overlapping elements
- Responsive on all screen sizes

#### TC-3.2.16: Failure State - API Error
**Given**: Physician is on dashboard  
**When**: API returns error  
**Then**:
- Error message is displayed
- Retry button is shown (if implemented)
- User can refresh page
- No crash occurs

---

### Test Suite 3.3: Physician Review Modal

#### TC-3.3.1: Happy Path - Review and Approve
**Given**: Physician opens review modal  
**When**: Physician:
- Reviews assessment details
- Reviews responses
- Reviews storybook (if generated)
- Adds physician notes (optional)
- Clicks "Approve"  
**Then**:
- Review is submitted successfully
- Status is updated to 'approved'
- Parent visibility is set to true
- AI generation is triggered (if not done)
- Modal closes
- Dashboard refreshes
- No errors occur

#### TC-3.3.2: Review - Needs Revision
**Given**: Physician opens review modal  
**When**: Physician:
- Reviews assessment
- Adds notes explaining needed revisions
- Clicks "Needs Revision"  
**Then**:
- Review is submitted successfully
- Status is updated to 'needs_revision'
- Parent visibility is set to false
- Notes are saved
- Modal closes
- Dashboard refreshes

#### TC-3.3.3: Review - Reject
**Given**: Physician opens review modal  
**When**: Physician:
- Reviews assessment
- Adds notes explaining rejection
- Clicks "Reject"  
**Then**:
- Review is submitted successfully
- Status is updated to 'rejected'
- Parent visibility is set to false
- Notes are saved
- Modal closes
- Dashboard refreshes

#### TC-3.3.4: Assessment Overview Display
**Given**: Physician opens review modal  
**When**: Modal loads  
**Then**:
- Child information is displayed correctly:
  - Name, age, date of birth
- Parent information is displayed correctly:
  - Name, email
- Completion date is displayed
- Review status badge is displayed
- All information is accurate

#### TC-3.3.5: Assessment Responses Display
**Given**: Physician opens review modal  
**When**: Modal loads  
**Then**:
- All responses are displayed
- Responses are grouped by category
- Red flags are highlighted
- Notes are displayed (if entered by parent)
- Response values are clear (yes/no/sometimes/not_sure)

#### TC-3.3.6: Storybook Preview - Completed
**Given**: Assessment has completed storybook  
**When**: Physician opens review modal  
**Then**:
- Storybook preview is displayed
- All pages are visible
- Images load correctly
- Narrative text is displayed
- Articles are shown for "Needs Support" pages
- Navigation works (Previous/Next)

#### TC-3.3.7: Storybook Preview - Generating
**Given**: Assessment storybook is generating  
**When**: Physician opens review modal  
**Then**:
- Progress bar is displayed
- Progress updates in real-time (0-100%)
- "Generating..." message is shown
- Storybook preview is not shown until complete
- Polling occurs every 1 second

#### TC-3.3.8: Storybook Preview - Not Started
**Given**: Assessment is approved but AI not started  
**When**: Physician opens review modal  
**Then**:
- Storybook preview is not shown
- Message indicates storybook will be generated after approval
- Or preview shows "Not generated yet"

#### TC-3.3.9: AI Progress Polling
**Given**: Assessment is generating  
**When**: Physician views review modal  
**Then**:
- Progress bar updates every 1 second
- Progress value increases (5% → 10% → 20% → ... → 100%)
- When complete, storybook preview appears
- Polling stops when complete
- No performance issues

#### TC-3.3.10: Retry AI Generation
**Given**: Assessment AI generation failed  
**When**: Physician clicks "Retry AI Generation"  
**Then**:
- AI generation is retriggered
- Progress bar appears
- Status updates to 'processing'
- Generation proceeds
- No errors occur

#### TC-3.3.11: Regenerate PDF
**Given**: Assessment has PDFs  
**When**: Physician clicks "Regenerate PDF"  
**Then**:
- Old PDFs are deleted from storage
- New PDFs are generated
- PDF URLs are updated in database
- Success message appears
- No errors occur

#### TC-3.3.12: Physician Notes - Enter Notes
**Given**: Physician is reviewing assessment  
**When**: Physician enters notes in textarea  
**Then**:
- Notes are saved when review is submitted
- Notes are displayed in assessment history
- Notes are included in physician PDF (if applicable)

#### TC-3.3.13: Edge Case - Very Long Notes
**Given**: Physician enters very long notes (2000+ characters)  
**When**: Physician submits review  
**Then**:
- Notes are accepted (or max length error if limit exists)
- Notes are stored correctly
- Notes display correctly
- No database errors

#### TC-3.3.14: Edge Case - Storybook with Many Pages (30+)
**Given**: Assessment has 30-page storybook  
**When**: Physician views storybook preview  
**Then**:
- All pages are accessible
- Navigation works correctly
- Performance is acceptable
- No memory issues

#### TC-3.3.15: Edge Case - Missing Storybook Data
**Given**: Assessment has incomplete storybook data  
**When**: Physician views storybook preview  
**Then**:
- Error handling occurs
- Appropriate message is displayed
- Physician can still review and approve
- No crash occurs

#### TC-3.3.16: Response Latency - Slow Review Submission
**Given**: Physician submits review  
**When**: API is slow  
**Then**:
- Loading indicator appears on button
- Button is disabled
- User cannot double-submit
- After response, modal closes or error is shown

#### TC-3.3.17: UI Bug Check - Modal Layout
**Given**: Physician opens review modal  
**When**: Modal displays  
**Then**:
- Modal is properly sized
- All sections are visible
- Scroll works if needed
- Buttons are accessible
- Close button works
- Responsive on all screen sizes
- No overlapping elements

#### TC-3.3.18: Failure State - Review Submission Error
**Given**: Physician submits review  
**When**: API returns error  
**Then**:
- Error message appears: "Unable to submit review. Please try again."
- Modal remains open
- User can retry
- Form data is preserved
- No crash occurs

#### TC-3.3.19: Failure State - Assessment Not Found
**Given**: Physician clicks review card  
**When**: Assessment was deleted or doesn't exist  
**Then**:
- Error message appears: "Assessment not found."
- Modal closes or shows error
- User returns to dashboard
- No crash occurs

---

## FLOW 4: AI Storybook Generation Flow

### Test Suite 4.1: AI Processing - Happy Path

#### TC-4.1.1: Happy Path - Complete Generation
**Given**: Physician approves assessment  
**When**: AI processing starts  
**Then**:
- Progress updates correctly:
  - 5% - Milestone verification
  - 10% - Milestones verified
  - 20% - Selector agent
  - 35% - Storybook agent
  - 45% - Validation agent
  - 50% - Pages combined
  - 50-80% - Image generation (batches)
  - 80% - Images complete
  - 82-88% - Parent PDF generation
  - 88-95% - Physician PDF generation
  - 95-100% - Finalization
- Storybook is generated successfully
- All images are generated
- PDFs are generated
- Status updates to 'completed'
- Parent can view storybook

#### TC-4.1.2: Milestone Verification
**Given**: Assessment is submitted  
**When**: AI processing starts  
**Then**:
- All assessment responses are verified
- Milestone statuses are determined (met/missed)
- Verified milestones are passed to next step
- No milestones are lost
- Verification is accurate

#### TC-4.1.3: Storybook Generation
**Given**: Verified milestones are available  
**When**: Storybook agent runs  
**Then**:
- Narrative text is generated for each milestone
- Illustration prompts are created
- CDC narratives are used as primary source
- Each page is unique
- Page count matches milestone count

#### TC-4.1.4: Image Generation - Batch Processing
**Given**: Storybook pages are ready  
**When**: Images are generated  
**Then**:
- Images are processed in batches (10 per batch)
- Progress updates after each batch
- All images are generated successfully
- Images are uploaded to Supabase storage
- Image URLs are stored correctly

#### TC-4.1.5: Article Recommendations
**Given**: "Needs Support" pages are identified  
**When**: Articles are fetched  
**Then**:
- Articles are retrieved (priority: Database → AI → Static)
- 1-3 articles per page
- Articles are validated (URLs are accessible)
- Articles are attached to pages
- Articles are stored in ai_report

#### TC-4.1.6: PDF Generation - Parent PDF
**Given**: Storybook is complete  
**When**: Parent PDF is generated  
**Then**:
- PDF includes cover page
- PDF includes all storybook pages
- Images are included and compressed
- Articles are included for "Needs Support" pages
- PDF is uploaded to Supabase storage
- parent_pdf_url is updated

#### TC-4.1.7: PDF Generation - Physician PDF
**Given**: Storybook is complete  
**When**: Physician PDF is generated  
**Then**:
- PDF includes all content
- May include additional clinical notes
- PDF is uploaded to Supabase storage
- physician_pdf_url is updated

---

### Test Suite 4.2: AI Processing - Edge Cases

#### TC-4.2.1: Edge Case - Rate Limiting
**Given**: Many images need to be generated  
**When**: OpenAI rate limit is hit  
**Then**:
- Failed requests are added to retry queue
- Retry occurs with exponential backoff
- All images are eventually generated
- Progress continues to update
- No data loss

#### TC-4.2.2: Edge Case - Content Policy Violation
**Given**: Image prompt violates OpenAI policy  
**When**: Image generation fails  
**Then**:
- Prompt is sanitized
- Retry with sanitized prompt
- If still fails, fallback prompt is used
- Image is eventually generated
- No processing failure

#### TC-4.2.3: Edge Case - Very Many Milestones (50+)
**Given**: Assessment has 50+ milestones  
**When**: AI processing runs  
**Then**:
- All milestones are processed
- Storybook has 50+ pages
- All images are generated
- PDFs are generated successfully
- Performance is acceptable
- No timeout issues

#### TC-4.2.4: Edge Case - No "Needs Support" Milestones
**Given**: All milestones are "met"  
**When**: Storybook is generated  
**Then**:
- Storybook is generated successfully
- No articles are attached (only for "Needs Support")
- All pages show "Milestone Met" status
- PDFs are generated correctly

#### TC-4.2.5: Edge Case - All "Needs Support" Milestones
**Given**: All milestones are "missed"  
**When**: Storybook is generated  
**Then**:
- Storybook is generated successfully
- All pages have articles (1-3 per page)
- All pages show "Needs Support" status
- PDFs include all articles

#### TC-4.2.6: Edge Case - Missing Article URLs
**Given**: Articles have invalid URLs  
**When**: Articles are validated  
**Then**:
- Invalid URLs are filtered out
- Fallback articles are used
- At least 1 article per "Needs Support" page
- No broken links in storybook

---

### Test Suite 4.3: AI Processing - Error Handling

#### TC-4.3.1: Failure State - Milestone Verification Fails
**Given**: Assessment is submitted  
**When**: Milestone verification fails  
**Then**:
- Error is logged
- Status updates to 'failed'
- Error message is stored
- Physician can retry
- No data corruption

#### TC-4.3.2: Failure State - Storybook Generation Fails
**Given**: Milestones are verified  
**When**: Storybook agent fails  
**Then**:
- Error is logged
- Status updates to 'failed'
- Fallback mechanism creates pages from verified milestones
- Processing continues
- Storybook is still generated

#### TC-4.3.3: Failure State - Image Generation Fails
**Given**: Storybook pages are ready  
**When**: Image generation fails for some images  
**Then**:
- Failed images are retried
- Placeholder images are used if retry fails
- Processing continues
- Storybook is still generated
- Status reflects partial success

#### TC-4.3.4: Failure State - PDF Generation Fails
**Given**: Storybook is complete  
**When**: PDF generation fails  
**Then**:
- Error is logged
- Storybook is still viewable online
- PDF generation can be retried
- Status reflects PDF failure
- No data loss

#### TC-4.3.5: Failure State - Timeout
**Given**: AI processing is running  
**When**: Processing exceeds timeout (5 minutes)  
**Then**:
- Processing is cancelled
- Status updates to 'failed'
- Error message indicates timeout
- Physician can retry
- No partial data corruption

#### TC-4.3.6: Failure State - Database Error
**Given**: AI processing is running  
**When**: Database update fails  
**Then**:
- Error is logged
- Processing may continue but progress not saved
- Status may not update correctly
- Retry mechanism handles this
- No data loss

---

### Test Suite 4.4: AI Processing - Response Latency

#### TC-4.4.1: Response Latency - Slow Milestone Verification
**Given**: Assessment has many responses  
**When**: Milestone verification is slow (> 30 seconds)  
**Then**:
- Progress remains at 5% until complete
- No timeout occurs
- Processing continues
- User sees appropriate loading state

#### TC-4.4.2: Response Latency - Slow Image Generation
**Given**: Many images need generation  
**When**: Image generation is slow  
**Then**:
- Progress updates incrementally (50% → 55% → 60% → ...)
- User sees progress updates
- No timeout occurs
- All images are eventually generated

#### TC-4.4.3: Response Latency - Slow PDF Generation
**Given**: Storybook has many pages  
**When**: PDF generation is slow  
**Then**:
- Progress updates (82% → 88% → 95%)
- User sees progress
- PDFs are eventually generated
- No timeout occurs

---

## FLOW 5: PDF Generation & Download Flow

### Test Suite 5.1: PDF Generation - Happy Path

#### TC-5.1.1: Happy Path - Parent PDF Generation
**Given**: Storybook is complete  
**When**: Parent PDF is generated  
**Then**:
- PDF includes cover page with child info
- PDF includes all storybook pages
- Images are included and properly sized
- Narrative text is included
- Status badges are correct
- Articles are included for "Needs Support" pages
- PDF is uploaded to Supabase storage
- parent_pdf_url is updated in database
- PDF file size is reasonable (< 10MB)

#### TC-5.1.2: Happy Path - Physician PDF Generation
**Given**: Storybook is complete  
**When**: Physician PDF is generated  
**Then**:
- PDF includes all content
- May include additional clinical information
- PDF is uploaded to Supabase storage
- physician_pdf_url is updated in database
- PDF file size is reasonable

#### TC-5.1.3: PDF Content - Cover Page
**Given**: PDF is generated  
**When**: PDF is opened  
**Then**:
- Cover page displays:
  - Child's name
  - Age in months
  - Progress summary
  - FirstSignFirst branding
- Cover page is properly formatted
- No layout issues

#### TC-5.1.4: PDF Content - Storybook Pages
**Given**: PDF is generated  
**When**: PDF is opened  
**Then**:
- Each page includes:
  - Milestone image (properly sized, not cropped)
  - Narrative text
  - Status badge
  - Category tag
  - Page number
- Pages are in correct order (Needs Support first, then Milestone Met)
- All pages are included

#### TC-5.1.5: PDF Content - Articles Section
**Given**: PDF has "Needs Support" pages  
**When**: PDF is opened  
**Then**:
- "Helpful Resources" section is included
- Articles are displayed with:
  - Source badge (CDC, HealthyChildren, AAP, Other)
  - Title
  - Description
  - URL (clickable)
- Articles are properly formatted
- No broken links

#### TC-5.1.6: PDF Download - From Dashboard
**Given**: User has approved assessment with PDF  
**When**: User clicks "Download PDF" in dashboard  
**Then**:
- PDF download starts
- PDF opens in browser or downloads
- PDF content is correct
- PDF is complete (all pages)
- No errors occur

#### TC-5.1.7: PDF Download - From Storybook Viewer
**Given**: User is viewing storybook  
**When**: User clicks "Download PDF" in modal  
**Then**:
- PDF download starts
- PDF content matches storybook
- Modal remains open
- No errors occur

---

### Test Suite 5.2: PDF Generation - Edge Cases

#### TC-5.2.1: Edge Case - Very Large Storybook (30+ pages)
**Given**: Storybook has 30+ pages  
**When**: PDF is generated  
**Then**:
- All pages are included
- PDF file size is reasonable
- PDF opens correctly
- No performance issues
- Images are compressed appropriately

#### TC-5.2.2: Edge Case - Missing Images
**Given**: Some storybook pages have no images  
**When**: PDF is generated  
**Then**:
- Placeholder images are used
- PDF is still generated
- No broken image errors
- PDF is complete

#### TC-5.2.3: Edge Case - Very Large Images
**Given**: Storybook has high-resolution images  
**When**: PDF is generated  
**Then**:
- Images are compressed using Sharp
- PDF file size is reasonable
- Image quality is acceptable
- PDF generation completes successfully

#### TC-5.2.4: Edge Case - Many Articles (10+ per page)
**Given**: Page has many articles  
**When**: PDF is generated  
**Then**:
- Only 1-3 articles are included (as per design)
- Articles are properly formatted
- No layout breaking
- PDF is readable

#### TC-5.2.5: Edge Case - Special Characters in Text
**Given**: Storybook has special characters (apostrophes, quotes, etc.)  
**When**: PDF is generated  
**Then**:
- Special characters are rendered correctly
- No encoding errors
- Text is readable
- PDF is valid

---

### Test Suite 5.3: PDF Generation - Error Handling

#### TC-5.3.1: Failure State - Image Download Fails
**Given**: PDF generation is running  
**When**: Image download from Supabase fails  
**Then**:
- Placeholder image is used
- PDF generation continues
- Error is logged
- PDF is still generated
- No crash occurs

#### TC-5.3.2: Failure State - PDF Upload Fails
**Given**: PDF is generated  
**When**: Upload to Supabase storage fails  
**Then**:
- Error is logged
- PDF generation is marked as failed
- PDF can be regenerated
- No data loss
- User sees appropriate error message

#### TC-5.3.3: Failure State - PDF Generation Timeout
**Given**: PDF generation is running  
**When**: Generation exceeds timeout  
**Then**:
- Generation is cancelled
- Error is logged
- Status reflects failure
- PDF can be regenerated
- No partial PDF is saved

#### TC-5.3.4: Failure State - Invalid PDF Data
**Given**: Storybook data is corrupted  
**When**: PDF generation runs  
**Then**:
- Error handling occurs
- Error is logged
- Generation fails gracefully
- User can retry
- No crash occurs

---

### Test Suite 5.4: PDF Generation - Response Latency

#### TC-5.4.1: Response Latency - Slow PDF Generation
**Given**: Storybook has many pages  
**When**: PDF generation is slow (> 30 seconds)  
**Then**:
- Progress updates are shown (82% → 88% → 95%)
- User sees progress indicator
- Generation completes eventually
- No timeout issues
- PDF is successfully generated

#### TC-5.4.2: Response Latency - Slow Image Compression
**Given**: PDF has many large images  
**When**: Image compression is slow  
**Then**:
- Compression completes
- PDF generation continues
- No timeout issues
- PDF is successfully generated

---

### Test Suite 5.5: PDF Regeneration

#### TC-5.5.1: Happy Path - Regenerate PDF
**Given**: Assessment has existing PDFs  
**When**: Physician clicks "Regenerate PDF"  
**Then**:
- Old PDFs are deleted from storage
- New PDFs are generated
- PDF URLs are updated in database
- Success message appears
- Parent can download new PDF
- No errors occur

#### TC-5.5.2: Edge Case - Regenerate While Downloading
**Given**: Parent is downloading PDF  
**When**: Physician regenerates PDF  
**Then**:
- Old PDF may still be accessible until deleted
- New PDF is generated
- URLs are updated
- No conflicts occur

#### TC-5.5.3: Failure State - Regeneration Fails
**Given**: Physician tries to regenerate PDF  
**When**: Regeneration fails  
**Then**:
- Error message appears
- Old PDFs remain (not deleted)
- User can retry
- No data loss

---

## FLOW 6: Article Recommendation System

### Test Suite 6.1: Article Retrieval - Happy Path

#### TC-6.1.1: Happy Path - Database Articles
**Given**: "Needs Support" page needs articles  
**When**: Articles are retrieved  
**Then**:
- Database articles are checked first
- Valid articles are returned
- Articles match category and age
- 1-3 articles are returned
- Articles are validated (URLs are accessible)

#### TC-6.1.2: Happy Path - AI Articles
**Given**: Database has no matching articles  
**When**: Articles are retrieved  
**Then**:
- AI articles are fetched
- Articles are validated
- 1-3 articles are returned
- Articles are relevant to milestone

#### TC-6.1.3: Happy Path - Static Fallback
**Given**: Database and AI have no articles  
**When**: Articles are retrieved  
**Then**:
- Static fallback articles are used
- At least 1 article is returned
- Articles are relevant
- Articles are validated

---

### Test Suite 6.2: Article Retrieval - Edge Cases

#### TC-6.2.1: Edge Case - No Articles Available
**Given**: No articles match criteria  
**When**: Articles are retrieved  
**Then**:
- Static fallback ensures at least 1 article
- Or empty array is returned (check business rules)
- Storybook still displays correctly
- No errors occur

#### TC-6.2.2: Edge Case - All URLs Invalid
**Given**: Articles have invalid URLs  
**When**: Articles are validated  
**Then**:
- Invalid URLs are filtered out
- Fallback articles are used
- At least 1 valid article is returned
- No broken links in storybook

#### TC-6.2.3: Edge Case - Article Validation Timeout
**Given**: Article URL validation is slow  
**When**: Articles are validated  
**Then**:
- Timeout is handled (5-10 seconds)
- Invalid articles are filtered
- Valid articles are returned
- Processing continues

---

### Test Suite 6.3: Article Display

#### TC-6.3.1: Article Display - Storybook Viewer
**Given**: User views "Needs Support" page  
**When**: Page loads  
**Then**:
- Articles are displayed in "Helpful Resources" section
- Articles show source, title, description
- Articles are clickable
- External link icon is shown

#### TC-6.3.2: Article Display - Review Modal
**Given**: Physician views storybook preview  
**When**: "Needs Support" page is displayed  
**Then**:
- Articles are displayed
- Articles are formatted correctly
- Articles are clickable
- No layout issues

#### TC-6.3.3: Article Display - PDF
**Given**: PDF is generated  
**When**: PDF includes "Needs Support" pages  
**Then**:
- Articles are included in PDF
- Articles are properly formatted
- URLs are clickable
- Source badges are displayed

---

## CROSS-FLOW TEST SCENARIOS

### Test Suite 7.1: Data Consistency

#### TC-7.1.1: Data Consistency - Assessment Status
**Given**: Assessment goes through review process  
**When**: Status changes occur  
**Then**:
- Status is consistent across:
  - Database
  - Parent dashboard
  - Physician dashboard
  - API responses
- No stale data is displayed
- Cache is properly invalidated

#### TC-7.1.2: Data Consistency - Storybook Regeneration
**Given**: Storybook is regenerated  
**When**: Regeneration completes  
**Then**:
- Parent sees updated storybook
- Physician sees updated storybook
- PDFs are updated
- Old images are deleted
- No orphaned files

#### TC-7.1.3: Data Consistency - Multiple Users
**Given**: Parent and physician view same assessment  
**When**: Physician approves assessment  
**Then**:
- Parent dashboard updates (via polling)
- Parent sees status change
- Storybook becomes visible to parent
- No data conflicts

---

### Test Suite 7.2: Concurrent Operations

#### TC-7.2.1: Concurrent - Multiple Assessments
**Given**: User submits multiple assessments simultaneously  
**When**: Assessments are processed  
**Then**:
- All assessments are processed correctly
- No data mixing
- Each assessment has correct child association
- No race conditions

#### TC-7.2.2: Concurrent - Multiple Physicians
**Given**: Multiple physicians review assessments  
**When**: Reviews are submitted  
**Then**:
- Each review is processed correctly
- No data conflicts
- Status updates are accurate
- No race conditions

---

### Test Suite 7.3: Security & Authorization

#### TC-7.3.1: Security - Unauthorized Access
**Given**: User is not logged in  
**When**: User tries to access dashboard  
**Then**:
- User is redirected to login
- No data is displayed
- No errors are exposed

#### TC-7.3.2: Security - Cross-User Data Access
**Given**: Parent A is logged in  
**When**: Parent A tries to access Parent B's child data  
**Then**:
- Access is denied
- RLS policies prevent access
- No data is returned
- Error message is appropriate

#### TC-7.3.3: Security - Physician Access
**Given**: Physician is logged in  
**When**: Physician accesses assessment  
**Then**:
- Physician can view all assessments
- RLS policies allow access
- No unauthorized data exposure

---

### Test Suite 7.4: Performance

#### TC-7.4.1: Performance - Dashboard Load Time
**Given**: User has 10 children with 50 assessments  
**When**: Dashboard loads  
**Then**:
- Load time is < 3 seconds
- Data is loaded efficiently
- No unnecessary API calls
- Pagination or lazy loading works (if implemented)

#### TC-7.4.2: Performance - Storybook Viewer
**Given**: Storybook has 20 pages  
**When**: User opens storybook viewer  
**Then**:
- Viewer opens in < 2 seconds
- Images load progressively
- Navigation is smooth
- No lag or freezing

#### TC-7.4.3: Performance - PDF Generation
**Given**: Storybook has 20 pages  
**When**: PDF is generated  
**Then**:
- Generation completes in < 60 seconds
- Progress updates are shown
- No timeout issues
- PDF is generated successfully

---

### Test Suite 7.5: Browser Compatibility

#### TC-7.5.1: Browser - Chrome
**Given**: User uses Chrome browser  
**When**: User performs all flows  
**Then**:
- All features work correctly
- No console errors
- UI displays correctly
- Performance is acceptable

#### TC-7.5.2: Browser - Safari
**Given**: User uses Safari browser  
**When**: User performs all flows  
**Then**:
- All features work correctly
- No Safari-specific issues
- UI displays correctly
- Performance is acceptable

#### TC-7.5.3: Browser - Firefox
**Given**: User uses Firefox browser  
**When**: User performs all flows  
**Then**:
- All features work correctly
- No Firefox-specific issues
- UI displays correctly
- Performance is acceptable

#### TC-7.5.4: Browser - Mobile Safari
**Given**: User uses mobile Safari  
**When**: User performs all flows  
**Then**:
- Mobile menu works correctly
- Touch interactions work
- Responsive design works
- No mobile-specific issues

---

### Test Suite 7.6: Accessibility

#### TC-7.6.1: Accessibility - Keyboard Navigation
**Given**: User navigates with keyboard only  
**When**: User performs all flows  
**Then**:
- All interactive elements are keyboard accessible
- Tab order is logical
- Focus indicators are visible
- No keyboard traps

#### TC-7.6.2: Accessibility - Screen Reader
**Given**: User uses screen reader  
**When**: User navigates application  
**Then**:
- All content is announced
- Form labels are associated
- Buttons have descriptive text
- Images have alt text
- ARIA labels are used where needed

---

## SUMMARY OF TEST COVERAGE

### Total Test Scenarios: 200+

**By Flow**:
- Flow 1 (Guest Assessment): 50+ scenarios
- Flow 2 (Parent Dashboard): 60+ scenarios
- Flow 3 (Physician Review): 40+ scenarios
- Flow 4 (AI Generation): 30+ scenarios
- Flow 5 (PDF Generation): 25+ scenarios
- Flow 6 (Articles): 15+ scenarios
- Cross-Flow: 20+ scenarios

**By Category**:
- Happy Path: 60+ scenarios
- Edge Cases: 50+ scenarios
- Error Handling: 40+ scenarios
- Form Validation: 30+ scenarios
- UI Bugs: 20+ scenarios
- Response Latency: 15+ scenarios
- Failure States: 25+ scenarios

---

## PRIORITY TESTING RECOMMENDATIONS

### Critical (Must Test Before Release)
1. Assessment submission and account creation
2. Physician review and approval
3. AI storybook generation (end-to-end)
4. PDF generation and download
5. Storybook viewer functionality
6. Data consistency across views
7. Security and authorization

### High Priority
1. Form validations
2. Error handling
3. Response latency
4. Edge cases (many children, many assessments)
5. Concurrent operations

### Medium Priority
1. UI alignment and responsiveness
2. Browser compatibility
3. Accessibility
4. Performance optimization
5. Article recommendation system

---

## TEST EXECUTION NOTES

### Test Environment
- Use staging environment that mirrors production
- Test with real Supabase database
- Test with real OpenAI API (or mocked for cost control)
- Test with various network conditions

### Test Data
- Create test accounts for each user type
- Create test children with various ages
- Create test assessments with different statuses
- Create test storybooks with various page counts

### Automation Considerations
- Critical paths should be automated
- Form validations can be automated
- API endpoints can be tested with integration tests
- UI tests for key user flows
- Performance tests for AI generation

---

This comprehensive test suite covers all identified user flows with detailed scenarios for happy paths, edge cases, error handling, and failure states.

