-- Create table for storing custom naming templates
CREATE TABLE IF NOT EXISTS project_naming_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL, -- Custom ID for the template (e.g., 'default', 'custom-123')
  name TEXT NOT NULL, -- Display name for the template
  template TEXT NOT NULL, -- The actual template string with placeholders
  description TEXT, -- Description of what the template does
  is_default BOOLEAN DEFAULT FALSE, -- Whether this is a default template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one template per project per user
  UNIQUE(project_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_naming_templates_project_user
ON project_naming_templates(project_id, user_id);

-- Enable Row Level Security
ALTER TABLE project_naming_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their naming templates" ON project_naming_templates
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE id = user_id
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_naming_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_naming_templates_updated_at
  BEFORE UPDATE ON project_naming_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_project_naming_templates_updated_at();

-- Add comment to document the table
COMMENT ON TABLE project_naming_templates IS 'Stores custom naming templates per project. Templates use placeholders like {ProjectName}, {Headline}, etc.';

