-- Fix the project_naming_patterns table to work with NextAuth
-- Remove the foreign key constraint that's causing the issue

-- Drop the existing foreign key constraint
ALTER TABLE project_naming_patterns 
DROP CONSTRAINT IF EXISTS project_naming_patterns_user_id_fkey;

-- Change user_id to TEXT to match NextAuth user IDs
ALTER TABLE project_naming_patterns 
ALTER COLUMN user_id TYPE TEXT;

-- Update the RLS policy to work with TEXT user_id
DROP POLICY IF EXISTS "Users can manage their naming patterns" ON project_naming_patterns;

-- Create a new RLS policy that works with NextAuth user IDs
CREATE POLICY "Users can manage their naming patterns" ON project_naming_patterns
  FOR ALL USING (user_id = auth.uid()::text OR user_id = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Alternative simpler policy (if the above doesn't work)
-- CREATE POLICY "Users can manage their naming patterns" ON project_naming_patterns
--   FOR ALL USING (true); -- Temporarily allow all for testing

-- Add a comment to document the change
COMMENT ON TABLE project_naming_patterns IS 'Stores naming patterns per project. user_id is from NextAuth, not Supabase auth.';
