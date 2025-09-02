# 🚀 Supabase Migration Guide

## Overview
This guide will help you migrate from MongoDB + Cloudinary to Supabase for your video editor application.

## Prerequisites
1. Supabase account and project
2. Your Supabase project URL and API key
3. Access to your current MongoDB database for data migration

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 1.2 Run Database Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the SQL to create all tables and policies

### 1.3 Create Storage Buckets
The schema will automatically create these buckets:
- `uploads` - for user uploaded files
- `exports` - for rendered videos
- `fonts` - for custom fonts

## Step 2: Update Environment Variables

Replace your `.env.local` file with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# AWS Lambda (for video rendering)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Other APIs
PEXELS_API_KEY=your_pexels_api_key_here
```

## Step 3: Install Dependencies

```bash
pnpm add @supabase/supabase-js
```

## Step 4: Data Migration (Optional)

If you have existing data in MongoDB, you can migrate it:

### 4.1 Export MongoDB Data
```bash
# Export users
mongoexport --uri="your_mongodb_uri" --collection=users --out=users.json

# Export projects
mongoexport --uri="your_mongodb_uri" --collection=projects --out=projects.json

# Export other collections as needed
```

### 4.2 Import to Supabase
1. Convert JSON to CSV format
2. Use Supabase dashboard to import data
3. Or use the Supabase CLI for bulk imports

### 4.3 Migrate Files from Cloudinary
1. Download files from Cloudinary
2. Upload to Supabase Storage using the dashboard
3. Update database records with new Supabase URLs

## Step 5: Test the Migration

### 5.1 Test Authentication
1. Try logging in with existing credentials
2. Test Google OAuth
3. Verify admin access works

### 5.2 Test File Uploads
1. Upload a test image/video
2. Verify it appears in Supabase Storage
3. Check the database record is created

### 5.3 Test Project Creation
1. Create a new project
2. Verify it saves to Supabase
3. Test project loading

## Step 6: Update Frontend (if needed)

The frontend code should work without changes since we maintained the same API structure. However, check:

1. **File URLs**: Ensure frontend can access Supabase Storage URLs
2. **Authentication**: Verify session handling works
3. **Error Handling**: Test error scenarios

## Step 7: Cleanup

### 7.1 Remove Old Dependencies
```bash
pnpm remove mongoose cloudinary
```

### 7.2 Remove Old Files
- Delete `src/lib/database.ts`
- Delete `src/lib/cloudinary.ts`
- Delete `src/models/` directory
- Remove MongoDB connection code

### 7.3 Update Documentation
- Update README.md
- Update API documentation
- Update deployment guides

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase RLS policies
   - Verify user IDs match between systems
   - Check NextAuth configuration

2. **File Upload Failures**
   - Verify storage bucket permissions
   - Check file size limits
   - Ensure proper file paths

3. **Database Connection Issues**
   - Verify Supabase URL and key
   - Check network connectivity
   - Verify table names match

### Performance Optimization

1. **Database Indexes**
   - The schema includes basic indexes
   - Add more based on your query patterns

2. **Storage Optimization**
   - Use CDN for frequently accessed files
   - Implement file compression
   - Set appropriate cache headers

## Rollback Plan

If you need to rollback:

1. **Keep MongoDB running** during initial migration
2. **Maintain Cloudinary files** until migration is complete
3. **Use feature flags** to switch between systems
4. **Have backup scripts** ready

## Support

For issues with:
- **Supabase**: Check their documentation and community
- **Migration**: Review this guide and check logs
- **Application**: Check browser console and server logs

## Next Steps

After successful migration:

1. **Monitor performance** and optimize as needed
2. **Set up backups** for Supabase
3. **Configure monitoring** and alerts
4. **Update CI/CD** pipelines
5. **Train team** on new system

---

**Note**: This migration maintains API compatibility, so your frontend should work without changes. The main differences are internal - using Supabase instead of MongoDB/Cloudinary.
