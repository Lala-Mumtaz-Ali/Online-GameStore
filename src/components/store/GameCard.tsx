import Link from "next/link";

type GameCardProps = {
  slug: string;
  title: string;
  price: number;
  imageUrl: string | null;
  owned?: boolean;
};

export function GameCard({ slug, title, price, imageUrl, owned = false }: GameCardProps) {
  return (
    <Link
      href={`/games/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/50"
    >
      <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-medium leading-tight">{title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">${price.toFixed(2)}</p>
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
