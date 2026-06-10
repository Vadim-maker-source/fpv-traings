import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { sendLessonUpdateEmail } from "@/app/lib/email";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { lessonId, topic, scheduledAt, meetLink } = await req.json();

    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
    }

    if (existingLesson.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const changes: any = {};
    const changeDetails: any = { lessonNumber: existingLesson.lessonNumber };

    if (topic !== undefined && topic !== existingLesson.topic) {
      changes.topic = topic;
      changeDetails.topic = true;
      changeDetails.oldTopic = existingLesson.topic;
      changeDetails.newTopic = topic;
    }

    if (scheduledAt !== undefined && new Date(scheduledAt).getTime() !== existingLesson.scheduledAt.getTime()) {
      changes.scheduledAt = new Date(scheduledAt);
      changeDetails.scheduledAt = true;
      changeDetails.oldDate = existingLesson.scheduledAt;
      changeDetails.newDate = new Date(scheduledAt);
      const conflict = await prisma.lesson.findFirst({
        where: {
          teacherId: session.user.id,
          scheduledAt: new Date(scheduledAt),
          id: { not: lessonId },
        },
      });
      
      if (conflict) {
        return NextResponse.json({ error: "Это время уже занято другим уроком" }, { status: 409 });
      }
    }

    if (meetLink !== undefined && meetLink !== existingLesson.meetLink) {
      changes.meetLink = meetLink;
      changeDetails.meetLink = true;
      changeDetails.oldMeetLink = existingLesson.meetLink;
      changeDetails.newMeetLink = meetLink;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: changes,
      include: {
        student: true,
        teacher: true,
      },
    });

    if (Object.keys(changes).length > 0) {
      try {
        await sendLessonUpdateEmail(
          updatedLesson.student.email,
          updatedLesson.student.fullname,
          updatedLesson.teacher.fullname,
          updatedLesson.lessonNumber,
          changeDetails
        );
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      lesson: updatedLesson,
      changes: Object.keys(changes).length > 0 
    });
  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления урока" },
      { status: 500 }
    );
  }
}