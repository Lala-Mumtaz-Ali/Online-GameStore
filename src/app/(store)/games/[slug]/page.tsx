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
import { ScreenshotGallery } from "@/components/store/ScreenshotGallery";
import { TrailerPlayer } from "@/components/store/TrailerPlayer";

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

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

  const platforms = [
    game.onWindows && "Windows",
    game.onMac && "macOS",
    game.onLinux && "Linux",
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-6xl">
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

          {(game.developer || game.publisher) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {game.developer}
              {game.developer && game.publisher && game.developer !== game.publisher
                ? ` · ${game.publisher}`
                : ""}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {game.categories.map((category) => (
              <Link
                key={category.id}
                href={`/games?genre=${category.slug}`}
                className="rounded-full border px-2 py-1 text-xs hover:bg-muted"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold">
              {game.price === 0 ? "Free to Play" : `$${game.price.toFixed(2)}`}
            </p>
            {isUpcoming && (
              <span className="rounded-full border border-amber-500/50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                Upcoming
              </span>
            )}
            {game.metacriticScore !== null && (
              <a
                href={game.metacriticUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-emerald-600/40 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              >
                Metacritic {game.metacriticScore}
              </a>
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

          <p className="mt-5 text-muted-foreground">{game.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Released" value={game.releaseDate.toLocaleDateString()} />
            {platforms.length > 0 && (
              <Metric label="Platforms" value={platforms.join(", ")} />
            )}
            {game.reviewCount !== null && (
              <Metric label="Reviews" value={game.reviewCount.toLocaleString()} />
            )}
            {game.website && (
              <Metric
                label="Website"
                value={
                  <a
                    href={game.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Official site
                  </a>
                }
              />
            )}
          </dl>
        </div>
      </div>

      {game.trailers.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Trailers</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {game.trailers.map((trailer) => (
              <div key={trailer.id}>
                <TrailerPlayer
                  hlsUrl={trailer.hlsUrl}
                  thumbnailUrl={trailer.thumbnailUrl}
                  title={trailer.name}
                />
                <p className="mt-2 text-sm text-muted-foreground">{trailer.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {game.screenshots.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Screenshots</h2>
          <ScreenshotGallery screenshots={game.screenshots} title={game.title} />
        </section>
      )}

      {game.aboutHtml && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">About this game</h2>
          {/* Sanitised at import time (scripts/import-steam-games.ts) with a tag
              allowlist, and images restricted to Steam's own CDNs, so this is
              not trusting whatever the store happens to return today. */}
          <div
            className="steam-about max-w-3xl text-sm leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: game.aboutHtml }}
          />
        </section>
      )}

      {game.features.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Features</h2>
          <div className="flex flex-wrap gap-2">
            {game.features.map((feature) => (
              <span
                key={feature.id}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
              >
                {feature.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
