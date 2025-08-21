import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/edit/:path*",
    "/api/render-lambda/:path*",
    "/api/render-video/:path*",
    "/api/upload/:path*",
    "/api/assets/:path*",
  ],
};
