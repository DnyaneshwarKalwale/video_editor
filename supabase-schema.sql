-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  password TEXT,
  google_id TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  admin_role TEXT CHECK (admin_role IN ('owner', 'boss', 'developer')),
  company_domain TEXT NOT NULL,
  preferences JSONB DEFAULT '{"defaultPlatform": "instagram-reel", "theme": "light"}'::jsonb,
  progress_bar_settings JSONB DEFAULT '{"backgroundColor": "rgba(0, 0, 0, 0.3)", "progressColor": "#ff6b35", "scrubberColor": "#ffffff", "height": 16, "scrubberSize": 18, "borderRadius": 4, "opacity": 1, "shadowBlur": 4, "shadowColor": "rgba(0, 0, 0, 0.4)", "isVisible": true, "useDeceptiveProgress": false, "fastStartDuration": 3, "fastStartProgress": 0.1}'::jsonb,
  email_verified TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  added_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram-reel', 'instagram-post', 'youtube-landscape', 'facebook-feed', 'tiktok')),
  aspect_ratio TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  track_items JSONB DEFAULT '[]'::jsonb,
  size JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  assets JSONB DEFAULT '[]'::jsonb,
  text_variations JSONB DEFAULT '[]'::jsonb,
  video_variations JSONB DEFAULT '[]'::jsonb,
  font_variations JSONB DEFAULT '[]'::jsonb,
  speed_variations JSONB DEFAULT '[]'::jsonb,
  thumbnail TEXT,
  duration INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  exports JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_path TEXT NOT NULL,
  is_variation BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  original_element_id TEXT NOT NULL,
  original_text TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  ai_model TEXT DEFAULT 'gpt-4',
  confidence DECIMAL(3,2) DEFAULT 0.8,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  variation_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  supabase_url TEXT,
  supabase_path TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  company_domain TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  project_id TEXT,
  project_name TEXT,
  video_duration INTEGER,
  cost DECIMAL(10,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_fonts (
  id TEXT PRIMARY KEY,
  family TEXT NOT NULL,
  full_name TEXT NOT NULL,
  post_script_name TEXT NOT NULL,
  preview TEXT,
  style TEXT DEFAULT 'normal',
  url TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  user_id TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT TRUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company_domain ON users(company_domain);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_variations_user_project ON variations(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_project ON exports(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_domain ON user_activities(user_id, company_domain);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_fonts_user_id ON custom_fonts(user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('fonts', 'fonts', true) ON CONFLICT DO NOTHING;

-- Create RLS policies for storage buckets
-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own files
CREATE POLICY "Allow users to read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own files
CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Similar policies for exports bucket
CREATE POLICY "Allow authenticated export uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read own exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Similar policies for fonts bucket
CREATE POLICY "Allow authenticated font uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fonts' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read own fonts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'fonts' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

