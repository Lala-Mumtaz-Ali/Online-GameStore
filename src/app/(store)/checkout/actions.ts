"use server";

import { redirect } from "next/navigation";
import { createOrderFromCart } from "@/data/orders";

export async function checkoutAction() {
  const order = await createOrderFromCart();
  redirect(`/orders/${order.id}`);
}
