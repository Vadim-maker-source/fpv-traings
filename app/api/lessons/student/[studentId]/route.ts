import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { studentId } = await params;

    const isOwner = session.user.id === studentId;
    const isTeacherOfStudent = await prisma.user.findFirst({
      where: {
        id: studentId,
        teacherId: session.user.id,
      },
    });

    if (!isOwner && !isTeacherOfStudent) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        studentId: studentId,
      },
      select: {
        id: true,
        lessonNumber: true,
        topic: true,
        scheduledAt: true,
        meetLink: true,
        status: true,
        teacher: {
          select: {
            id: true,
            fullname: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error("Get lessons error:", error);
    return NextResponse.json(
      { error: "Ошибка получения уроков" },
      { status: 500 }
    );
  }
}