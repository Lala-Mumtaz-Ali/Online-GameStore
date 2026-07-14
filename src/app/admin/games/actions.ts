"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createGame,
  updateGame,
  deleteGame,
  type GameInput,
} from "@/data/games";

const gameSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  releaseDate: z.string().min(1, "Release date is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categorySlugs: z.array(z.string()).default([]),
});

export type GameFormState = {
  error?: string;
};

function parseGameForm(formData: FormData) {
  return gameSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    releaseDate: formData.get("releaseDate"),
    imageUrl: formData.get("imageUrl"),
    categorySlugs: formData.getAll("categorySlugs"),
  });
}

function toGameInput(data: z.infer<typeof gameSchema>): GameInput {
  return {
    slug: data.slug,
    title: data.title,
    description: data.description,
    price: data.price,
    releaseDate: new Date(data.releaseDate),
    imageUrl: data.imageUrl || null,
    categorySlugs: data.categorySlugs,
  };
}

export async function createGameAction(
  _prevState: GameFormState,
  formData: FormData
): Promise<GameFormState> {
  const parsed = parseGameForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await createGame(toGameInput(parsed.data));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create game" };
  }

  revalidatePath("/admin/games");
  revalidatePath("/games");
  redirect("/admin/games");
}

export async function updateGameAction(
  id: string,
  _prevState: GameFormState,
  formData: FormData
): Promise<GameFormState> {
  const parsed = parseGameForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateGame(id, toGameInput(parsed.data));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update game" };
  }

  revalidatePath("/admin/games");
  revalidatePath("/games");
  redirect("/admin/games");
}

export async function deleteGameAction(id: string) {
  await deleteGame(id);
  revalidatePath("/admin/games");
  revalidatePath("/games");
}
