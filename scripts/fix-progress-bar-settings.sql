-- Fix progress bar settings in Supabase
-- This migration updates existing users to have the correct progress bar settings

-- Update users who have the old fastStartDuration of 3 to 0
UPDATE users 
SET progress_bar_settings = jsonb_set(
    progress_bar_settings,
    '{fastStartDuration}',
    '0'::jsonb
)
WHERE progress_bar_settings->>'fastStartDuration' = '3'
AND progress_bar_settings ? 'fastStartDuration';

-- Update users who have the old fastStartProgress to match new defaults
UPDATE users 
SET progress_bar_settings = jsonb_set(
    progress_bar_settings,
    '{fastStartProgress}',
    '0.1'::jsonb
)
WHERE progress_bar_settings ? 'fastStartProgress';

-- Ensure all users have isVisible set to true for progress bar
UPDATE users 
SET progress_bar_settings = jsonb_set(
    progress_bar_settings,
    '{isVisible}',
    'true'::jsonb
)
WHERE progress_bar_settings ? 'isVisible';

-- Remove any custom start time fields that might exist
UPDATE users 
SET progress_bar_settings = progress_bar_settings - 'customStartTime' - 'useCustomStartTime'
WHERE progress_bar_settings ? 'customStartTime' OR progress_bar_settings ? 'useCustomStartTime';

-- Update users who don't have progress bar settings at all
UPDATE users
SET progress_bar_settings = '{
    "backgroundColor": "rgba(0, 0, 0, 0.3)",
    "progressColor": "#ff6b35",
    "scrubberColor": "#ffffff", 
    "height": 16,
    "scrubberSize": 18, 
    "borderRadius": 4, 
    "opacity": 1, 
    "shadowBlur": 4, 
    "shadowColor": "rgba(0, 0, 0, 0.4)", 
    "isVisible": true,
    "useDeceptiveProgress": false,
    "fastStartDuration": 0,
    "fastStartProgress": 0.1
}'::jsonb
WHERE progress_bar_settings IS NULL;

-- Ensure ALL users have complete progress bar settings with all visual properties
-- This will add missing properties to existing users who might have incomplete settings
UPDATE users
SET progress_bar_settings = COALESCE(progress_bar_settings, '{}'::jsonb) || '{
    "backgroundColor": "rgba(0, 0, 0, 0.3)",
    "progressColor": "#ff6b35",
    "scrubberColor": "#ffffff", 
    "height": 16,
    "scrubberSize": 18, 
    "borderRadius": 4, 
    "opacity": 1, 
    "shadowBlur": 4, 
    "shadowColor": "rgba(0, 0, 0, 0.4)", 
    "isVisible": true,
    "useDeceptiveProgress": false,
    "fastStartDuration": 0,
    "fastStartProgress": 0.1
}'::jsonb
WHERE NOT (progress_bar_settings ? 'backgroundColor' 
           AND progress_bar_settings ? 'progressColor' 
           AND progress_bar_settings ? 'scrubberColor' 
           AND progress_bar_settings ? 'height' 
           AND progress_bar_settings ? 'scrubberSize' 
           AND progress_bar_settings ? 'borderRadius' 
           AND progress_bar_settings ? 'opacity' 
           AND progress_bar_settings ? 'shadowBlur' 
           AND progress_bar_settings ? 'shadowColor');

-- Show the results
SELECT
    COUNT(*) as total_users,
    COUNT(progress_bar_settings) as users_with_settings,
    COUNT(CASE WHEN progress_bar_settings->>'fastStartDuration' = '0' THEN 1 END) as users_with_zero_start,                                                     
    COUNT(CASE WHEN progress_bar_settings->>'isVisible' = 'true' THEN 1 END) as users_with_visible_progress_bar,                                                
    COUNT(CASE WHEN progress_bar_settings->>'useDeceptiveProgress' = 'false' THEN 1 END) as users_with_deceptive_disabled,
    COUNT(CASE WHEN progress_bar_settings ? 'backgroundColor' THEN 1 END) as users_with_background_color,
    COUNT(CASE WHEN progress_bar_settings ? 'progressColor' THEN 1 END) as users_with_progress_color,
    COUNT(CASE WHEN progress_bar_settings ? 'scrubberColor' THEN 1 END) as users_with_scrubber_color,
    COUNT(CASE WHEN progress_bar_settings ? 'height' THEN 1 END) as users_with_height,
    COUNT(CASE WHEN progress_bar_settings ? 'scrubberSize' THEN 1 END) as users_with_scrubber_size
FROM users;
