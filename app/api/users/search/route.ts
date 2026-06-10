import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    
    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { role: Role.STUDENT },
          { teacherId: null },
          {
            OR: [
              { fullname: { contains: query } },
              { email: { contains: query } },
            ],
          },
        ],
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        phone: true,
        birthDate: true,
      },
      take: 20,
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Ошибка поиска" },
      { status: 500 }
    );
  }
}