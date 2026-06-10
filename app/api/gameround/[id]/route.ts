// app/api/gameround/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ params - это Promise
) {
  try {
    // ✅ Дожидаемся params
    const { id } = await context.params;
    
    console.log("=== GAME STATS API ===");
    console.log("Received ID:", id);

    if (!id || typeof id !== "string") {
      console.error("Invalid or missing ID");
      return NextResponse.json(
        { error: "ID пользователя обязателен" },
        { status: 400 }
      );
    }

    // Получаем игры для этого пользователя
    const gameRounds = await prisma.gameRound.findMany({
      where: { 
        userId: id 
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${gameRounds.length} game rounds for user ${id}`);

    // Если нет игр
    if (gameRounds.length === 0) {
      return NextResponse.json({
        totalGames: 0,
        averageScore: 0,
        averageTime: 0,
        bestScore: 0,
        bestTime: 0,
        worstScore: 0,
        worstTime: 0,
        challengeAverages: {
          challenge1: 0,
          challenge2: 0,
          challenge3: 0,
          challenge4: 0,
        },
        challengeBest: {
          challenge1: 0,
          challenge2: 0,
          challenge3: 0,
          challenge4: 0,
        },
        allGames: [],
      }, { status: 200 });
    }

    // Преобразование в числа
    const toNumber = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (val && typeof val === 'object' && 'toNumber' in val) {
        return val.toNumber();
      }
      return Number(val) || 0;
    };

    const scores = gameRounds.map(r => toNumber(r.totalScore));
    const times = gameRounds.map(r => toNumber(r.time));
    const c1 = gameRounds.map(r => toNumber(r.challenge1));
    const c2 = gameRounds.map(r => toNumber(r.challenge2));
    const c3 = gameRounds.map(r => toNumber(r.challenge3));
    const c4 = gameRounds.map(r => toNumber(r.challenge4));

    const analytics = {
      totalGames: gameRounds.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / gameRounds.length,
      averageTime: times.reduce((a, b) => a + b, 0) / gameRounds.length,
      bestScore: Math.max(...scores),
      bestTime: Math.min(...times),
      worstScore: Math.min(...scores),
      worstTime: Math.max(...times),
      challengeAverages: {
        challenge1: c1.reduce((a, b) => a + b, 0) / gameRounds.length,
        challenge2: c2.reduce((a, b) => a + b, 0) / gameRounds.length,
        challenge3: c3.reduce((a, b) => a + b, 0) / gameRounds.length,
        challenge4: c4.reduce((a, b) => a + b, 0) / gameRounds.length,
      },
      challengeBest: {
        challenge1: Math.max(...c1),
        challenge2: Math.max(...c2),
        challenge3: Math.max(...c3),
        challenge4: Math.max(...c4),
      },
      allGames: gameRounds.map((round, index) => ({
        id: round.id,
        gameNumber: index + 1,
        challenge1: toNumber(round.challenge1),
        challenge2: toNumber(round.challenge2),
        challenge3: toNumber(round.challenge3),
        challenge4: toNumber(round.challenge4),
        score: toNumber(round.totalScore),
        time: toNumber(round.time),
        date: round.createdAt instanceof Date 
          ? round.createdAt.toISOString() 
          : String(round.createdAt),
      })),
    };

    return NextResponse.json(analytics, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error("=== GAME STATS ERROR ===");
    console.error(error);
    
    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера",
        details: error instanceof Error ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}