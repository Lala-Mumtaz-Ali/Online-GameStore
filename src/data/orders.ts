import "server-only";
import prisma from "@/db";
import { requireUser } from "@/data/session";
import { requireAdmin } from "@/data/admin";
import { sendEmail } from "@/lib/email";
import { orderConfirmationTemplate } from "@/lib/emailTemplates";
import { createNotification } from "@/data/notificationCenter";

export async function createOrderFromCart() {
  const user = await requireUser();

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { game: true },
  });

  if (cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const total = cartItems.reduce((sum, item) => sum + item.game.price * item.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: user.id,
        status: "PAID",
        total,
        items: {
          create: cartItems.map((item) => ({
            gameId: item.gameId,
            title: item.game.title,
            price: item.game.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { userId: user.id } });

    return order;
  });

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: "Your GameStore order is confirmed",
      html: orderConfirmationTemplate({
        name: user.name ?? null,
        orderId: order.id,
        items: order.items,
        total: order.total,
      }),
    });
  }

  await createNotification({
    userId: user.id,
    title: "Order confirmed",
    body: `Your order #${order.id.slice(-8)} for $${order.total.toFixed(2)} is confirmed.`,
    link: `/orders/${order.id}`,
  });

  return order;
}

export async function getUserOrders() {
  const user = await requireUser();
  return prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserOrderById(id: string) {
  const user = await requireUser();
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order || order.userId !== user.id) {
    return null;
  }

  return order;
}

export async function getOrderStats() {
  await requireAdmin();
  const [orderCount, revenue] = await Promise.all([
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
  ]);
  return { orderCount, revenue: revenue._sum.total ?? 0 };
}

export async function getAllOrders({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  await requireAdmin();

  const skip = Math.max(0, (page - 1) * pageSize);

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count(),
  ]);

  return { orders, totalCount };
}

export async function isGameOwned(userId: string, gameId: string) {
  const item = await prisma.orderItem.findFirst({
    where: { gameId, order: { userId, status: "PAID" } },
    select: { id: true },
  });
  return item !== null;
}

export async function getOwnedGameIds() {
  const user = await requireUser().catch(() => null);
  if (!user) return new Set<string>();

  const items = await prisma.orderItem.findMany({
    where: { order: { userId: user.id, status: "PAID" }, gameId: { not: null } },
    select: { gameId: true },
    distinct: ["gameId"],
  });
  return new Set(items.map((item) => item.gameId as string));
}

export async function getOwnedGames() {
  const user = await requireUser();
  const items = await prisma.orderItem.findMany({
    where: { order: { userId: user.id, status: "PAID" }, gameId: { not: null } },
    select: { gameId: true, game: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  const seen = new Set<string>();
  const owned = [];
  for (const item of items) {
    if (!item.gameId || !item.game || seen.has(item.gameId)) continue;
    seen.add(item.gameId);
    owned.push(item.game);
  }
  return owned;
}

export async function getTopSellingGames(limit = 12) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["gameId"],
    where: { order: { status: "PAID" }, gameId: { not: null } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const gameIds = grouped.map((g) => g.gameId).filter((id): id is string => id !== null);

  if (gameIds.length === 0) {
    return [];
  }

  const games = await prisma.game.findMany({ where: { id: { in: gameIds } } });
  const gameById = new Map(games.map((g) => [g.id, g]));

  return grouped
    .map((g) => {
      const game = g.gameId ? gameById.get(g.gameId) : undefined;
      return game ? { ...game, unitsSold: g._sum.quantity ?? 0 } : null;
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);
}
