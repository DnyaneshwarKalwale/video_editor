# Database Setup Guide

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# MongoDB Configuration
MONGODB_URL=mongodb+srv://ignite_editor:ignite@wantace.lkdz0v1.mongodb.net/

# Cloudinary Configuration
CLOUD_NAME=dpg3rdtsd
CLOUDINARY_API_KEY=216857453338732
CLOUDINARY_API_SECRET=ySPzWEszlZfgmhBnnaHNoQt3qEQ
CLOUDINARY_URL=cloudinary://216857453338732:ySPzWEszlZfgmhBnnaHNoQt3qEQ@dpg3rdtsd

# Existing APIs
PEXELS_API_KEY=""
OPENAI_API_KEY=""
```

## Database Models

### 1. User
- Stores user information and preferences
- Links to all user's projects and assets

### 2. Project
- Stores project metadata and track items
- Contains the complete project state

### 3. Asset
- Stores uploaded media files (videos, images, audio)
- Links to Cloudinary URLs for file storage

### 4. Variation
- Stores AI-generated text variations
- Links to original text elements

### 5. Export
- Stores rendered video exports
- Contains Cloudinary URLs for final videos

## API Endpoints

### File Upload
- `POST /api/upload` - Upload files to Cloudinary and save metadata

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects?userId=xxx` - Get user's projects

### Variations
- `POST /api/variations` - Save AI-generated variations
- `GET /api/variations?userId=xxx&projectId=xxx` - Get variations

### Render Video
- `POST /api/render-video` - Render video with Remotion
- `GET /api/render-video?jobId=xxx` - Check render status

## Usage Flow

1. **User Uploads File**
   - File uploaded to Cloudinary
   - Metadata saved to Asset collection
   - Cloudinary URL returned for use in editor

2. **User Creates Project**
   - Project data saved to Project collection
   - Track items stored as JSON

3. **AI Generates Variations**
   - Text variations saved to Variation collection
   - No video files created until export

4. **User Exports Video**
   - Remotion renders video locally
   - Final video uploaded to Cloudinary
   - Export record saved to database
   - Cloudinary URL returned for download

## Benefits

- **Persistent Storage**: All data saved to MongoDB
- **Cloud Storage**: Files stored in Cloudinary CDN
- **Scalable**: Can handle multiple users and projects
- **Cost Effective**: Only store what users actually save
- **Fast Access**: Cloudinary CDN for quick file delivery
