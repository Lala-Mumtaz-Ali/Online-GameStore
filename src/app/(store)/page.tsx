import { getFeaturedGames } from "@/data/games";
import { getOwnedGameIds } from "@/data/orders";
import { GameCard } from "@/components/store/GameCard";

export default async function Home() {
  const [featuredGames, ownedIds] = await Promise.all([
    getFeaturedGames(),
    getOwnedGameIds(),
  ]);

  return (
    <div className="flex w-full flex-col items-start justify-start">
      <h1 className="mb-4 text-4xl font-bold">Welcome to GameStore</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Discover the best games, new releases, and exclusive deals.
      </p>

      <div className="w-full">
        <h2 className="mb-4 text-2xl font-semibold">Featured Games</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredGames.map((game) => (
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
    </div>
  );
}
