import { notFound, redirect } from "next/navigation";
import { getCategoryBySlug } from "@/data/games";

/**
 * Genres are now one case of the filtered catalogue, so this route redirects
 * rather than duplicating the grid, pagination, and sorting.
 *
 * The category is still looked up first so an unknown slug keeps returning 404
 * instead of silently redirecting to an empty listing.
 *
 * redirect() is a 307, deliberately not permanentRedirect()'s 308: browsers
 * cache 308s aggressively, which makes them painful to undo during development.
 */
export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  redirect(`/games?genre=${encodeURIComponent(slug)}`);
}
