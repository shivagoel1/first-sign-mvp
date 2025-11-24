-- Fix RLS policy performance for assessment_responses table
-- Replace direct auth.uid() calls with (select auth.uid()) to evaluate once per query

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "parent can read responses of own assessments" ON assessment_responses;
DROP POLICY IF EXISTS "parent can insert responses for own assessments" ON assessment_responses;
DROP POLICY IF EXISTS "parent can update responses for own assessments" ON assessment_responses;

-- Recreate policies with optimized subquery pattern
-- This evaluates auth.uid() once per query instead of once per row

-- Policy for reading: Parents can read responses for their own assessments
CREATE POLICY "parent can read responses of own assessments"
ON assessment_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM assessments
    WHERE assessments.id = assessment_responses.assessment_id
      AND assessments.parent_id = (SELECT auth.uid())
  )
);

-- Policy for inserting: Parents can insert responses for their own assessments
CREATE POLICY "parent can insert responses for own assessments"
ON assessment_responses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM assessments
    WHERE assessments.id = assessment_responses.assessment_id
      AND assessments.parent_id = (SELECT auth.uid())
  )
);

-- Policy for updating: Parents can update responses for their own assessments
CREATE POLICY "parent can update responses for own assessments"
ON assessment_responses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM assessments
    WHERE assessments.id = assessment_responses.assessment_id
      AND assessments.parent_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM assessments
    WHERE assessments.id = assessment_responses.assessment_id
      AND assessments.parent_id = (SELECT auth.uid())
  )
);
