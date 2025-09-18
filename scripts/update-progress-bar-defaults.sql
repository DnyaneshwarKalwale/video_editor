-- Update progress bar settings to new defaults
-- This migration updates existing users to have the new default values

-- Update users who have the old fastStartDuration of 3 to 0
UPDATE users 
SET progress_bar_settings = jsonb_set(
    progress_bar_settings,
    '{fastStartDuration}',
    '0'::jsonb
)
WHERE progress_bar_settings->>'fastStartDuration' = '3'
AND progress_bar_settings ? 'fastStartDuration';

-- Remove customStartTime and useCustomStartTime fields if they exist
UPDATE users 
SET progress_bar_settings = progress_bar_settings - 'customStartTime' - 'useCustomStartTime'
WHERE progress_bar_settings ? 'customStartTime' OR progress_bar_settings ? 'useCustomStartTime';

-- Show the result
SELECT 
    COUNT(*) as total_users,
    COUNT(progress_bar_settings) as users_with_settings,
    COUNT(CASE WHEN progress_bar_settings->>'fastStartDuration' = '0' THEN 1 END) as users_with_zero_start
FROM users;
