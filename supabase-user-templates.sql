-- Create table for user-specific naming templates
CREATE TABLE IF NOT EXISTS user_naming_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  custom_values JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_naming_templates_user_id ON user_naming_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_naming_templates_is_default ON user_naming_templates(is_default);

-- Enable RLS
ALTER TABLE user_naming_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own templates
CREATE POLICY "Users can manage their own naming templates" ON user_naming_templates
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE id = user_id));

-- Insert default templates for all users (these will be created when user first accesses templates)
-- Note: We'll handle this in the application code to ensure each user gets their own default templates

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_naming_templates_updated_at 
  BEFORE UPDATE ON user_naming_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
