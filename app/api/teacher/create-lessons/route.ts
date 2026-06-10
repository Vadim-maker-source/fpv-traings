import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { Role, LessonStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { studentId, lessons } = await req.json();

    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id, role: Role.TEACHER },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Доступ только для тренеров" }, { status: 403 });
    }

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        teacherId: session.user.id,
        role: Role.STUDENT,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Ученик не найден или не принадлежит вам" }, { status: 404 });
    }

    const conflictingLessons = [];
    for (const lesson of lessons) {
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          scheduledAt: new Date(lesson.scheduledAt),
          teacherId: session.user.id,
        },
      });

      if (existingLesson) {
        conflictingLessons.push(new Date(lesson.scheduledAt));
      }
    }

    if (conflictingLessons.length > 0) {
      return NextResponse.json({
        error: "Обнаружены конфликты расписания",
        conflictingDates: conflictingLessons,
      }, { status: 409 });
    }

    const createdLessons = await prisma.$transaction(
      lessons.map((lesson: any) =>
        prisma.lesson.create({
          data: {
            studentId: studentId,
            teacherId: session.user.id,
            lessonNumber: lesson.lessonNumber,
            topic: lesson.topic,
            scheduledAt: new Date(lesson.scheduledAt),
            meetLink: lesson.meetLink,
            status: LessonStatus.SCHEDULED,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      lessons: createdLessons,
      message: "Расписание успешно создано",
    });
  } catch (error) {
    console.error("Create lessons error:", error);
    return NextResponse.json(
      { error: "Ошибка создания расписания" },
      { status: 500 }
    );
  }
}