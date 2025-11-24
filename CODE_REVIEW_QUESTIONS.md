# Code Review Questions & Observations

## 🔍 Architecture & Design

### 1. **Article Caching Strategy**
- **Question**: The `articleCache` in `article-agent.ts` uses an in-memory Map with 24-hour TTL. This cache is per-server instance and will be lost on restart. Should this be:
  - Moved to Redis/database for persistence?
  - Shared across server instances?
  - Or is the current approach acceptable for MVP?

### 2. **Image Storage & Cleanup**
- **Question**: When storybooks are regenerated (`forceRegenerate=true`), old images remain in Supabase storage. Should we:
  - Delete old images before generating new ones?
  - Implement a cleanup job for orphaned images?
  - Or keep them for historical reference?

### 3. **Article Usage Logging**
- **Question**: We track `times_used` and `last_used_at` in the `articles` table, but we don't log to `article_usage_log` table. Should we:
  - Add logging to `article_usage_log` for analytics?
  - Or is the current `times_used` counter sufficient?

---

## 🔒 Security & Authorization

### 4. **API Route Authentication**
- **Question**: The `/api/ai/process` route doesn't explicitly check authentication. It relies on:
  - `assessmentId` being passed
  - Database RLS policies
  - Should we add explicit auth checks at the API level?

### 5. **Service Role Key Usage**
- **Question**: `createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. This is used in:
  - Article agent (`getBackupArticlesFromDatabase`)
  - Should we audit all usages to ensure they're necessary?
  - Are there any security concerns with this approach?

### 6. **Guest Assessment Data**
- **Question**: Guest assessments are stored in Zustand (client-side) and localStorage. Should we:
  - Add encryption for sensitive data?
  - Implement expiration/cleanup for old guest sessions?
  - Add rate limiting for guest assessments?

---

## ⚠️ Error Handling & Edge Cases

### 7. **AI Processing Failures**
- **Question**: If AI processing fails mid-way (e.g., during image generation), what happens?
  - Is the assessment marked as `failed`?
  - Can users retry?
  - Are partial results saved?

### 8. **Article Validation Failures**
- **Question**: If all article URLs fail validation (404s, timeouts), the system falls back to unvalidated static articles. Should we:
  - Show a warning to users?
  - Log this as an error for monitoring?
  - Have a better fallback strategy?

### 9. **Database Connection Failures**
- **Question**: What happens if Supabase connection fails during:
  - Storybook generation?
  - Article retrieval?
  - PDF generation?
  - Are there retry mechanisms?

### 10. **Image Generation Rate Limits**
- **Question**: OpenAI DALL-E has rate limits. The code has adaptive batching, but:
  - What happens if we hit hard rate limits?
  - Should we queue failed requests for retry?
  - Is there monitoring/alerting for rate limit issues?

---

## 📊 Data Consistency & Integrity

### 11. **Assessment Status Transitions**
- **Question**: The assessment status can be: `pending`, `generating`, `awaiting_review`, `approved`, `needs_revision`, `rejected`. Are there:
  - Validated state transitions?
  - Guards against invalid transitions?
  - Or can status jump from any state to any state?

### 12. **Milestone Verification**
- **Question**: `getVerifiedMilestones` verifies milestones against CDC guidelines. What happens if:
  - A milestone is removed from the database?
  - CDC guidelines are updated?
  - Should we version the guidelines?

### 13. **Article Priority & Ranking**
- **Question**: Articles are ranked by `priority`, `is_featured`, `times_used`. Should we:
  - Implement decay for `times_used` (older usage counts less)?
  - Add manual priority overrides?
  - Consider recency of `last_used_at`?

---

## 🚀 Performance & Scalability

### 14. **PDF Generation Performance**
- **Question**: PDF generation happens synchronously during storybook processing. For large storybooks:
  - Could this timeout?
  - Should PDFs be generated asynchronously?
  - Is there a size limit we should enforce?

### 15. **Database Query Optimization**
- **Question**: Some queries use `.select('*')` which fetches all columns. Should we:
  - Optimize to select only needed columns?
  - Add query result caching?
  - Review N+1 query patterns?

### 16. **Image Generation Parallelism**
- **Question**: Images are generated in batches (10 → 5 if rate limited). Should we:
  - Make batch size configurable?
  - Add monitoring for optimal batch size?
  - Consider queue-based processing for scale?

---

## 🔧 Code Quality & Maintainability

### 17. **Environment Variables**
- **Question**: Many features are toggled via env vars (`USE_AI_ARTICLE_AGENT`, `SKIP_AI_VALIDATION`, `USE_SELECTOR_AGENT`). Should we:
  - Document all env vars in one place?
  - Add validation on startup?
  - Use a config schema (e.g., Zod)?

### 18. **Type Safety**
- **Question**: Some places use `as any` or `as unknown as Type`. Should we:
  - Improve type definitions?
  - Add runtime validation (Zod schemas)?
  - Or is this acceptable for MVP?

### 19. **Error Messages**
- **Question**: Error messages are logged but some may not be user-friendly. Should we:
  - Add user-facing error messages?
  - Implement error codes for client handling?
  - Add error tracking (Sentry, etc.)?

---

## 📝 Business Logic Questions

### 20. **Article Source Priority**
- **Question**: We prioritize Database → AI → Static. Should this be:
  - Configurable per category?
  - Based on article quality scores?
  - Or is the current order correct?

### 21. **Storybook Regeneration**
- **Question**: When a physician requests regeneration, does it:
  - Regenerate everything (images, articles, PDFs)?
  - Only regenerate specific parts?
  - Preserve physician notes/comments?

### 22. **Assessment Completion**
- **Question**: What happens if a parent:
  - Starts an assessment but doesn't complete it?
  - Completes assessment but AI processing fails?
  - Can they resume/retry?

### 23. **Multiple Children Support**
- **Question**: The dashboard supports multiple children. Are there:
  - Limits on number of children per parent?
  - Limits on assessments per child?
  - Bulk operations needed?

---

## 🧪 Testing & Quality Assurance

### 24. **Test Coverage**
- **Question**: I don't see test files. Should we add:
  - Unit tests for critical functions?
  - Integration tests for API routes?
  - E2E tests for user flows?

### 25. **Data Validation**
- **Question**: Are there validations for:
  - User input (assessment responses)?
  - AI-generated content (storybook pages)?
  - Article URLs before storing?

---

## 🔄 Missing Features / Incomplete Implementations

### 26. **Article Usage Analytics**
- **Question**: The `article_usage_log` table exists but isn't used. Should we:
  - Implement logging when articles are shown?
  - Build analytics dashboard?
  - Or remove the table if not needed?

### 27. **Physician Referrals**
- **Question**: The `physician_referrals` table exists. Is this feature:
  - Implemented?
  - Planned for future?
  - Or legacy code?

### 28. **Assessment Notes**
- **Question**: `assessment_responses` has a `notes` field. Is this:
  - Used in storybook generation?
  - Shown to physicians?
  - Or unused?

---

## 🎯 Specific Code Questions

### 29. **Progress Update Delay**
- **Question**: In `updateProgress`, there's a 200ms delay after updating. Is this:
  - Necessary for database consistency?
  - A workaround for polling issues?
  - Could we use database triggers/notifications instead?

### 30. **Image URL Caching**
- **Question**: Images use cache-busting with `updated_at` timestamps. Should we:
  - Use ETags instead?
  - Implement proper cache headers?
  - Or is current approach sufficient?

### 31. **Article Validation Timeout**
- **Question**: `isUrlAccessible` checks URLs with a timeout. What's the timeout value?
  - Is it configurable?
  - Should it vary by source (CDC vs external)?
  - Are timeouts logged for monitoring?

---

## 📋 Documentation & Onboarding

### 32. **API Documentation**
- **Question**: Are API routes documented?
  - Should we add OpenAPI/Swagger?
  - Or inline JSDoc comments?

### 33. **Deployment Guide**
- **Question**: Is there documentation for:
  - Environment setup?
  - Database migrations?
  - Deployment process?

---

## 🚨 Critical Questions (High Priority)

### 34. **Data Backup & Recovery**
- **Question**: What's the backup strategy for:
  - User data (assessments, children)?
  - Generated storybooks?
  - Images in storage?

### 35. **Compliance & Privacy**
- **Question**: For healthcare data (HIPAA considerations):
  - Is data encrypted at rest?
  - Are there data retention policies?
  - Is PII properly handled?

### 36. **Cost Monitoring**
- **Question**: OpenAI API costs are tracked. Should we:
  - Set budget alerts?
  - Implement cost per assessment limits?
  - Monitor and optimize expensive operations?

---

## 💡 Suggestions for Improvement

### 37. **Centralized Logging**
- **Suggestion**: Consider structured logging (e.g., Winston, Pino) instead of `console.log` for:
  - Better log aggregation
  - Log levels (info, warn, error)
  - Production monitoring

### 38. **Configuration Management**
- **Suggestion**: Create a `lib/config.ts` file to:
  - Centralize all config values
  - Validate env vars on startup
  - Provide type-safe config access

### 39. **Error Boundaries**
- **Suggestion**: Add React error boundaries for:
  - Better error handling in UI
  - Graceful degradation
  - User-friendly error messages

---

## ❓ Your Input Needed

Please review these questions and let me know:
1. Which are critical to address now?
2. Which can wait for future iterations?
3. Are there any incorrect assumptions?
4. Any additional concerns I should review?

I can help implement fixes/improvements for any of these areas!

