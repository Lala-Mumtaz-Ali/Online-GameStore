import "server-only";
import prisma from "@/db";
import { requireUser } from "@/data/session";
import { isGameOwned } from "@/data/orders";

export async function getCart() {
  const user = await requireUser();
  return prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { game: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCartCount() {
  const user = await requireUser().catch(() => null);
  if (!user) return 0;
  const result = await prisma.cartItem.aggregate({
    where: { userId: user.id },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function addToCart(gameId: string, quantity = 1) {
  const user = await requireUser();

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new Error("Game not found.");
  }

  if (await isGameOwned(user.id, gameId)) {
    throw new Error("You already own this game.");
  }

  return prisma.cartItem.upsert({
    where: { userId_gameId: { userId: user.id, gameId } },
    create: { userId: user.id, gameId, quantity },
    update: { quantity: { increment: quantity }, reminderSentAt: null },
  });
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const user = await requireUser();

  if (!Number.isInteger(quantity)) {
    throw new Error("Invalid quantity.");
  }

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
  if (!item || item.userId !== user.id) {
    throw new Error("Cart item not found.");
  }

  if (quantity < 1) {
    return prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: Math.min(quantity, 99), reminderSentAt: null },
  });
}

export async function removeCartItem(cartItemId: string) {
  const user = await requireUser();

  const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
  if (!item || item.userId !== user.id) {
    throw new Error("Cart item not found.");
  }

  return prisma.cartItem.delete({ where: { id: cartItemId } });
}

export async function clearCart(userId: string) {
  return prisma.cartItem.deleteMany({ where: { userId } });
}
