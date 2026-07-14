import { getTopSellingGames, getOwnedGameIds } from "@/data/orders";
import { GameCard } from "@/components/store/GameCard";

export default async function TopSellersPage() {
  const [games, ownedIds] = await Promise.all([
    getTopSellingGames(),
    getOwnedGameIds(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Top Sellers</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ranked by units sold across all completed orders.
      </p>

      {games.length === 0 ? (
        <p className="text-muted-foreground">
          No sales yet — this list will fill in as orders come through.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <div key={game.id} className="flex flex-col gap-1">
              <GameCard
                slug={game.slug}
                title={game.title}
                price={game.price}
                imageUrl={game.imageUrl}
                owned={ownedIds.has(game.id)}
              />
              <p className="text-xs text-muted-foreground">
                {game.unitsSold} sold
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
