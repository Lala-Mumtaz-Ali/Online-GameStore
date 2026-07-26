import Link from "next/link";

type GameCardProps = {
  slug: string;
  title: string;
  price: number;
  imageUrl: string | null;
  owned?: boolean;
};

export function GameCard({ slug, title, price, imageUrl, owned = false }: GameCardProps) {
  // Not every game publishes portrait cover art, so the importer falls back to
  // the landscape store header. Cropping that to a 3:4 card slices the title
  // off, so it is letterboxed over a blurred copy of itself instead - the whole
  // image stays visible and the card still fills its box.
  const isLandscape = imageUrl?.includes("header.jpg") ?? false;

  return (
    <Link
      href={`/games/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <>
            {isLandscape && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-xl"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className={`relative h-full w-full transition-transform group-hover:scale-105 ${
                isLandscape ? "object-contain" : "object-cover"
              }`}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-medium leading-tight">{title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {price === 0 ? "Free to Play" : `$${price.toFixed(2)}`}
          </p>
          {owned && (
            <span className="rounded-full border border-primary/50 px-2 py-0.5 text-xs font-medium text-primary">
              Owned
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
