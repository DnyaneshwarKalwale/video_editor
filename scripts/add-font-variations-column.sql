-- Add font_variations column to projects table
-- This migration adds support for font variations in the video editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS font_variations JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN projects.font_variations IS 'Stores font style variations for text elements in the project';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'font_variations';
