-- Project Naming Patterns Table
-- Stores naming patterns per project with custom element names
-- Each project can have its own unique naming pattern

CREATE TABLE IF NOT EXISTS project_naming_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL DEFAULT 'default' CHECK (pattern_type IN ('default', 'numbers', 'letters', 'letters-upper')),
  element_names JSONB NOT NULL DEFAULT '{
    "video": "video",
    "image": "image",
    "audio": "audio",
    "text": "text",
    "font": "font",
    "speed": "speed"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(project_id, user_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_project_naming_patterns_project_user
ON project_naming_patterns(project_id, user_id);

-- Enable Row Level Security
ALTER TABLE project_naming_patterns ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policy - Allow authenticated users to manage their patterns
CREATE POLICY "Users can manage their naming patterns" ON project_naming_patterns
  FOR ALL USING (user_id = auth.uid());

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_naming_patterns_updated_at
  BEFORE UPDATE ON project_naming_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();