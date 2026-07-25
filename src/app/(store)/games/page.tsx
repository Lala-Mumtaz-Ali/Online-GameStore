import Link from "next/link";
import { Suspense } from "react";
import { getAllCategories, searchGames } from "@/data/games";
import { getOwnedGameIds } from "@/data/orders";
import { GameCard } from "@/components/store/GameCard";
import { GameFilters } from "@/components/store/GameFilters";
import { GameSearchInput } from "@/components/store/GameSearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { parseGameSort, parseGenreSlug, parseSearchQuery } from "@/lib/gameQuery";
import { getTotalPages, parsePageParam } from "@/lib/pagination";

const PAGE_SIZE = 24;

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = parseSearchQuery(sp.q);
  const genreSlug = parseGenreSlug(sp.genre);
  const sort = parseGameSort(sp.sort);
  const page = parsePageParam(sp.page);

  const [{ games, totalCount }, ownedIds, categories] = await Promise.all([
    searchGames({ page, pageSize: PAGE_SIZE, q, genreSlug, sort }),
    getOwnedGameIds(),
    getAllCategories(),
  ]);

  const totalPages = getTotalPages(totalCount, PAGE_SIZE);
  const hasFilters = Boolean(q || genreSlug || sp.sort);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">All Games</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "game" : "games"}
        </p>
      </div>

      {/* Suspense is required around anything reading useSearchParams: without a
          boundary Next opts this whole route into client-side rendering. The
          search box is duplicated here for small screens, where the navbar one
          is hidden. */}
      <Suspense fallback={<div className="mb-4 h-10 sm:hidden" />}>
        <GameSearchInput className="mb-4 w-full sm:hidden" />
      </Suspense>

      <Suspense fallback={<div className="mb-6 h-16" />}>
        <GameFilters
          categories={categories}
          genre={genreSlug}
          sort={sort}
          hasFilters={hasFilters}
        />
      </Suspense>

      {games.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="mb-2 font-medium">No games match your search.</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {page > totalPages
              ? `There ${totalPages === 1 ? "is" : "are"} only ${totalPages} page${
                  totalPages === 1 ? "" : "s"
                } of results.`
              : "Try a different search term or genre."}
          </p>
          <Link href="/games" className="underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              slug={game.slug}
              title={game.title}
              price={game.price}
              imageUrl={game.imageUrl}
              owned={ownedIds.has(game.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/games"
        searchParams={sp}
      />
    </div>
  );
}
