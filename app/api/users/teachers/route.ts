import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Role } from "@prisma/client";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if(!session){
      NextResponse.json({ error: "Отказано" }, { status: 401 })
    }
    const teachers = await prisma.user.findMany({
      where: {
        role: Role.TEACHER,
        isChecked: true,
      },
      select: {
        id: true,
        fullname: true,
        bio: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Ошибка при получении списка учителей:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить данные" },
      { status: 500 }
    );
  }
}