import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Action", slug: "action" },
  { name: "RPG", slug: "rpg" },
  { name: "Strategy", slug: "strategy" },
];

const games = [
  {
    slug: "shadow-of-the-ronin",
    title: "Shadow of the Ronin",
    description:
      "A fast-paced action game following a masterless samurai hunting the warlord who destroyed his clan.",
    price: 59.99,
    releaseDate: new Date("2025-11-10"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "ember-kingdom",
    title: "Ember Kingdom",
    description:
      "An open-world RPG set in a realm slowly being consumed by magical wildfire.",
    price: 49.99,
    releaseDate: new Date("2024-03-15"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "tactics-of-aurelia",
    title: "Tactics of Aurelia",
    description:
      "A turn-based strategy game of shifting alliances between five rival city-states.",
    price: 39.99,
    releaseDate: new Date("2026-09-01"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "neon-vanguard",
    title: "Neon Vanguard",
    description:
      "A cyberpunk action-shooter where every bullet ricochets off a hackable environment.",
    price: 29.99,
    releaseDate: new Date("2026-10-15"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "wanderers-requiem",
    title: "Wanderer's Requiem",
    description:
      "A story-driven RPG about a travelling bard collecting the last songs of a dying world.",
    price: 69.99,
    releaseDate: new Date("2025-12-25"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "ironclad-empires",
    title: "Ironclad Empires",
    description:
      "A grand strategy game of industrial-age empire building and naval warfare.",
    price: 44.99,
    releaseDate: new Date("2024-08-01"),
    imageUrl: null,
    categories: ["strategy", "action"],
  },
  {
    slug: "starlight-vale",
    title: "Starlight Vale",
    description:
      "A cozy RPG about rebuilding a village of exiled star-mages.",
    price: 34.99,
    releaseDate: new Date("2026-11-20"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "crimson-siege",
    title: "Crimson Siege",
    description:
      "A brutal action-strategy hybrid about defending the last free fortress on a fallen continent.",
    price: 54.99,
    releaseDate: new Date("2026-06-01"),
    imageUrl: null,
    categories: ["action", "strategy"],
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  for (const { categories: categorySlugs, ...data } of games) {
    await prisma.game.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        categories: {
          connect: categorySlugs.map((slug) => ({ slug })),
        },
      },
    });
  }

  console.log(
    `Seeded ${categories.length} categories and ${games.length} games.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
