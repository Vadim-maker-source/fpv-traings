"use server";

import { prisma } from "@/app/lib/prisma";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { sendNewUserVerificationEmail } from "../email";

interface CreateUserParams {
  fullname: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  role: Role;
  passport?: string | null;
  bio?: string | null;
  medicalDocuments?: string | null;
}

export async function createUser(data: CreateUserParams) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { error: "Пользователь с таким email уже существует" };
    }

    const hashedPassword = await hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        fullname: data.fullname,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        birthDate: data.birthDate || null,
        role: data.role,
        passport: data.role === Role.TEACHER ? data.passport || null : null,
        bio: data.role === Role.TEACHER ? data.bio || null : null,
        medicalDocuments: data.role === Role.STUDENT ? data.medicalDocuments || null : null,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    if (user.role === Role.TEACHER) {
      const adminEmail = process.env.GMAIL_USER!
      const verificationLink = `${process.env.NEXTAUTH_URL}/admin/verification-requests`;
  
      sendNewUserVerificationEmail(adminEmail, user.fullname, user.email, "Тренер", verificationLink).catch(err => console.error("Failed to send admin notification:", err));
    }

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Ошибка при создании пользователя" };
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        fullname: true,
        email: true,
        phone: true,
        birthDate: true,
        role: true,
        isChecked: true,
        bio: true,
        passport: true,
        medicalDocuments: true,
        createdAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            fullname: true,
            email: true,
            bio: true,
            isChecked: true,
          },
        },
        students: {
          select: {
            id: true,
            fullname: true,
            email: true,
            medicalDocuments: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }
    
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Get user by ID error:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullname: true,
        email: true,
        phone: true,
        birthDate: true,
        role: true,
        isChecked: true,
        bio: true,
        passport: true,
        medicalDocuments: true,
        createdAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            fullname: true,
            email: true,
            bio: true,
            isChecked: true,
          },
        },
        students: {
          select: {
            id: true,
            fullname: true,
            email: true,
            medicalDocuments: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Необходимо авторизоваться");
  }
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("Недостаточно прав");
  }
  return user;
}