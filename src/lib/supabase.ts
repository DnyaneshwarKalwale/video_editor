import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xwhezwlbxtkirkroofer.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  throw new Error('Please define the SUPABASE_KEY environment variable inside .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Service role client for server-side operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey)

// Database table names
export const TABLES = {
  USERS: 'users',
  PROJECTS: 'projects',
  ASSETS: 'assets',
  VARIATIONS: 'variations',
  EXPORTS: 'exports',
  COMPANY_DOMAINS: 'company_domains',
  USER_ACTIVITIES: 'user_activities',
  CUSTOM_FONTS: 'custom_fonts',
  OTP_CODES: 'otp_codes',
} as const

// Storage bucket names
export const BUCKETS = {
  UPLOADS: 'uploads',
  EXPORTS: 'exports',
  FONTS: 'fonts',
} as const
