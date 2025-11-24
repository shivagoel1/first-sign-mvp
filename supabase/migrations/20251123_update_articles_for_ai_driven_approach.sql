-- Update articles table for AI-driven article selection approach
-- This migration removes constraints that prevent flexible article storage

-- 1. Remove foreign key constraint on milestone_code
-- Articles are matched by AI based on category, age, focus_area, and description
-- milestone_code is now optional and not enforced
ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_milestone_fkey;

-- 2. Remove unique constraint on url (if you want to allow duplicate URLs)
-- This allows the same article to be stored multiple times for different contexts
-- Uncomment the line below if you want to allow duplicate URLs:
-- ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_url_unique;

-- Note: The schema already has all necessary fields:
-- ✅ category (text, NOT NULL) - Required for AI matching
-- ✅ focus_area (text, nullable) - For condition-specific matching
-- ✅ age_months_min (integer, nullable) - Age range start
-- ✅ age_months_max (integer, nullable) - Age range end
-- ✅ description (text, nullable) - For semantic AI matching
-- ✅ milestone_code (text, nullable) - Optional reference only
-- ✅ priority (integer, default 5) - For ranking
-- ✅ validation_status (text, default 'pending') - For URL validation
-- ✅ is_backup (boolean, default true) - Marks backup articles

-- No other schema changes needed - the table structure is already correct!
-- The key change is removing the foreign key constraint so milestone_code
-- doesn't need to exist in the milestones table.

