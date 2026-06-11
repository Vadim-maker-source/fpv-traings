import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const tickets = await prisma.support.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: {
      user: { select: { fullname: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { topic, description } = await req.json();

  if (!topic || !description) {
    return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
  }

  const ticket = await prisma.support.create({
    data: {
      userId: user.id,
      topic,
      description,
      status: "OPEN",
    },
  });

  return NextResponse.json({ success: true, ticket });
}