import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedGames } from "@/data/orders";
import { GameCard } from "@/components/store/GameCard";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/library");
  }

  const games = await getOwnedGames();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Your Library</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Games you&apos;ve purchased on this account.
      </p>

      {games.length === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t purchased any games yet.{" "}
          <Link href="/games" className="underline">
            Browse games
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              slug={game.slug}
              title={game.title}
              price={game.price}
              imageUrl={game.imageUrl}
              owned
            />
          ))}
        </div>
      )}
    </div>
  );
}
