import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/data/games";
import { auth } from "@/auth";
import { isGameOwned } from "@/data/orders";
import { isGamePreordered } from "@/data/preorders";
import { isNotifyRequested } from "@/data/notifications";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { PreorderButton } from "@/components/store/PreorderButton";
import { NotifyMeButton } from "@/components/store/NotifyMeButton";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const session = await auth();
  const isUpcoming = game.releaseDate > new Date();
  const owned = session?.user ? await isGameOwned(session.user.id, game.id) : false;
  const preordered =
    session?.user && isUpcoming
      ? await isGamePreordered(session.user.id, game.id)
      : false;
  const notifyRequested =
    session?.user && isUpcoming
      ? await isNotifyRequested(session.user.id, game.id)
      : false;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        {game.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.imageUrl}
            alt={game.title}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          "No image"
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold">{game.title}</h1>
        <div className="mt-2 flex gap-2">
          {game.categories.map((category) => (
            <Link
              key={category.id}
              href={`/genre/${category.slug}`}
              className="rounded-full border px-2 py-1 text-xs hover:bg-muted"
            >
              {category.name}
            </Link>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <p className="text-2xl font-semibold">${game.price.toFixed(2)}</p>
          {isUpcoming && (
            <span className="rounded-full border border-amber-500/50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              Upcoming
            </span>
          )}
        </div>

        <div className="mt-4">
          {owned ? (
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-primary/50 px-3 py-1 text-sm font-medium text-primary">
                You own this game
              </span>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/library">Go to Library</Link>}
              />
            </div>
          ) : isUpcoming ? (
            session?.user ? (
              <div className="flex flex-wrap items-center gap-3">
                <PreorderButton
                  gameId={game.id}
                  gameTitle={game.title}
                  initiallyActive={preordered}
                />
                <NotifyMeButton
                  gameId={game.id}
                  gameTitle={game.title}
                  initiallyActive={notifyRequested}
                />
              </div>
            ) : (
              <Button
                nativeButton={false}
                render={
                  <Link href={`/login?callbackUrl=/games/${game.slug}`}>
                    Sign in to preorder
                  </Link>
                }
              />
            )
          ) : session?.user ? (
            <AddToCartButton gameId={game.id} gameTitle={game.title} />
          ) : (
            <Button
              nativeButton={false}
              render={
                <Link href={`/login?callbackUrl=/games/${game.slug}`}>
                  Sign in to add to cart
                </Link>
              }
            />
          )}
        </div>

        <p className="mt-4 text-muted-foreground">{game.description}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Released {game.releaseDate.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
