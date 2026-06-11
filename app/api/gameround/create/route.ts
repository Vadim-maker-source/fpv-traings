import { createGameRound } from "@/app/lib/api/gameroute";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, challenge1, challenge2, challenge3, challenge4, time } = body;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { error: "ID пользователя обязателен", status: 400 },
                { status: 400 }
            );
        }

        const totalScore = challenge1 + challenge2 + challenge3 + challenge4;

        const result = await createGameRound(
            id,
            challenge1,
            challenge2,
            challenge3,
            challenge4,
            time,
            totalScore
        );

        if (result && "error" in result) {
            return NextResponse.json(
                { error: result.error, status: result.status },
                { status: result.status || 400 }
            );
        }

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("Create game round error:", error);

        if (error && typeof error === "object" && "code" in error) {
            if (error.code === "P2003") {
                return NextResponse.json(
                    { error: "Пользователь не найден в базе данных", status: 404 },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json(
            { error: "Внутренняя ошибка сервера", status: 500 },
            { status: 500 }
        );
    }
}