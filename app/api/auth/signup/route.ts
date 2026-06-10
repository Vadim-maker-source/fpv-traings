import { createUser } from "@/app/lib/api/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createUser(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Signup route error:", error);
    return NextResponse.json(
      { error: "Ошибка при создании пользователя" },
      { status: 500 }
    );
  }
}