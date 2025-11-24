# Validate Articles - Change Status from "pending" to "valid"

## Why Articles Show "pending"

When you insert articles, `validation_status` defaults to `'pending'` because:
1. **Default value** in schema: `validation_status text DEFAULT 'pending'`
2. **URLs haven't been checked yet** - Need to verify they're accessible
3. **Prevents showing broken links** - Only validated articles are used

---

## How to Validate Articles

### Option 1: Run Validation Script (Recommended)

I've created a script that validates all pending articles:

**File**: `scripts/validate-articles.ts`

**Run it:**
```bash
npx tsx scripts/validate-articles.ts
```

**What it does:**
- Fetches all articles with `validation_status = 'pending'`
- Checks each URL (HEAD/GET request)
- Updates status to:
  - `'valid'` if URL is accessible (200 OK)
  - `'invalid'` if URL returns 404 or error
  - `'timeout'` if request times out
- Updates `is_validated`, `validation_date`, `last_checked_at`

---

### Option 2: Manual SQL Update (Quick Test)

If you want to manually mark a few articles as valid:

```sql
-- Mark specific article as valid
UPDATE public.articles
SET 
  validation_status = 'valid',
  is_validated = true,
  validation_date = now(),
  last_checked_at = now()
WHERE id = 'your-article-id-here';

-- Or mark all as valid (if you've verified them manually)
UPDATE public.articles
SET 
  validation_status = 'valid',
  is_validated = true,
  validation_date = now(),
  last_checked_at = now()
WHERE validation_status = 'pending';
```

**⚠️ Warning**: Only mark as valid if you've verified the URLs are accessible!

---

### Option 3: Validate via Supabase Dashboard

1. **Open Supabase Dashboard** → Table Editor → `articles`
2. **Filter** by `validation_status = 'pending'`
3. **Manually check** a few URLs
4. **Update** status to `'valid'` for working URLs

---

## Validation Status Values

| Status | Meaning | Action |
|--------|---------|--------|
| `'pending'` | Not yet validated | Run validation script |
| `'valid'` | URL is accessible (200 OK) | ✅ Ready to use |
| `'invalid'` | URL returns 404 or error | ❌ Remove or fix URL |
| `'timeout'` | Request timed out | ⚠️ Check URL manually |

---

## Why Validation Matters

The `getBackupArticlesFromDatabase` function only returns articles with:
```typescript
.eq('validation_status', 'valid')
```

So articles with `validation_status = 'pending'` **won't be returned** until they're validated!

---

## Quick Fix: Mark All as Valid (If You Trust the URLs)

If you've verified the URLs from Perplexity are correct, you can mark them all as valid:

```sql
UPDATE public.articles
SET 
  validation_status = 'valid',
  is_validated = true,
  validation_date = now(),
  last_checked_at = now()
WHERE validation_status = 'pending';
```

**Then run the validation script later** to catch any broken URLs.

---

## Check Validation Status

```sql
-- See validation status breakdown
SELECT 
  validation_status,
  COUNT(*) as count
FROM articles
GROUP BY validation_status
ORDER BY count DESC;
```

---

## Summary

- **Why "pending"**: Default value, URLs not checked yet
- **How to fix**: Run validation script or manually update
- **Important**: Only `validation_status = 'valid'` articles are used by the system

Run the validation script to check all URLs and update their status!

