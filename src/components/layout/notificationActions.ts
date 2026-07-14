"use server";

import { revalidatePath } from "next/cache";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/data/notificationCenter";

export async function markNotificationReadAction(notificationId: string) {
  await markNotificationAsRead(notificationId);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  await markAllNotificationsAsRead();
  revalidatePath("/", "layout");
}
