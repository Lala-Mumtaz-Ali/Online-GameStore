import Link from "next/link";
import { getAllCategories } from "@/data/games";

const linkClassName = "text-sm text-muted-foreground hover:text-primary";

/**
 * Server component: it holds no client state, and the genre list is now read
 * from the database rather than hardcoded. The previous version listed
 * action/rpg/strategy literally, so adding a category in the admin left the
 * sidebar quietly out of date.
 */
export async function Sidebar() {
  const categories = await getAllCategories();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">Discover</h2>
        <div className="mt-4 flex flex-col space-y-2">
          <Link href="/new" className={linkClassName}>
            New Releases
          </Link>
          <Link href="/top" className={linkClassName}>
            Top Sellers
          </Link>
          <Link href="/upcoming" className={linkClassName}>
            Upcoming
          </Link>
        </div>
      </div>
      {categories.length > 0 && (
        <div className="p-6 pt-0">
          <h2 className="text-lg font-semibold tracking-tight">Genres</h2>
          <div className="mt-4 flex flex-col space-y-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/games?genre=${category.slug}`}
                className={linkClassName}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
