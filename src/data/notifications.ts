import "server-only";
import prisma from "@/db";
import { requireUser } from "@/data/session";

export async function requestReleaseNotification(gameId: string) {
  const user = await requireUser();

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new Error("Game not found.");
  }
  if (game.releaseDate <= new Date()) {
    throw new Error("This game has already released.");
  }

  return prisma.releaseNotifyRequest.upsert({
    where: { userId_gameId: { userId: user.id, gameId } },
    create: { userId: user.id, gameId },
    update: {},
  });
}

export async function cancelReleaseNotification(gameId: string) {
  const user = await requireUser();
  await prisma.releaseNotifyRequest.deleteMany({ where: { userId: user.id, gameId } });
}

export async function isNotifyRequested(userId: string, gameId: string) {
  const request = await prisma.releaseNotifyRequest.findUnique({
    where: { userId_gameId: { userId, gameId } },
    select: { id: true },
  });
  return request !== null;
}
