import "server-only";
import prisma from "@/db";
import { sendEmail } from "@/lib/email";
import {
  abandonedCartReminderTemplate,
  releaseNotifyTemplate,
  preorderFulfilledTemplate,
  weeklyAdminReportTemplate,
} from "@/lib/emailTemplates";
import { createNotification } from "@/data/notificationCenter";

const ABANDONED_CART_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 24h

export async function runAbandonedCartReminders() {
  const cutoff = new Date(Date.now() - ABANDONED_CART_THRESHOLD_MS);

  const items = await prisma.cartItem.findMany({
    where: { createdAt: { lte: cutoff }, reminderSentAt: null },
    include: {
      game: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const byUser = new Map<string, typeof items>();
  for (const item of items) {
    const existing = byUser.get(item.userId);
    if (existing) existing.push(item);
    else byUser.set(item.userId, [item]);
  }

  let usersNotified = 0;
  for (const [userId, userItems] of byUser) {
    const user = userItems[0].user;

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "You left something in your cart",
        html: abandonedCartReminderTemplate({
          name: user.name,
          items: userItems.map((item) => ({
            title: item.game.title,
            price: item.game.price,
            quantity: item.quantity,
          })),
        }),
      });
    }

    await createNotification({
      userId,
      title: "You left something in your cart",
      body:
        userItems.length === 1
          ? `${userItems[0].game.title} is still waiting in your cart.`
          : `${userItems.length} games are still waiting in your cart.`,
      link: "/cart",
    });

    await prisma.cartItem.updateMany({
      where: { id: { in: userItems.map((item) => item.id) } },
      data: { reminderSentAt: new Date() },
    });

    usersNotified += 1;
  }

  return { usersNotified, itemsCovered: items.length };
}

export async function runReleaseDayProcessing() {
  const now = new Date();

  const games = await prisma.game.findMany({
    where: { releaseDate: { lte: now }, releaseAutomationRanAt: null },
    include: {
      preorders: { include: { user: { select: { id: true, email: true, name: true } } } },
      notifyRequests: { include: { user: { select: { id: true, email: true, name: true } } } },
    },
  });

  let autopurchased = 0;
  let notified = 0;

  for (const game of games) {
    const preorderedUserIds = new Set<string>();

    for (const preorder of game.preorders) {
      preorderedUserIds.add(preorder.userId);

      const order = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: preorder.userId,
            status: "PAID",
            total: preorder.price,
            items: {
              create: [
                {
                  gameId: game.id,
                  title: game.title,
                  price: preorder.price,
                  quantity: 1,
                },
              ],
            },
          },
        });
        await tx.preorder.delete({ where: { id: preorder.id } });
        return order;
      });

      autopurchased += 1;

      if (preorder.user.email) {
        await sendEmail({
          to: preorder.user.email,
          subject: `${game.title} has released — your preorder is complete`,
          html: preorderFulfilledTemplate({
            name: preorder.user.name,
            orderId: order.id,
            gameTitle: game.title,
            price: preorder.price,
          }),
        });
      }

      await createNotification({
        userId: preorder.userId,
        title: "Preorder complete",
        body: `${game.title} has released — your preorder was automatically completed and is in your library.`,
        link: `/orders/${order.id}`,
      });
    }

    for (const request of game.notifyRequests) {
      if (!preorderedUserIds.has(request.userId)) {
        if (request.user.email) {
          await sendEmail({
            to: request.user.email,
            subject: `${game.title} is now available!`,
            html: releaseNotifyTemplate({
              name: request.user.name,
              gameTitle: game.title,
              gameSlug: game.slug,
            }),
          });
        }

        await createNotification({
          userId: request.userId,
          title: "Now available",
          body: `${game.title} just released.`,
          link: `/games/${game.slug}`,
        });

        notified += 1;
      }
    }

    await prisma.releaseNotifyRequest.deleteMany({ where: { gameId: game.id } });
    await prisma.game.update({
      where: { id: game.id },
      data: { releaseAutomationRanAt: now },
    });
  }

  return { gamesProcessed: games.length, autopurchased, notified };
}

export async function runWeeklyAdminReport() {
  const weekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const now = new Date();

  const [orders, newUsersCount, admins] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: weekAgo }, status: "PAID" },
      include: { items: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true, name: true } }),
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  const salesByGame = new Map<string, { title: string; unitsSold: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.gameId ?? item.title;
      const existing = salesByGame.get(key);
      if (existing) existing.unitsSold += item.quantity;
      else salesByGame.set(key, { title: item.title, unitsSold: item.quantity });
    }
  }
  const topGame =
    [...salesByGame.values()].sort((a, b) => b.unitsSold - a.unitsSold)[0] ?? null;

  const weekLabel = `${weekAgo.toLocaleDateString()} – ${now.toLocaleDateString()}`;

  const html = weeklyAdminReportTemplate({
    weekLabel,
    newOrders: orders.length,
    revenue,
    newUsers: newUsersCount,
    topGame,
  });

  let adminsEmailed = 0;
  for (const admin of admins) {
    if (admin.email) {
      await sendEmail({
        to: admin.email,
        subject: `GameStore weekly report — ${weekLabel}`,
        html,
      });
      adminsEmailed += 1;
    }

    await createNotification({
      userId: admin.id,
      title: "Weekly report ready",
      body: `${orders.length} orders, $${revenue.toFixed(2)} revenue for ${weekLabel}.`,
      link: "/admin",
    });
  }

  return { adminsEmailed, newOrders: orders.length, revenue, newUsers: newUsersCount, topGame };
}
