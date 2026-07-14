import "server-only";
import prisma from "@/db";
import { requireUser } from "@/data/session";

export async function createPreorder(gameId: string) {
  const user = await requireUser();

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new Error("Game not found.");
  }
  if (game.releaseDate <= new Date()) {
    throw new Error("This game has already released — you can buy it directly.");
  }

  return prisma.preorder.upsert({
    where: { userId_gameId: { userId: user.id, gameId } },
    create: { userId: user.id, gameId, price: game.price },
    update: {},
  });
}

export async function cancelPreorder(gameId: string) {
  const user = await requireUser();
  await prisma.preorder.deleteMany({ where: { userId: user.id, gameId } });
}

export async function isGamePreordered(userId: string, gameId: string) {
  const preorder = await prisma.preorder.findUnique({
    where: { userId_gameId: { userId, gameId } },
    select: { id: true },
  });
  return preorder !== null;
}

export async function getUserPreorders() {
  const user = await requireUser();
  return prisma.preorder.findMany({
    where: { userId: user.id },
    include: { game: true },
    orderBy: { createdAt: "desc" },
  });
}
