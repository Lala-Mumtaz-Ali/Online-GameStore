import { getNewReleases } from "@/data/games";
import { getOwnedGameIds } from "@/data/orders";
import { GameCard } from "@/components/store/GameCard";

export default async function NewReleasesPage() {
  const [games, ownedIds] = await Promise.all([getNewReleases(), getOwnedGameIds()]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">New Releases</h1>
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
    </div>
  );
}
