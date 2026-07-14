import "server-only";
import prisma from "@/db";
import { requireUser } from "@/data/session";

export async function createNotification({
  userId,
  title,
  body,
  link,
}: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, title, body, link },
  });
}

export async function getUserNotifications(limit = 20) {
  const user = await requireUser().catch(() => null);
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadNotificationCount() {
  const user = await requireUser().catch(() => null);
  if (!user) return 0;

  return prisma.notification.count({
    where: { userId: user.id, read: false },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await requireUser();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== user.id) {
    throw new Error("Notification not found.");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead() {
  const user = await requireUser();

  return prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
}
