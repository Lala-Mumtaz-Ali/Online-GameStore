import "server-only";
import type { Prisma } from "@prisma/client";
import prisma from "@/db";
import { requireAdmin } from "@/data/admin";
import { getSkip } from "@/lib/pagination";
import type { GameSort } from "@/lib/gameQuery";

export type GameInput = {
  slug: string;
  title: string;
  description: string;
  price: number;
  releaseDate: Date;
  imageUrl: string | null;
  categorySlugs: string[];
};

export type CategoryInput = {
  name: string;
  slug: string;
};

/** Exactly the fields GameCard renders, plus id for the "owned" lookup. */
export type StoreGameListItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  imageUrl: string | null;
};

const GAME_ORDER_BY: Record<GameSort, Prisma.GameOrderByWithRelationInput> = {
  title: { title: "asc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  newest: { releaseDate: "desc" },
};

/**
 * The public catalogue query: search, genre filter, sort, pagination.
 *
 * Intentionally unguarded, like getAllCategories(). getPaginatedGames() below
 * calls requireAdmin() and so cannot be reused for the storefront.
 */
export async function searchGames({
  page = 1,
  pageSize = 24,
  q,
  genreSlug,
  sort = "title",
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  genreSlug?: string;
  sort?: GameSort;
} = {}): Promise<{ games: StoreGameListItem[]; totalCount: number }> {
  // Built once and handed to BOTH queries below. Filtering findMany but not
  // count is the classic pagination bug: "Page 1 of 47" with three results.
  const where: Prisma.GameWhereInput = {
    // Title only. `contains` on description would scan a long text column for
    // little precision - every action game's description contains "action".
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    ...(genreSlug ? { categories: { some: { slug: genreSlug } } } : {}),
  };

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      where,
      // The id tiebreaker makes OFFSET pagination stable. Without a unique
      // secondary key, rows with equal price (or equal release date) can be
      // returned twice or skipped entirely as you page through.
      orderBy: [GAME_ORDER_BY[sort], { id: "asc" }],
      select: { id: true, slug: true, title: true, price: true, imageUrl: true },
      skip: getSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.game.count({ where }),
  ]);

  return { games, totalCount };
}

export async function getPaginatedGames({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  await requireAdmin();

  const skip = getSkip(page, pageSize);

  const [games, totalCount] = await Promise.all([
    prisma.game.findMany({
      orderBy: { title: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.game.count(),
  ]);

  return { games, totalCount };
}

export function getGameBySlug(slug: string) {
  return prisma.game.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { name: "asc" } },
      features: { orderBy: { name: "asc" } },
      screenshots: { orderBy: { position: "asc" } },
      trailers: { orderBy: { position: "asc" } },
    },
  });
}

export function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getPaginatedCategories({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  await requireAdmin();

  const skip = getSkip(page, pageSize);

  const [categories, totalCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { games: true } } },
      skip,
      take: pageSize,
    }),
    prisma.category.count(),
  ]);

  return { categories, totalCount };
}

/**
 * Replaces getCategoryWithGames, which eagerly loaded every game in a genre.
 * /genre/[slug] now only needs to know the category exists before redirecting
 * to the paginated catalogue.
 */
export function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
}

export function getNewReleases(limit = 12) {
  return prisma.game.findMany({
    where: { releaseDate: { lte: new Date() } },
    orderBy: { releaseDate: "desc" },
    take: limit,
  });
}

export function getUpcomingGames(limit = 12) {
  return prisma.game.findMany({
    where: { releaseDate: { gt: new Date() } },
    orderBy: { releaseDate: "asc" },
    take: limit,
  });
}

export function getFeaturedGames(limit = 4) {
  return prisma.game.findMany({
    where: { releaseDate: { lte: new Date() } },
    orderBy: { releaseDate: "desc" },
    take: limit,
  });
}

export function getGameById(id: string) {
  return prisma.game.findUnique({
    where: { id },
    include: { categories: true },
  });
}

export function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export async function getCatalogStats() {
  const [gameCount, categoryCount] = await Promise.all([
    prisma.game.count(),
    prisma.category.count(),
  ]);
  return { gameCount, categoryCount };
}

export async function createGame({ categorySlugs, ...data }: GameInput) {
  await requireAdmin();
  return prisma.game.create({
    data: {
      ...data,
      categories: { connect: categorySlugs.map((slug) => ({ slug })) },
    },
  });
}

export async function updateGame(id: string, { categorySlugs, ...data }: GameInput) {
  await requireAdmin();
  return prisma.game.update({
    where: { id },
    data: {
      ...data,
      categories: { set: categorySlugs.map((slug) => ({ slug })) },
    },
  });
}

export async function deleteGame(id: string) {
  await requireAdmin();
  return prisma.game.delete({ where: { id } });
}

export async function createCategory(data: CategoryInput) {
  await requireAdmin();
  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: CategoryInput) {
  await requireAdmin();
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  return prisma.category.delete({ where: { id } });
}
