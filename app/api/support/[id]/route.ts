import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { role: true }
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const { id } = await params;
  const { answer } = await req.json();

  if (!answer) {
    return NextResponse.json({ error: "Ответ не может быть пустым" }, { status: 400 });
  }

  try {
    const ticketExists = await prisma.support.findUnique({
      where: { id }
    });

    if (!ticketExists) {
      return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
    }

    const updatedTicket = await prisma.support.update({
      where: { id },
      data: {
        answer,
        status: "CLOSED",
      },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
    
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Ошибка сервера при обновлении" }, { status: 500 });
  }
}