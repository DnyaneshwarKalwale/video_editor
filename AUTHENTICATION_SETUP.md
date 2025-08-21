# 🔐 Authentication Setup Guide

## ✅ What's Already Implemented

Your video editor now has a complete authentication system with:

- **Login Page** (`/login`) - Modern, responsive design
- **Google OAuth** - Sign in with Google account
- **Email/Password** - Traditional login (currently set to admin@example.com / password)
- **Protected Routes** - All video editor routes require authentication
- **User Menu** - Profile dropdown with sign out
- **Session Management** - Automatic session handling

## 🚀 Quick Start

### 1. Set Environment Variables

Create a `.env.local` file in your project root:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your_super_secret_key_here_make_it_long_and_random
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional - for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Your existing variables
MONGODB_URL=your_mongodb_url_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Set Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your `.env.local`

### 4. Test the Authentication

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Visit `http://localhost:3000`
   - You'll be redirected to `/login` if not authenticated

3. Try logging in:
   - **Email/Password**: `admin@example.com` / `password`
   - **Google**: Click "Sign in with Google" (if configured)

## 🔧 Customization

### Change Default Credentials

Edit `src/app/api/auth/[...nextauth]/options.ts`:

```typescript
async authorize(credentials) {
  // Replace this with your actual user validation
  if (credentials?.email === "your-email@example.com" && credentials?.password === "your-password") {
    return {
      id: "1",
      email: credentials.email,
      name: "Your Name",
    };
  }
  return null;
}
```

### Add Database Integration

Replace the hardcoded credentials with database lookup:

```typescript
async authorize(credentials) {
  // Connect to your database
  const user = await db.user.findUnique({
    where: { email: credentials?.email }
  });
  
  if (user && await bcrypt.compare(credentials?.password, user.password)) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
  return null;
}
```

### Customize Redirect URLs

Update the redirect URLs in:
- `src/components/auth/login-form.tsx`
- `src/components/auth/google-signin.tsx`

```typescript
window.location.href = "/your-custom-dashboard";
```

## 🛡️ Protected Routes

The following routes now require authentication:
- `/edit/*` - Video editor
- `/api/render-lambda/*` - Lambda rendering
- `/api/render-video/*` - Local rendering
- `/api/upload/*` - File uploads
- `/api/assets/*` - Asset management

## 🎨 UI Components Used

The authentication system uses your existing UI components:
- `Button` - For login buttons
- `Input` - For email/password fields
- `Card` - For the login form container
- `Avatar` - For user profile pictures
- `DropdownMenu` - For user menu

## 🔄 Session Management

- Sessions are automatically managed by NextAuth
- Users stay logged in across browser sessions
- Automatic redirect to login for protected routes
- Sign out functionality in user menu

## 🚨 Security Notes

1. **Never commit `.env.local`** to version control
2. **Use strong NEXTAUTH_SECRET** in production
3. **Enable HTTPS** in production
4. **Implement proper password hashing** for database users
5. **Add rate limiting** for login attempts
6. **Consider 2FA** for additional security

## 🐛 Troubleshooting

### "Invalid credentials" error
- Check your credentials in `options.ts`
- Ensure environment variables are set correctly

### Google OAuth not working
- Verify Google Client ID and Secret
- Check redirect URIs in Google Console
- Ensure Google+ API is enabled

### Session not persisting
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain

## 📝 Next Steps

1. **Database Integration** - Connect to your MongoDB for user management
2. **User Registration** - Add sign-up functionality
3. **Password Reset** - Implement forgot password flow
4. **Email Verification** - Add email confirmation
5. **Profile Management** - Allow users to update their profile
6. **Role-Based Access** - Add admin/user roles
7. **Audit Logging** - Track user actions

Your authentication system is now ready! 🎉
