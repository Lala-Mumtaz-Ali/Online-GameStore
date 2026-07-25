import Link from "next/link";
import { getPaginatedCategories } from "@/data/games";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "./actions";
import { Pagination } from "@/components/admin/Pagination";
import { getTotalPages, parsePageParam } from "@/lib/pagination";

const PAGE_SIZE = 20;

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { categories, totalCount } = await getPaginatedCategories({
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <Button
          nativeButton={false}
          render={<Link href="/admin/categories/new">+ New Category</Link>}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Games</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b last:border-0">
                <td className="p-3">{category.name}</td>
                <td className="p-3 text-muted-foreground">{category.slug}</td>
                <td className="p-3">{category._count.games}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link href={`/admin/categories/${category.id}/edit`}>Edit</Link>
                      }
                    />
                    <form
                      action={async () => {
                        "use server";
                        await deleteCategoryAction(category.id);
                      }}
                    >
                      <Button type="submit" variant="destructive" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} basePath="/admin/categories" />
    </div>
  );
}
