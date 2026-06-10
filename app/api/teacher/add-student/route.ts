import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { Role } from "@prisma/client";
import { sendStudentAddedEmail } from "@/app/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    
    const { studentId } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: "ID ученика обязателен" }, { status: 400 });
    }
    
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id, role: Role.TEACHER },
    });
    
    if (!teacher) {
      return NextResponse.json({ error: "Доступ только для тренеров" }, { status: 403 });
    }
    
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: Role.STUDENT },
    });
    
    if (!student) {
      return NextResponse.json({ error: "Ученик не найден" }, { status: 404 });
    }
    
    if (student.teacherId) {
      return NextResponse.json({ 
        error: "У этого ученика уже есть тренер. Сначала отвяжите его от текущего тренера." 
      }, { status: 400 });
    }
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          students: {
            connect: { id: studentId },
          },
        },
      }),
      prisma.user.update({
        where: { id: studentId },
        data: {
          teacherId: session.user.id,
        },
      }),
    ]);
    
    try {
      await sendStudentAddedEmail(
        student.email,
        student.fullname,
        teacher.fullname
      );
      console.log(`Email sent to ${student.email} about being added to teacher`);
    } catch (emailError) {
      console.error("Failed to send email to student:", emailError);
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Ученик успешно добавлен. Уведомление отправлено на email."
    });
  } catch (error) {
    console.error("Add student error:", error);
    return NextResponse.json(
      { error: "Ошибка добавления ученика" },
      { status: 500 }
    );
  }
}