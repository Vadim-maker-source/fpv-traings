import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { lessonId, meetLink } = await req.json();

    const lesson = await prisma.lesson.update({
      where: {
        id: lessonId,
        teacherId: session.user.id,
      },
      data: {
        meetLink: meetLink,
      },
    });

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error("Update lesson link error:", error);
    return NextResponse.json(
      { error: "Ошибка обновления ссылки" },
      { status: 500 }
    );
  }
}