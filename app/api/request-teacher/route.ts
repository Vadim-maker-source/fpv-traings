import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth";
import { sendTeacherApplicationEmail } from "@/app/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Сначала войдите в аккаунт" }, { status: 401 });
    }

    const { teacherId } = await req.json();
    if (!teacherId) {
      return NextResponse.json({ error: "Не указан тренер" }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!student) {
      return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    }

    if (student.teacherId === teacherId) {
      return NextResponse.json({ error: "Вы уже записаны к этому тренеру" }, { status: 400 });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        fullname: true,
        email: true
      },
    });

    if (student?.email) {
      sendTeacherApplicationEmail(
        teacher?.email!,
        teacher?.fullname!,
        student.fullname,
        student.email,
        student.birthDate!
      ).catch((error: any) => console.error("Ошибка отправки уведомления тренеру:", error));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Apply to teacher error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}