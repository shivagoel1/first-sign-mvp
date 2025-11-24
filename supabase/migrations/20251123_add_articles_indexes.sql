-- Add indexes for articles table to improve query performance
-- These indexes support the article retrieval logic in article-agent.ts

-- Index for category filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);

-- Index for milestone code filtering (exact matches)
CREATE INDEX IF NOT EXISTS idx_articles_milestone_code ON public.articles(milestone_code);

-- Index for age range queries (B-tree for range queries)
CREATE INDEX IF NOT EXISTS idx_articles_age_range ON public.articles(age_months_min, age_months_max);

-- Index for validation status filtering (filtering valid articles)
CREATE INDEX IF NOT EXISTS idx_articles_validation_status ON public.articles(validation_status, is_validated);

-- Composite index for priority-based queries (ordering by priority, featured, usage)
CREATE INDEX IF NOT EXISTS idx_articles_priority ON public.articles(priority DESC, is_featured DESC, times_used ASC);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_articles_source ON public.articles(source);

-- Composite index for common query pattern: category + validation + backup
CREATE INDEX IF NOT EXISTS idx_articles_category_validation_backup ON public.articles(category, validation_status, is_backup) 
WHERE validation_status = 'valid' AND is_backup = true;

-- Index for article usage log queries
CREATE INDEX IF NOT EXISTS idx_article_usage_article ON public.article_usage_log(article_id);
CREATE INDEX IF NOT EXISTS idx_article_usage_assessment ON public.article_usage_log(assessment_result_id);
CREATE INDEX IF NOT EXISTS idx_article_usage_milestone ON public.article_usage_log(milestone_code);

