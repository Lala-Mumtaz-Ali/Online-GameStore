import { notFound } from "next/navigation";
import { getCategoryWithGames } from "@/data/games";
import { getOwnedGameIds } from "@/data/orders";
import { GameCard } from "@/components/store/GameCard";

export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryWithGames(slug);

  if (!category) {
    notFound();
  }

  const ownedIds = await getOwnedGameIds();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{category.name}</h1>
      {category.games.length === 0 ? (
        <p className="text-muted-foreground">No games in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {category.games.map((game) => (
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
    </div>
  );
}
