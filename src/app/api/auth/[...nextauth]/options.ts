import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { baseUrl } from "@/utils/metadata";
import connectDB from "@/lib/database";
import User from "@/models/User";
import CompanyDomain from "@/models/CompanyDomain";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
      companyDomain?: string;
    };
  }
}

const ADMIN_DOMAINS = ['scalezmedia.com', 'wantace.com'];

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

        await connectDB();

        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin || false,
          companyDomain: user.companyDomain || '',
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;
        
        const domain = email.split('@')[1];
        
        // Check if it's an admin domain
        if (ADMIN_DOMAINS.includes(domain)) {
          // For admin domains, check if user exists, if not create them
          await connectDB();
          let existingUser = await User.findOne({ email });
          
          if (!existingUser) {
            // Create new admin user
            existingUser = await User.create({
              email,
              name: user.name || email.split('@')[0],
              image: user.image,
              googleId: user.id,
              companyDomain: domain,
              isAdmin: true,
              adminRole: 'developer', // Default role
            });
          }
          
          return true;
        }
        
        // Check if it's an approved company domain
        await connectDB();
        const approvedDomain = await CompanyDomain.findOne({ 
          domain: domain, 
          isActive: true 
        });
        
        if (!approvedDomain) {
          return false; // Domain not approved
        }
        
        // Check if user exists, if not create them
        let existingUser = await User.findOne({ email });
        
        if (!existingUser) {
          // Create new company user
          existingUser = await User.create({
            email,
            name: user.name || email.split('@')[0],
            image: user.image,
            googleId: user.id,
            companyDomain: domain,
            isAdmin: false,
          });
        }
        
        return true;
      }
      
      // For credentials provider, domain check is done in authorize callback
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin || false;
        token.companyDomain = (user as any).companyDomain || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.companyDomain = token.companyDomain as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Set the NEXTAUTH_URL dynamically based on your baseUrl
if (typeof window === 'undefined') {
  process.env.NEXTAUTH_URL = baseUrl.toString();
}

export default authOptions;
