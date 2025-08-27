import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Get the pathname
    const path = req.nextUrl.pathname;
    
    // Get user session
    const token = req.nextauth.token;
    
    // Public routes that don't need authentication
    const publicRoutes = ['/login', '/terms', '/privacy', '/error', '/not-found'];
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
    
    // If it's a public route, allow access
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    // If user is not authenticated and trying to access protected route
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check admin routes
    const adminRoutes = ['/admin'];
    const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
    
    if (isAdminRoute && !token.isAdmin) {
      // Redirect non-admin users to projects page
      const projectsUrl = new URL('/projects', req.url);
      return NextResponse.redirect(projectsUrl);
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access to public routes even without token
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
