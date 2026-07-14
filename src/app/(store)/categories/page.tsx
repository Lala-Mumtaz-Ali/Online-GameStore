import Link from "next/link";
import { getAllCategories } from "@/data/games";

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Categories</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/genre/${category.slug}`}
            className="rounded-xl border p-6 text-center font-medium hover:bg-muted"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
