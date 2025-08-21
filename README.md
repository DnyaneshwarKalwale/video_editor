# �� Video Editor Pro

A powerful, cloud-based video editing platform built with Next.js, Remotion, and AI-powered features. Create stunning videos with professional-grade tools, AI text variations, and seamless cloud rendering.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14">
  <img src="https://img.shields.io/badge/Remotion-4.0-blue?style=for-the-badge&logo=remotion" alt="Remotion 4.0">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5.0">
  <img src="https://img.shields.io/badge/MongoDB-7.0-green?style=for-the-badge&logo=mongodb" alt="MongoDB 7.0">
</p>

## ✨ Features

### 🎥 **Professional Video Editing**
- **Multi-platform Support** - Instagram Reels, YouTube, Facebook, TikTok, and more
- **Drag & Drop Interface** - Intuitive file upload and timeline management
- **Real-time Preview** - See changes instantly with live preview
- **Timeline Editing** - Precise control over video, audio, and text elements
- **Layer Management** - Organize and arrange multiple elements

### 🤖 **AI-Powered Features**
- **Smart Text Variations** - Generate multiple text variations with AI
- **Language Translation** - Create variations in different languages
- **Auto-enhancement** - AI-powered copywriting for better engagement
- **Pattern Recognition** - Intelligent suggestions for content optimization

### ☁️ **Cloud Infrastructure**
- **AWS Lambda Rendering** - Scalable cloud video rendering
- **Cloudinary Storage** - Secure media file storage and CDN
- **MongoDB Database** - Persistent project and user data storage
- **Real-time Collaboration** - Share and collaborate on projects

### 🎨 **Design & Customization**
- **Multiple Aspect Ratios** - 9:16, 16:9, 1:1, 1.91:1, and more
- **Professional Templates** - Pre-built templates for quick starts
- **Custom Branding** - Add logos, colors, and brand elements
- **Typography Tools** - Rich text editing with custom fonts

### 🔐 **Security & Authentication**
- **Google OAuth** - Secure social login integration
- **Email/Password** - Traditional authentication system
- **User-specific Content** - Isolated user data and projects
- **Protected Routes** - Secure access control

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB Atlas account
- AWS account (for Lambda rendering)
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/video-editor-pro.git
cd video-editor-pro
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS Lambda (for video rendering)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key
```

4. **Deploy Lambda function**
```bash
pnpm lambda:deploy
```

5. **Start the development server**
```bash
pnpm dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### **1. Project Creation**
- Users can create new video projects
- Choose from multiple platform presets (Instagram, YouTube, etc.)
- Set custom dimensions and aspect ratios

### **2. Media Upload**
- Drag & drop files directly onto the canvas
- Support for video, image, and audio files
- Automatic upload to Cloudinary with user-specific folders
- File size limit: 50MB per file

### **3. Timeline Editing**
- Add elements to the timeline with precise timing
- Layer management for complex compositions
- Real-time preview of changes
- Undo/redo functionality

### **4. AI Text Variations**
- Select any text element on the timeline
- Generate multiple variations using AI
- Choose from different styles and languages
- Apply variations instantly to preview

### **5. Cloud Rendering**
- Export videos using AWS Lambda
- Scalable rendering with up to 50 concurrent jobs
- Progress tracking and download management
- Multiple export formats (MP4, JSON)

### **6. Project Management**
- Save projects to MongoDB
- User-specific project isolation
- Version control and variations
- Share and collaborate features

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Remotion** - Programmatic video editing
- **Zustand** - State management
- **Lucide React** - Icon library

### **Backend**
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database with Mongoose
- **NextAuth.js** - Authentication system
- **Cloudinary** - Media storage and CDN
- **AWS Lambda** - Serverless video rendering

### **AI & ML**
- **OpenAI GPT-4** - Text variation generation
- **Custom prompts** - Optimized for marketing content
- **Language processing** - Multi-language support

### **Infrastructure**
- **AWS Lambda** - Scalable video rendering
- **Cloudinary** - Media management
- **MongoDB Atlas** - Cloud database
- **Vercel** - Deployment platform

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── upload/        # File upload handling
│   │   ├── assets/        # Asset management
│   │   └── render-lambda/ # Video rendering
│   ├── login/             # Authentication pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── auth/             # Authentication components
├── features/             # Feature modules
│   └── editor/           # Video editor features
│       ├── components/   # Editor components
│       ├── hooks/        # Custom hooks
│       ├── store/        # State management
│       ├── timeline/     # Timeline functionality
│       ├── variations/   # AI variations
│       └── utils/        # Utility functions
├── lib/                  # Library configurations
├── models/               # MongoDB models
└── types/                # TypeScript type definitions
```

## 🎨 Key Features Explained

### **Multi-Platform Support**
The editor supports various social media platforms with optimized presets:
- **Instagram Reels/Stories** (9:16 - 1080x1920)
- **Instagram Posts** (1:1 - 1080x1080)
- **YouTube Videos** (16:9 - 1920x1080)
- **YouTube Shorts** (9:16 - 1080x1920)
- **Facebook Feed** (1.91:1 - 1200x628)
- **TikTok** (9:16 - 1080x1920)

### **AI Text Variations**
Generate engaging text variations using AI:
- **Auto-generation** - Create variations based on original text
- **Language variations** - Translate to different languages
- **Style variations** - Different tones and approaches
- **Marketing optimization** - Copywriting principles applied

### **Cloud Rendering**
Professional-grade video rendering:
- **AWS Lambda** - Scalable serverless rendering
- **Concurrent processing** - Up to 50 simultaneous renders
- **Progress tracking** - Real-time render progress
- **Download management** - Organized file downloads

### **User Management**
Complete user system with:
- **Google OAuth** - One-click social login
- **Email registration** - Traditional signup
- **User profiles** - Personal settings and preferences
- **Project isolation** - Secure user-specific content

## 🔧 Configuration

### **AWS Lambda Setup**
1. Create AWS account and configure credentials
2. Deploy Remotion Lambda function:
```bash
pnpm lambda:deploy
```
3. Configure concurrency limits in AWS console

### **Cloudinary Setup**
1. Create Cloudinary account
2. Get API credentials from dashboard
3. Configure environment variables
4. Set up upload presets for different file types

### **MongoDB Setup**
1. Create MongoDB Atlas cluster
2. Configure database access
3. Set up user authentication
4. Configure connection string

## 🚀 Deployment

### **Vercel Deployment**
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### **Environment Variables**
Ensure all required environment variables are set in production:
- Database connection strings
- API keys for external services
- Authentication secrets
- AWS credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.example.com](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/video-editor-pro/issues)
- **Discord**: [Join our community](https://discord.gg/your-invite)

## 🙏 Acknowledgments

- **Remotion** - For the amazing video editing framework
- **Next.js** - For the powerful React framework
- **OpenAI** - For AI-powered text generation
- **Cloudinary** - For media management solutions
- **AWS** - For scalable cloud infrastructure

---

<p align="center">
  Made with ❤️ by the Video Editor Pro team
</p>
