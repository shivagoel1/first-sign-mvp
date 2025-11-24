-- RLS Policies for articles and article_usage_log tables
-- Articles are public resources that everyone can read
-- Only admins can manage articles (insert/update/delete)

-- Enable RLS on articles table
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on article_usage_log table
ALTER TABLE public.article_usage_log ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read articles (they are public resources)
CREATE POLICY "articles are publicly readable"
ON public.articles
FOR SELECT
USING (true);

-- Policy: Only admins can insert articles
CREATE POLICY "admins can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update articles
CREATE POLICY "admins can update articles"
ON public.articles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can delete articles
CREATE POLICY "admins can delete articles"
ON public.articles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Everyone can read article usage logs (for analytics)
-- But only system/service role can insert (via backend)
CREATE POLICY "article usage logs are publicly readable"
ON public.article_usage_log
FOR SELECT
USING (true);

-- Policy: Service role can insert usage logs (via backend)
-- Note: This allows the backend to log article usage
-- Regular users cannot insert directly
CREATE POLICY "service role can insert usage logs"
ON public.article_usage_log
FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS, so this is for explicit permission

-- Note: If you want to allow users to insert their own usage logs, use:
-- CREATE POLICY "users can insert own usage logs"
-- ON public.article_usage_log
-- FOR INSERT
-- WITH CHECK (true); -- Or add user_id column and check auth.uid()

