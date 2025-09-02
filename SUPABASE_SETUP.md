# 🚀 Supabase Setup Guide

## Quick Setup Steps

### 1. Set Up Supabase Database

1. **Go to Supabase Dashboard:**
   - Visit: https://xwhezwlbxtkirkroofer.supabase.co

2. **Create Database Schema:**
   - Click "SQL Editor" in the sidebar
   - Copy the entire content from `supabase-schema.sql`
   - Paste and click "Run"

3. **Verify Tables:**
   - Go to "Table Editor" in the sidebar
   - You should see: `users`, `projects`, `assets`, `variations`, `exports`, `company_domains`, `user_activities`, `custom_fonts`

### 2. Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://xwhezwlbxtkirkroofer.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# AWS Lambda (for video rendering)
REMOTION_AWS_ACCESS_KEY_ID=your_aws_access_key_here
REMOTION_AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Other APIs
PEXELS_API_KEY=your_pexels_api_key_here
```

### 3. Get Your Supabase Anon Key

1. Go to: https://xwhezwlbxtkirkroofer.supabase.co
2. Click "Settings" → "API"
3. Copy the "anon public" key
4. Replace `your_supabase_anon_key_here` in `.env.local`

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Start the Application

```bash
pnpm dev
```

## ✅ What's Ready

- ✅ All API endpoints migrated to Supabase
- ✅ File uploads to Supabase Storage
- ✅ Database schema ready
- ✅ Authentication with NextAuth + Supabase
- ✅ Admin dashboard with analytics
- ✅ Custom font uploads
- ✅ Video rendering (AWS Lambda unchanged)

## 🎯 Your Application is Ready!

Your video editor will now work with Supabase from the start. All data will be stored in Supabase PostgreSQL and files in Supabase Storage.

**No migration needed - everything works fresh!** 🚀
