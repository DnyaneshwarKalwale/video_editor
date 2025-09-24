-- Fix the project_naming_patterns table to work with NextAuth
-- The issue is that the foreign key references auth.users instead of users table

-- Step 1: Drop the existing foreign key constraint (it references wrong table)
ALTER TABLE project_naming_patterns 
DROP CONSTRAINT IF EXISTS project_naming_patterns_user_id_fkey;

-- Step 2: Drop the existing policy FIRST (before changing column type)
DROP POLICY IF EXISTS "Users can manage their naming patterns" ON project_naming_patterns;

-- Step 3: Change user_id to UUID to match the users table primary key
ALTER TABLE project_naming_patterns 
ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Step 4: Add correct foreign key constraint to users table (not auth.users)
ALTER TABLE project_naming_patterns 
ADD CONSTRAINT project_naming_patterns_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Create proper RLS policy that works with the users table
CREATE POLICY "Users can manage their naming patterns" ON project_naming_patterns
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE id = user_id
    )
  );

-- Step 6: Add a comment to document the change
COMMENT ON TABLE project_naming_patterns IS 'Stores naming patterns per project. user_id references users table, not auth.users.';
