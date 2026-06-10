import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { Role } from "@prisma/client";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    
    const { studentId } = await req.json();
    
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
    
    await prisma.$transaction([
      prisma.lesson.deleteMany({
        where: {
          studentId: studentId,
          teacherId: session.user.id,
        },
      }),
      prisma.user.update({
        where: { id: studentId },
        data: {
          teacherId: null,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          students: {
            disconnect: { id: studentId },
          },
        },
      }),
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove student error:", error);
    return NextResponse.json(
      { error: "Ошибка удаления ученика" },
      { status: 500 }
    );
  }
}