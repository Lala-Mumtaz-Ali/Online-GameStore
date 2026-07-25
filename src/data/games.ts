import "server-only";
import prisma from "@/db";
import { requireAdmin } from "@/data/admin";

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

export function getAllGames() {
  return prisma.game.findMany({ orderBy: { title: "asc" } });
}

export async function getPaginatedGames({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  await requireAdmin();

  const skip = Math.max(0, (page - 1) * pageSize);

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
    include: { categories: true },
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

  const skip = Math.max(0, (page - 1) * pageSize);

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

export function getCategoryWithGames(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { games: { orderBy: { title: "asc" } } },
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
