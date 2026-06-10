import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        isChecked: false,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        phone: true,
        passport: true,
        bio: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ teachers });

  } catch (error) {
    console.error("Get pending teachers error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}