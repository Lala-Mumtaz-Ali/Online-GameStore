import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Action", slug: "action" },
  { name: "RPG", slug: "rpg" },
  { name: "Strategy", slug: "strategy" },
];

// Deliberately more than one page worth (the storefront shows 24 per page) with
// a spread of prices and both past and future release dates, so pagination,
// sorting, and the new/upcoming filters are all visibly exercised after seeding.
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
    description: "A cozy RPG about rebuilding a village of exiled star-mages.",
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
  {
    slug: "aether-drift",
    title: "Aether Drift",
    description:
      "A weightless combat racer through the shattered rings of a dead gas giant.",
    price: 24.99,
    releaseDate: new Date("2025-04-18"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "the-hollow-crown",
    title: "The Hollow Crown",
    description:
      "A political RPG where every throne you claim costs you an ally you cannot replace.",
    price: 59.99,
    releaseDate: new Date("2025-02-28"),
    imageUrl: null,
    categories: ["rpg", "strategy"],
  },
  {
    slug: "frostline-protocol",
    title: "Frostline Protocol",
    description:
      "A tense survival strategy game about keeping a research colony alive through an endless winter.",
    price: 34.99,
    releaseDate: new Date("2024-11-05"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "vermillion-hunt",
    title: "Vermillion Hunt",
    description:
      "A monster-hunting action game built around reading tells and punishing patience.",
    price: 49.99,
    releaseDate: new Date("2025-07-22"),
    imageUrl: null,
    categories: ["action", "rpg"],
  },
  {
    slug: "saltmarsh-chronicle",
    title: "Saltmarsh Chronicle",
    description:
      "A slow-burning RPG about a coastal town whose tide has stopped going out.",
    price: 29.99,
    releaseDate: new Date("2024-06-12"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "orbital-dominion",
    title: "Orbital Dominion",
    description:
      "A 4X strategy game where the map is a solar system and the terrain is orbital mechanics.",
    price: 44.99,
    releaseDate: new Date("2026-08-14"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "blackpowder-creed",
    title: "Blackpowder Creed",
    description:
      "A flintlock-era action game about a duellist working through a list of names.",
    price: 39.99,
    releaseDate: new Date("2025-09-30"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "lanterns-of-yuhai",
    title: "Lanterns of Yuhai",
    description:
      "An RPG about a festival that resurrects the dead for one night, and the girl who refuses to let it end.",
    price: 54.99,
    releaseDate: new Date("2026-12-05"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "steel-covenant",
    title: "Steel Covenant",
    description:
      "A mech-squad strategy game where every pilot who dies is gone for the rest of the campaign.",
    price: 49.99,
    releaseDate: new Date("2025-05-09"),
    imageUrl: null,
    categories: ["strategy", "action"],
  },
  {
    slug: "duskfall-arena",
    title: "Duskfall Arena",
    description:
      "A gladiatorial action game where the crowd's mood changes the rules mid-fight.",
    price: 19.99,
    releaseDate: new Date("2024-09-20"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "greenwarden",
    title: "Greenwarden",
    description:
      "A pastoral RPG about a druid rebuilding a forest that keeps growing back wrong.",
    price: 27.99,
    releaseDate: new Date("2026-07-30"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "cartel-of-thorns",
    title: "Cartel of Thorns",
    description:
      "An economic strategy game about running a smuggling empire under a hostile crown.",
    price: 32.99,
    releaseDate: new Date("2025-01-17"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "midnight-cadence",
    title: "Midnight Cadence",
    description:
      "A rhythm-action game where the soundtrack is generated by how recklessly you fight.",
    price: 22.99,
    releaseDate: new Date("2025-10-03"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "the-long-inheritance",
    title: "The Long Inheritance",
    description:
      "A generational RPG in which you play each heir of a cursed house in turn.",
    price: 64.99,
    releaseDate: new Date("2026-05-21"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "siege-of-varn",
    title: "Siege of Varn",
    description:
      "A single-map strategy game about holding one mountain pass for forty in-game days.",
    price: 18.99,
    releaseDate: new Date("2024-04-02"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "rustborn",
    title: "Rustborn",
    description:
      "A post-industrial action game about a scavenger welded into her own exosuit.",
    price: 44.99,
    releaseDate: new Date("2026-03-11"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "oath-of-the-pale-sun",
    title: "Oath of the Pale Sun",
    description: "A tactical RPG about a holy order that has quietly stopped believing.",
    price: 52.99,
    releaseDate: new Date("2025-08-08"),
    imageUrl: null,
    categories: ["rpg", "strategy"],
  },
  {
    slug: "tidebreaker",
    title: "Tidebreaker",
    description:
      "A naval action game set during the collapse of a maritime trade federation.",
    price: 37.99,
    releaseDate: new Date("2024-12-01"),
    imageUrl: null,
    categories: ["action", "strategy"],
  },
  {
    slug: "glasswright",
    title: "Glasswright",
    description:
      "A puzzle-RPG about an artisan who repairs memories the way she repairs windows.",
    price: 21.99,
    releaseDate: new Date("2026-02-14"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "province-of-ash",
    title: "Province of Ash",
    description:
      "A reconstruction strategy game about governing a region after the war you started.",
    price: 41.99,
    releaseDate: new Date("2025-03-27"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "hellion-run",
    title: "Hellion Run",
    description:
      "A roguelite action game where every death rewrites one rule of the dungeon.",
    price: 16.99,
    releaseDate: new Date("2024-07-19"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "the-cartographers-debt",
    title: "The Cartographer's Debt",
    description:
      "An exploration RPG about mapping a continent that is being erased behind you.",
    price: 46.99,
    releaseDate: new Date("2026-04-09"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "clockwork-dominion",
    title: "Clockwork Dominion",
    description:
      "A strategy game of automated armies where you program doctrine rather than issue orders.",
    price: 38.99,
    releaseDate: new Date("2025-06-16"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "ashen-veil",
    title: "Ashen Veil",
    description:
      "A stealth-action game set in a city where the fog remembers where you have been.",
    price: 33.99,
    releaseDate: new Date("2024-10-24"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "song-of-the-drowned",
    title: "Song of the Drowned",
    description:
      "An underwater RPG about a diver bargaining with the things that took her crew.",
    price: 57.99,
    releaseDate: new Date("2026-01-23"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "banner-and-bone",
    title: "Banner and Bone",
    description:
      "A medieval strategy game where morale, not numbers, decides every battle.",
    price: 29.99,
    releaseDate: new Date("2025-11-27"),
    imageUrl: null,
    categories: ["strategy"],
  },
  {
    slug: "voidlark",
    title: "Voidlark",
    description:
      "A zero-gravity action game about a courier outrunning three separate governments.",
    price: 26.99,
    releaseDate: new Date("2024-05-30"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "quiet-harvest",
    title: "Quiet Harvest",
    description:
      "A pastoral RPG about a farming village that has not aged in sixty years.",
    price: 23.99,
    releaseDate: new Date("2026-09-18"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "thronefall-doctrine",
    title: "Thronefall Doctrine",
    description:
      "A succession strategy game in which your heirs inherit your enemies as well as your lands.",
    price: 47.99,
    releaseDate: new Date("2025-09-04"),
    imageUrl: null,
    categories: ["strategy", "rpg"],
  },
  {
    slug: "gunmetal-liturgy",
    title: "Gunmetal Liturgy",
    description:
      "An action game about a lapsed war-priest whose weapons still expect prayers.",
    price: 42.99,
    releaseDate: new Date("2026-11-06"),
    imageUrl: null,
    categories: ["action"],
  },
  {
    slug: "the-amber-court",
    title: "The Amber Court",
    description: "A courtly intrigue RPG where the only combat system is conversation.",
    price: 36.99,
    releaseDate: new Date("2024-02-08"),
    imageUrl: null,
    categories: ["rpg"],
  },
  {
    slug: "last-light-outpost",
    title: "Last Light Outpost",
    description:
      "A defensive strategy game about rationing power between walls, lights, and heat.",
    price: 25.99,
    releaseDate: new Date("2025-12-11"),
    imageUrl: null,
    categories: ["strategy"],
  },
];

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  // Env-driven and skipped when absent, deliberately. A hardcoded default admin
  // credential in a public repo becomes a real vulnerability the moment someone
  // clones and deploys this.
  if (!email || !password) {
    console.log(
      "Skipping admin seed - set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one."
    );
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      password: await bcrypt.hash(password, 12),
    },
  });

  console.log(`Seeded admin ${email}.`);
}

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

  console.log(`Seeded ${categories.length} categories and ${games.length} games.`);

  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
