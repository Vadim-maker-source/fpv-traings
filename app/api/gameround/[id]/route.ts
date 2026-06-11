import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: "ID пользователя обязателен" }, { status: 400 });
    }

    const userExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const gameRounds = await prisma.gameRound.findMany({
      where: { userId: id },
      orderBy: { createdAt: "asc" },
    });

    if (gameRounds.length === 0) {
      return NextResponse.json({ allGames: [] });
    }

    let totalScore = 0;
    let totalTime = 0;
    
    let bestScore = -Infinity;
    let worstScore = Infinity;
    let bestTime = Infinity;
    let worstTime = -Infinity;

    const challenges = { challenge1: 0, challenge2: 0, challenge3: 0, challenge4: 0 };
    const challengeBest = { challenge1: 0, challenge2: 0, challenge3: 0, challenge4: 0 };

    const allGames = gameRounds.map((round, idx) => {
      const c1 = Number(round.challenge1) || 0;
      const c2 = Number(round.challenge2) || 0;
      const c3 = Number(round.challenge3) || 0;
      const c4 = Number(round.challenge4) || 0;
      const score = Number(round.totalScore) || 0;
      const time = Number(round.time) || 0;

      totalScore += score;
      totalTime += time;

      challenges.challenge1 += c1;
      challenges.challenge2 += c2;
      challenges.challenge3 += c3;
      challenges.challenge4 += c4;

      if (score > bestScore) bestScore = score;
      if (score < worstScore) worstScore = score;
      if (time < bestTime) bestTime = time;
      if (time > worstTime) worstTime = time;

      if (c1 > challengeBest.challenge1) challengeBest.challenge1 = c1;
      if (c2 > challengeBest.challenge2) challengeBest.challenge2 = c2;
      if (c3 > challengeBest.challenge3) challengeBest.challenge3 = c3;
      if (c4 > challengeBest.challenge4) challengeBest.challenge4 = c4;

      return {
        id: round.id,
        gameNumber: idx + 1,
        challenge1: c1,
        challenge2: c2,
        challenge3: c3,
        challenge4: c4,
        score,
        time,
        date: round.createdAt.toISOString(),
      };
    });

    const count = gameRounds.length;

    return NextResponse.json({
      totalGames: count,
      averageScore: Number((totalScore / count).toFixed(2)),
      averageTime: Number((totalTime / count).toFixed(2)),
      bestScore,
      bestTime,
      worstScore,
      worstTime,
      challengeAverages: {
        challenge1: Number((challenges.challenge1 / count).toFixed(2)),
        challenge2: Number((challenges.challenge2 / count).toFixed(2)),
        challenge3: Number((challenges.challenge3 / count).toFixed(2)),
        challenge4: Number((challenges.challenge4 / count).toFixed(2)),
      },
      challengeBest,
      allGames,
    });

  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}