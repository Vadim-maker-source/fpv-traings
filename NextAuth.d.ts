import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      fullName: string;
      phone: string | null;
      birthDate: string | null;
      bio: string | null;
      isChecked: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    phone: string | null;
    birthDate: string | null;
    bio: string | null;
    isChecked: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    phone: string | null;
    birthDate: string | null;
    bio: string | null;
    isChecked: boolean;
  }
}