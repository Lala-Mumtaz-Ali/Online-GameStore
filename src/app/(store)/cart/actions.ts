"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
} from "@/data/cart";

export type AddToCartState = {
  success: boolean;
  error?: string;
  timestamp?: number;
};

export async function addToCartAction(
  gameId: string,
  _prevState: AddToCartState,
  _formData: FormData
): Promise<AddToCartState> {
  try {
    await addToCart(gameId, 1);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add to cart",
      timestamp: Date.now(),
    };
  }

  revalidatePath("/cart");
  return { success: true, timestamp: Date.now() };
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number
) {
  await updateCartItemQuantity(cartItemId, quantity);
  revalidatePath("/cart");
}

export async function removeCartItemAction(cartItemId: string) {
  await removeCartItem(cartItemId);
  revalidatePath("/cart");
}
