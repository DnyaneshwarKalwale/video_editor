import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { baseUrl } from "@/utils/metadata";
import { UserService } from "@/lib/user-service";

// Extend the session type to include user id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await UserService.findUserByEmail(credentials.email);
          
          if (!user) {
            return null;
          }

          // Verify password
          const isValidPassword = await UserService.verifyPassword(user, credentials.password);
          
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && profile) {
        try {
          const dbUser = await UserService.findOrCreateGoogleUser(profile);
          token.id = dbUser._id.toString();
        } catch (error) {
          console.error("Google OAuth error:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // For Google OAuth, ensure user is saved to database
      if (account?.provider === "google" && profile) {
        try {
          await UserService.findOrCreateGoogleUser(profile);
          return true;
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Set the NEXTAUTH_URL dynamically based on your baseUrl
if (typeof window === 'undefined') {
  process.env.NEXTAUTH_URL = baseUrl.toString();
}

export default authOptions;
