-- Migration: Add ai_processing_status column to assessment_results
ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS ai_processing_status VARCHAR(20) NOT NULL DEFAULT 'pending'
  CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS ai_processing_progress INTEGER NOT NULL DEFAULT 0
  CHECK (ai_processing_progress >= 0 AND ai_processing_progress <= 100);

ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS ai_generation_cost DECIMAL(10,4) NOT NULL DEFAULT 0;

ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER NOT NULL DEFAULT 0;

ALTER TABLE assessment_results
ADD COLUMN IF NOT EXISTS ai_images_generated INTEGER NOT NULL DEFAULT 0;
