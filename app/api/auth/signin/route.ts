import { prisma } from "@/app/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const { email, password } = body;
        
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email и пароль обязательны", status: 400 },
                { status: 400 }
            );
        }
        
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        
        if (!user || !user.password) {
            return NextResponse.json(
                { error: "Неверный email или пароль", status: 401 },
                { status: 401 }
            );
        }
        
        const isValid = await compare(password, user.password);
        
        if (isValid) {
            const { password: _, ...userWithoutPassword } = user;
            return NextResponse.json({
                success: true,
                user: userWithoutPassword,
                status: 200
            }, { status: 200 });
        } else {
            return NextResponse.json(
                { error: "Неверный email или пароль", status: 401 },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Signin route error:", error);
        return NextResponse.json(
            { error: "Внутренняя ошибка сервера", status: 500 },
            { status: 500 }
        );
    }
}