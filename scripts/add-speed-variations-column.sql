-- Add speed_variations column to projects table
-- This migration adds support for speed variations in the video editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS speed_variations JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN projects.speed_variations IS 'Stores video speed variations for the project';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'speed_variations';
