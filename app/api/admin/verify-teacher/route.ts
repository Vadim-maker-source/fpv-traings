import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "ID пользователя обязателен" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isChecked: true },
      select: {
        id: true,
        fullname: true,
        email: true,
        isChecked: true
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Verify teacher error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}