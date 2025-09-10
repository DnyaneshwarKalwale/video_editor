-- Add progress_bar_settings column to users table
-- This migration adds the progress bar settings column with default values

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'progress_bar_settings'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN progress_bar_settings JSONB DEFAULT '{
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
            "fastStartDuration": 3, 
            "fastStartProgress": 0.1
        }'::jsonb;
        
        RAISE NOTICE 'Added progress_bar_settings column to users table';
    ELSE
        RAISE NOTICE 'progress_bar_settings column already exists in users table';
    END IF;
END $$;

-- Update existing users to have the default settings if they don't have any
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
    "fastStartDuration": 3, 
    "fastStartProgress": 0.1
}'::jsonb
WHERE progress_bar_settings IS NULL;

-- Show the result
SELECT 
    COUNT(*) as total_users,
    COUNT(progress_bar_settings) as users_with_settings
FROM users;
