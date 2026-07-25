import Link from "next/link";
import { getPaginatedGames } from "@/data/games";
import { Button } from "@/components/ui/button";
import { deleteGameAction } from "./actions";
import { Pagination } from "@/components/admin/Pagination";
import { getTotalPages, parsePageParam } from "@/lib/pagination";

const PAGE_SIZE = 20;

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const { games, totalCount } = await getPaginatedGames({
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Games</h2>
        <Button
          nativeButton={false}
          render={<Link href="/admin/games/new">+ New Game</Link>}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Release Date</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.id} className="border-b last:border-0">
                <td className="p-3">{game.title}</td>
                <td className="p-3 text-muted-foreground">{game.slug}</td>
                <td className="p-3">${game.price.toFixed(2)}</td>
                <td className="p-3">
                  {game.releaseDate.toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/games/${game.id}/edit`}>Edit</Link>}
                    />
                    <form
                      action={async () => {
                        "use server";
                        await deleteGameAction(game.id);
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

      <Pagination page={page} totalPages={totalPages} basePath="/admin/games" />
    </div>
  );
}
