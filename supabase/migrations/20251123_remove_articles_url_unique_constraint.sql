-- Remove UNIQUE constraint on articles.url column
-- This allows the same article URL to be stored multiple times
-- (e.g., when the same article is relevant to multiple milestones)

-- Drop the unique constraint
ALTER TABLE public.articles 
DROP CONSTRAINT IF EXISTS articles_url_unique;

-- Note: The url column will still be NOT NULL, just not unique anymore
-- This means you can have duplicate URLs in the database

