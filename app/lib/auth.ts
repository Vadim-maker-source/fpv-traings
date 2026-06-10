import { prisma } from "@/app/lib/prisma";
import { compare } from "bcryptjs";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "@prisma/client";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);
        
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullname,
          role: user.role,
          phone: user.phone,
          birthDate: user.birthDate,
          bio: user.bio,
          isChecked: user.role === "TEACHER" ? user.isChecked : true,
        };
      },
    }),
  ],
  
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.phone = user.phone;
        token.birthDate = user.birthDate;
        token.bio = user.bio;
        token.isChecked = user.role === "TEACHER" ? user.isChecked : true;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.fullName = token.name as string;
        session.user.email = token.email as string;
        session.user.phone = token.phone as string | null;
        session.user.birthDate = token.birthDate as string | null;
        session.user.bio = token.bio as string | null;
        session.user.isChecked = token.isChecked;
      }
      return session;
    },
  },
};