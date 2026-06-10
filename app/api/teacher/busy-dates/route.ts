import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id, role: Role.TEACHER },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Доступ только для тренеров" }, { status: 403 });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: session.user.id,
        scheduledAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        student: {
          select: {
            fullname: true,
          },
        },
      },
    });

    return NextResponse.json({ busyDates: lessons });
  } catch (error) {
    console.error("Get busy dates error:", error);
    return NextResponse.json(
      { error: "Ошибка получения занятых дат" },
      { status: 500 }
    );
  }
}