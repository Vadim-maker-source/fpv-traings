import { prisma } from "../prisma";

export async function createGameRound(
    id: string,
    challenge1: number,
    challenge2: number,
    challenge3: number,
    challenge4: number,
    time: number,
    totalScore: number
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
            select: { id: true }
        });

        if (!user) {
            console.error(`User with id ${id} not found`);
            return {
                error: "Пользователь не найден",
                status: 404
            };
        }

        const result = await prisma.gameRound.create({
            data: {
                userId: id,
                challenge1: Number(challenge1),
                challenge2: Number(challenge2),
                challenge3: Number(challenge3),
                challenge4: Number(challenge4),
                time: Number(time),
                totalScore: Number(totalScore),
            },
        });

        return {
            id: result.id,
            userId: result.userId,
            challenge1: Number(result.challenge1),
            challenge2: Number(result.challenge2),
            challenge3: Number(result.challenge3),
            challenge4: Number(result.challenge4),
            time: Number(result.time),
            totalScore: Number(result.totalScore),
            createdAt: result.createdAt instanceof Date 
                ? result.createdAt.toISOString() 
                : result.createdAt,
            status: 200
        };
    } catch (error) {
        console.error("Create game round error:", error);
        throw error;
    }
}