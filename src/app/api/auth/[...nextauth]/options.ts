import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { baseUrl } from "@/utils/metadata";
import { supabase, TABLES } from "@/lib/supabase";
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

        const email = credentials.email;
        const domain = email.split('@')[1];

        // Check if it's an admin domain
        if (ADMIN_DOMAINS.includes(domain)) {
          const { data: user, error } = await supabase
            .from(TABLES.USERS)
            .select('id, email, name, image, password, email_verified')
            .eq('email', email)
            .single();

          if (error || !user || !user.password) {
            return null;
          }

          // Check if email is verified (admin users also need verification)
          if (!user.email_verified) {
            return null; // Email not verified
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: true,
            companyDomain: domain,
          };
        }

        // Check if it's an approved company domain
        const { data: approvedDomain, error: domainError } = await supabase
          .from(TABLES.COMPANY_DOMAINS)
          .select('id')
          .eq('domain', domain)
          .eq('is_active', true)
          .single();
        
        if (domainError || !approvedDomain) {
          return null; // Domain not approved
        }

        const { data: user, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('id, email, name, image, password, email_verified')
          .eq('email', email)
          .single();

        if (userError || !user || !user.password) {
          return null;
        }

        // Check if email is verified
        if (!user.email_verified) {
          return null; // Email not verified
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: false,
          companyDomain: domain,
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
          const { data: existingUser, error: userError } = await supabase
            .from(TABLES.USERS)
            .select('id')
            .eq('email', email)
            .single();
          
          if (userError && userError.code === 'PGRST116') { // No user found
            // Create new admin user
            const { data: newUser, error: createError } = await supabase
              .from(TABLES.USERS)
              .insert({
                email,
                name: user.name || email.split('@')[0],
                image: user.image,
                google_id: user.id,
                company_domain: domain,
                is_admin: true,
                admin_role: 'developer', // Default role
                email_verified: new Date().toISOString(), // Google users are already verified
              })
              .select('id')
              .single();

            if (createError) {
              console.error('Failed to create admin user:', createError);
              return false;
            }
          }
          
          // For Google users, email is already verified by Google
          // Set admin flag for redirect
          (user as any).isAdmin = true;
          (user as any).companyDomain = domain;
          return true;
        }
        
        // Check if it's an approved company domain
        const { data: approvedDomain, error: domainError } = await supabase
          .from(TABLES.COMPANY_DOMAINS)
          .select('id')
          .eq('domain', domain)
          .eq('is_active', true)
          .single();
        
        if (domainError || !approvedDomain) {
          return false; // Domain not approved
        }
        
        // Check if user exists, if not create them
        const { data: existingUser, error: userError } = await supabase
          .from(TABLES.USERS)
          .select('id')
          .eq('email', email)
          .single();
        
        if (userError && userError.code === 'PGRST116') { // No user found
          // Create new company user (Google users are already verified)
          const { data: newUser, error: createError } = await supabase
            .from(TABLES.USERS)
            .insert({
              email,
              name: user.name || email.split('@')[0],
              image: user.image,
              google_id: user.id,
              company_domain: domain,
              is_admin: false,
              email_verified: new Date().toISOString(), // Google users are already verified
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Failed to create company user:', createError);
            return false;
          }
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
      
      // For Google login, fetch the latest user data from database
      if (account?.provider === 'google' && token.email) {
        const { data: dbUser, error } = await supabase
          .from(TABLES.USERS)
          .select('id, is_admin, company_domain')
          .eq('email', token.email)
          .single();

        if (!error && dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.is_admin || false;
          token.companyDomain = dbUser.company_domain || '';
        }
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
    async redirect({ url, baseUrl }) {
      // Redirect admin users to admin dashboard
      if (url === `${baseUrl}/` || url === baseUrl) {
        // Check if user is admin by looking at the token
        // This will be handled by the client-side redirect logic
        return url;
      }
      return url;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Set the NEXTAUTH_URL dynamically based on your baseUrl
if (typeof window === 'undefined') {
  process.env.NEXTAUTH_URL = baseUrl.toString();
}

export default authOptions;
