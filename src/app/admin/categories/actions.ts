"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/data/games";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
});

export type CategoryFormState = {
  error?: string;
};

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await createCategory(parsed.data);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create category",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await updateCategory(id, parsed.data);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update category",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(id: string) {
  await deleteCategory(id);
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
}
