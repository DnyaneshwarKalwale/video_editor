-- SQL Schema for User Naming Conventions
-- Add this to your Supabase database

-- Create table for storing user naming conventions
CREATE TABLE IF NOT EXISTS user_naming_conventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Element names configuration
    video_element_name VARCHAR(50) DEFAULT 'video',
    audio_element_name VARCHAR(50) DEFAULT 'audio', 
    text_element_name VARCHAR(50) DEFAULT 'text',
    image_element_name VARCHAR(50) DEFAULT 'image',
    font_element_name VARCHAR(50) DEFAULT 'font',
    speed_element_name VARCHAR(50) DEFAULT 'speed',
    
    -- Pattern configuration
    pattern_type VARCHAR(20) DEFAULT 'letters_upper' CHECK (pattern_type IN ('numbers', 'letters_upper', 'letters_lower', 'roman', 'custom')),
    custom_sequence TEXT[], -- Array for custom sequence like ['First', 'Second', 'Third']
    
    -- Platform configuration
    platform_enabled BOOLEAN DEFAULT true,
    platform_custom_name VARCHAR(100), -- Custom platform name like 'reel', 'tiktok', etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one naming convention per user
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_naming_conventions_user_id ON user_naming_conventions(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_naming_conventions_updated_at 
    BEFORE UPDATE ON user_naming_conventions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_naming_conventions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own naming conventions
CREATE POLICY "Users can view own naming conventions" ON user_naming_conventions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own naming conventions" ON user_naming_conventions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own naming conventions" ON user_naming_conventions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own naming conventions" ON user_naming_conventions
    FOR DELETE USING (auth.uid() = user_id);

-- Insert default naming convention for existing users (optional)
-- This will create default settings for users who don't have any yet
INSERT INTO user_naming_conventions (user_id, video_element_name, audio_element_name, text_element_name, image_element_name, font_element_name, speed_element_name, pattern_type, platform_enabled, platform_custom_name)
SELECT 
    id as user_id,
    'video' as video_element_name,
    'audio' as audio_element_name, 
    'text' as text_element_name,
    'image' as image_element_name,
    'font' as font_element_name,
    'speed' as speed_element_name,
    'letters_upper' as pattern_type,
    true as platform_enabled,
    NULL as platform_custom_name
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_naming_conventions)
ON CONFLICT (user_id) DO NOTHING;

-- Create a view for easy access to naming conventions with defaults
CREATE OR REPLACE VIEW user_naming_conventions_with_defaults AS
SELECT 
    COALESCE(unc.user_id, auth.uid()) as user_id,
    COALESCE(unc.video_element_name, 'video') as video_element_name,
    COALESCE(unc.audio_element_name, 'audio') as audio_element_name,
    COALESCE(unc.text_element_name, 'text') as text_element_name,
    COALESCE(unc.image_element_name, 'image') as image_element_name,
    COALESCE(unc.font_element_name, 'font') as font_element_name,
    COALESCE(unc.speed_element_name, 'speed') as speed_element_name,
    COALESCE(unc.pattern_type, 'letters_upper') as pattern_type,
    COALESCE(unc.custom_sequence, ARRAY[]::TEXT[]) as custom_sequence,
    COALESCE(unc.platform_enabled, true) as platform_enabled,
    unc.platform_custom_name,
    COALESCE(unc.created_at, NOW()) as created_at,
    COALESCE(unc.updated_at, NOW()) as updated_at
FROM user_naming_conventions unc
WHERE unc.user_id = auth.uid()
UNION ALL
SELECT 
    auth.uid() as user_id,
    'video' as video_element_name,
    'audio' as audio_element_name,
    'text' as text_element_name,
    'image' as image_element_name,
    'font' as font_element_name,
    'speed' as speed_element_name,
    'letters_upper' as pattern_type,
    ARRAY[]::TEXT[] as custom_sequence,
    true as platform_enabled,
    NULL as platform_custom_name,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM user_naming_conventions WHERE user_id = auth.uid()
)
LIMIT 1;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_naming_conventions TO authenticated;
GRANT SELECT ON user_naming_conventions_with_defaults TO authenticated;

-- Example queries for your application:

-- Get user's naming convention (with defaults if none exists)
-- SELECT * FROM user_naming_conventions_with_defaults WHERE user_id = auth.uid();

-- Update user's naming convention
-- INSERT INTO user_naming_conventions (user_id, video_element_name, audio_element_name, text_element_name, image_element_name, font_element_name, speed_element_name, pattern_type, platform_enabled, platform_custom_name)
-- VALUES (auth.uid(), 'clip', 'music', 'title', 'photo', 'typography', 'velocity', 'numbers', true, 'reel')
-- ON CONFLICT (user_id) 
-- DO UPDATE SET 
--     video_element_name = EXCLUDED.video_element_name,
--     audio_element_name = EXCLUDED.audio_element_name,
--     text_element_name = EXCLUDED.text_element_name,
--     image_element_name = EXCLUDED.image_element_name,
--     font_element_name = EXCLUDED.font_element_name,
--     speed_element_name = EXCLUDED.speed_element_name,
--     pattern_type = EXCLUDED.pattern_type,
--     platform_enabled = EXCLUDED.platform_enabled,
--     platform_custom_name = EXCLUDED.platform_custom_name,
--     updated_at = NOW();

-- Reset to defaults
-- DELETE FROM user_naming_conventions WHERE user_id = auth.uid();
