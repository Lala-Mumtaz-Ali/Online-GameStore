import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Action", slug: "action" },
  { name: "RPG", slug: "rpg" },
  { name: "Strategy", slug: "strategy" },
];

/**
 * Cover art is hotlinked from Steam's public CDN, keyed by Steam app id.
 *
 * `library_600x900` is the portrait store capsule, which suits the 3:4 card in
 * GameCard far better than the landscape `header.jpg`.
 *
 * Two caveats worth stating plainly:
 *  - These images are publisher-owned and served from infrastructure this
 *    project does not control, so they can change or stop resolving. Run
 *    `npx tsx scripts/verify-game-images.ts` to check them.
 *  - Descriptions below are written for this project rather than copied from
 *    any store listing.
 */
function cover(appId: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
}

const games = [
  // ---- Action -------------------------------------------------------------
  {
    appId: 782330,
    slug: "doom-eternal",
    title: "DOOM Eternal",
    description:
      "A relentless first-person shooter built around aggression: resources come from finishing enemies, so retreating is rarely the answer.",
    price: 39.99,
    releaseDate: new Date("2020-03-20"),
    categories: ["action"],
  },
  {
    appId: 814380,
    slug: "sekiro-shadows-die-twice",
    title: "Sekiro: Shadows Die Twice",
    description:
      "A punishing action game about posture and timing, where deflecting a blow matters more than dodging it.",
    price: 59.99,
    releaseDate: new Date("2019-03-22"),
    categories: ["action"],
  },
  {
    appId: 1145360,
    slug: "hades",
    title: "Hades",
    description:
      "A roguelike about escaping the underworld, where every failed run advances the story rather than resetting it.",
    price: 24.99,
    releaseDate: new Date("2020-09-17"),
    categories: ["action", "rpg"],
  },
  {
    appId: 601150,
    slug: "devil-may-cry-5",
    title: "Devil May Cry 5",
    description:
      "A stylish character-action game scored on how inventively you chain combos rather than how quickly you win.",
    price: 29.99,
    releaseDate: new Date("2019-03-08"),
    categories: ["action"],
  },
  {
    appId: 367520,
    slug: "hollow-knight",
    title: "Hollow Knight",
    description:
      "A hand-drawn metroidvania set in a ruined insect kingdom that explains almost nothing and rewards curiosity.",
    price: 14.99,
    releaseDate: new Date("2017-02-24"),
    categories: ["action"],
  },
  {
    appId: 504230,
    slug: "celeste",
    title: "Celeste",
    description:
      "A precision platformer about climbing a mountain, with a story about anxiety that never lectures you.",
    price: 19.99,
    releaseDate: new Date("2018-01-25"),
    categories: ["action"],
  },
  {
    appId: 870780,
    slug: "control-ultimate-edition",
    title: "Control Ultimate Edition",
    description:
      "A supernatural shooter set in a government building that rearranges itself, with telekinesis as the main weapon.",
    price: 39.99,
    releaseDate: new Date("2019-08-27"),
    categories: ["action"],
  },
  {
    appId: 1237970,
    slug: "titanfall-2",
    title: "Titanfall 2",
    description:
      "A movement-driven shooter whose campaign keeps inventing a new mechanic and discarding it a level later.",
    price: 29.99,
    releaseDate: new Date("2016-10-28"),
    categories: ["action"],
  },
  {
    appId: 588650,
    slug: "dead-cells",
    title: "Dead Cells",
    description:
      "A fast roguelite where death is the main progression system and every weapon changes how you move.",
    price: 24.99,
    releaseDate: new Date("2018-08-07"),
    categories: ["action"],
  },
  {
    appId: 235460,
    slug: "metal-gear-rising-revengeance",
    title: "Metal Gear Rising: Revengeance",
    description:
      "An action game built around a free-aimed cutting mechanic that lets you slice almost anything apart.",
    price: 19.99,
    releaseDate: new Date("2014-01-09"),
    categories: ["action"],
  },
  {
    appId: 1139900,
    slug: "ghostrunner",
    title: "Ghostrunner",
    description:
      "A one-hit-kill cyberpunk platformer where every encounter is closer to a puzzle than a firefight.",
    price: 29.99,
    releaseDate: new Date("2020-10-27"),
    categories: ["action"],
  },
  {
    appId: 582010,
    slug: "monster-hunter-world",
    title: "Monster Hunter: World",
    description:
      "A hunting game about learning one creature's tells well enough to beat it with a weapon that takes hours to master.",
    price: 29.99,
    releaseDate: new Date("2018-08-09"),
    categories: ["action", "rpg"],
  },
  {
    appId: 2050650,
    slug: "resident-evil-4",
    title: "Resident Evil 4",
    description:
      "A remake of the survival-horror benchmark, rebuilt around resource pressure and a knife that can now break.",
    price: 39.99,
    releaseDate: new Date("2023-03-24"),
    categories: ["action"],
  },
  {
    appId: 1057090,
    slug: "ori-and-the-will-of-the-wisps",
    title: "Ori and the Will of the Wisps",
    description:
      "A painterly platformer with tight movement and a soundtrack doing as much narrative work as the script.",
    price: 29.99,
    releaseDate: new Date("2020-03-11"),
    categories: ["action"],
  },

  // ---- RPG ----------------------------------------------------------------
  {
    appId: 292030,
    slug: "the-witcher-3-wild-hunt",
    title: "The Witcher 3: Wild Hunt",
    description:
      "An open-world RPG whose side quests are frequently better written than most games' main stories.",
    price: 39.99,
    releaseDate: new Date("2015-05-18"),
    categories: ["rpg", "action"],
  },
  {
    appId: 1245620,
    slug: "elden-ring",
    title: "ELDEN RING",
    description:
      "An open-world action RPG that marks nothing on your map and trusts you to go and find out.",
    price: 59.99,
    releaseDate: new Date("2022-02-25"),
    categories: ["rpg", "action"],
  },
  {
    appId: 1086940,
    slug: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    description:
      "A tabletop-faithful RPG that will let almost any plan work, including the ones it clearly did not expect.",
    price: 59.99,
    releaseDate: new Date("2023-08-03"),
    categories: ["rpg", "strategy"],
  },
  {
    appId: 435150,
    slug: "divinity-original-sin-2",
    title: "Divinity: Original Sin 2",
    description:
      "A turn-based RPG with elemental surfaces that interact, so most fights can be won by rearranging the terrain.",
    price: 44.99,
    releaseDate: new Date("2017-09-14"),
    categories: ["rpg", "strategy"],
  },
  {
    appId: 632470,
    slug: "disco-elysium",
    title: "Disco Elysium",
    description:
      "A detective RPG with no combat, where the skills you invest in argue with you about what happened.",
    price: 39.99,
    releaseDate: new Date("2019-10-15"),
    categories: ["rpg"],
  },
  {
    appId: 1091500,
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    description:
      "A first-person RPG in a dense future city, built around augmentations that reshape how you approach a job.",
    price: 49.99,
    releaseDate: new Date("2020-12-10"),
    categories: ["rpg", "action"],
  },
  {
    appId: 489830,
    slug: "the-elder-scrolls-v-skyrim-special-edition",
    title: "The Elder Scrolls V: Skyrim Special Edition",
    description:
      "The open-world RPG that most people describe by the detour they took rather than the plot.",
    price: 39.99,
    releaseDate: new Date("2016-10-28"),
    categories: ["rpg"],
  },
  {
    appId: 377160,
    slug: "fallout-4",
    title: "Fallout 4",
    description:
      "A post-apocalyptic RPG that quietly becomes a settlement-building game if you let it.",
    price: 29.99,
    releaseDate: new Date("2015-11-10"),
    categories: ["rpg", "action"],
  },
  {
    appId: 374320,
    slug: "dark-souls-iii",
    title: "DARK SOULS III",
    description:
      "An action RPG about pattern recognition, with level design that keeps folding back on itself.",
    price: 59.99,
    releaseDate: new Date("2016-04-11"),
    categories: ["rpg", "action"],
  },
  {
    appId: 524220,
    slug: "nier-automata",
    title: "NieR:Automata",
    description:
      "An action RPG that changes genre between chapters and expects you to finish it more than once.",
    price: 39.99,
    releaseDate: new Date("2017-03-17"),
    categories: ["rpg", "action"],
  },
  {
    appId: 1687950,
    slug: "persona-5-royal",
    title: "Persona 5 Royal",
    description:
      "A turn-based RPG split between dungeon crawling and a calendar where your free time is the real resource.",
    price: 59.99,
    releaseDate: new Date("2022-10-21"),
    categories: ["rpg"],
  },
  {
    appId: 379430,
    slug: "kingdom-come-deliverance",
    title: "Kingdom Come: Deliverance",
    description:
      "A historical RPG with no magic, where your character is genuinely bad at everything until trained.",
    price: 29.99,
    releaseDate: new Date("2018-02-13"),
    categories: ["rpg"],
  },
  {
    appId: 1328670,
    slug: "mass-effect-legendary-edition",
    title: "Mass Effect Legendary Edition",
    description:
      "Three remastered science-fiction RPGs in which decisions carry forward across the whole trilogy.",
    price: 59.99,
    releaseDate: new Date("2021-05-14"),
    categories: ["rpg", "action"],
  },

  // ---- Strategy -----------------------------------------------------------
  {
    appId: 289070,
    slug: "sid-meiers-civilization-vi",
    title: "Sid Meier's Civilization VI",
    description:
      "A turn-based 4X where cities spread across tiles, so where you build matters as much as what.",
    price: 59.99,
    releaseDate: new Date("2016-10-21"),
    categories: ["strategy"],
  },
  {
    appId: 1142710,
    slug: "total-war-warhammer-iii",
    title: "Total War: WARHAMMER III",
    description:
      "A campaign map paired with real-time battles, where each faction plays by noticeably different rules.",
    price: 59.99,
    releaseDate: new Date("2022-02-17"),
    categories: ["strategy"],
  },
  {
    appId: 1466860,
    slug: "age-of-empires-iv",
    title: "Age of Empires IV",
    description:
      "A real-time strategy game about ages, walls, and getting your economy up before the first raid lands.",
    price: 59.99,
    releaseDate: new Date("2021-10-28"),
    categories: ["strategy"],
  },
  {
    appId: 268500,
    slug: "xcom-2",
    title: "XCOM 2",
    description:
      "Turn-based tactics where the campaign is a resource crisis and every soldier you lose stays lost.",
    price: 59.99,
    releaseDate: new Date("2016-02-05"),
    categories: ["strategy"],
  },
  {
    appId: 281990,
    slug: "stellaris",
    title: "Stellaris",
    description:
      "A grand strategy game about governing a galactic empire, where the early exploration is the best part.",
    price: 39.99,
    releaseDate: new Date("2016-05-09"),
    categories: ["strategy"],
  },
  {
    appId: 1158310,
    slug: "crusader-kings-iii",
    title: "Crusader Kings III",
    description:
      "A grand strategy game played as a dynasty, where inheritance law causes more wars than ambition.",
    price: 49.99,
    releaseDate: new Date("2020-09-01"),
    categories: ["strategy", "rpg"],
  },
  {
    appId: 394360,
    slug: "hearts-of-iron-iv",
    title: "Hearts of Iron IV",
    description:
      "A wargame where production lines and supply reach decide far more battles than tactics do.",
    price: 49.99,
    releaseDate: new Date("2016-06-06"),
    categories: ["strategy"],
  },
  {
    appId: 323190,
    slug: "frostpunk",
    title: "Frostpunk",
    description:
      "A city builder about rationing heat and dignity, where every law you pass costs something.",
    price: 29.99,
    releaseDate: new Date("2018-04-24"),
    categories: ["strategy"],
  },
  {
    appId: 590380,
    slug: "into-the-breach",
    title: "Into the Breach",
    description:
      "Turn-based tactics with perfect information: you always know what the enemy will do, and it is still hard.",
    price: 14.99,
    releaseDate: new Date("2018-02-27"),
    categories: ["strategy"],
  },
  {
    appId: 294100,
    slug: "rimworld",
    title: "RimWorld",
    description:
      "A colony simulator whose story generator is genuinely better at drama than most scripted campaigns.",
    price: 34.99,
    releaseDate: new Date("2018-10-17"),
    categories: ["strategy"],
  },
  {
    appId: 427520,
    slug: "factorio",
    title: "Factorio",
    description:
      "A factory-building game about turning a working system into a faster one, forever.",
    price: 35.0,
    releaseDate: new Date("2020-08-14"),
    categories: ["strategy"],
  },
  {
    appId: 255710,
    slug: "cities-skylines",
    title: "Cities: Skylines",
    description:
      "A city builder where traffic is the real antagonist and zoning is the only weapon.",
    price: 29.99,
    releaseDate: new Date("2015-03-10"),
    categories: ["strategy"],
  },
  {
    appId: 261550,
    slug: "mount-and-blade-ii-bannerlord",
    title: "Mount & Blade II: Bannerlord",
    description:
      "A medieval sandbox that starts with one horse and ends with a claim to a kingdom.",
    price: 49.99,
    releaseDate: new Date("2022-10-25"),
    categories: ["strategy", "rpg"],
  },
];

/**
 * The catalogue previously seeded 40 invented titles, which had no real cover
 * art to attach. They are removed here so the store does not end up holding
 * both sets.
 *
 * Anything a customer has actually bought or preordered is kept: deleting it
 * would null out OrderItem.gameId and silently drop the game from that
 * customer's library. Those are reported instead of removed.
 */
const LEGACY_PLACEHOLDER_SLUGS = [
  "shadow-of-the-ronin",
  "ember-kingdom",
  "tactics-of-aurelia",
  "neon-vanguard",
  "wanderers-requiem",
  "ironclad-empires",
  "starlight-vale",
  "crimson-siege",
  "aether-drift",
  "the-hollow-crown",
  "frostline-protocol",
  "vermillion-hunt",
  "saltmarsh-chronicle",
  "orbital-dominion",
  "blackpowder-creed",
  "lanterns-of-yuhai",
  "steel-covenant",
  "duskfall-arena",
  "greenwarden",
  "cartel-of-thorns",
  "midnight-cadence",
  "the-long-inheritance",
  "siege-of-varn",
  "rustborn",
  "oath-of-the-pale-sun",
  "tidebreaker",
  "glasswright",
  "province-of-ash",
  "hellion-run",
  "the-cartographers-debt",
  "clockwork-dominion",
  "ashen-veil",
  "song-of-the-drowned",
  "banner-and-bone",
  "voidlark",
  "quiet-harvest",
  "thronefall-doctrine",
  "gunmetal-liturgy",
  "the-amber-court",
  "last-light-outpost",
];

async function removeLegacyPlaceholders() {
  const legacy = await prisma.game.findMany({
    where: { slug: { in: LEGACY_PLACEHOLDER_SLUGS } },
    select: {
      id: true,
      slug: true,
      _count: { select: { orderItems: true, preorders: true } },
    },
  });

  if (legacy.length === 0) return;

  const owned = legacy.filter((g) => g._count.orderItems > 0 || g._count.preorders > 0);
  const removable = legacy.filter((g) => !owned.includes(g));

  if (removable.length > 0) {
    await prisma.game.deleteMany({ where: { id: { in: removable.map((g) => g.id) } } });
    console.log(`Removed ${removable.length} placeholder game(s).`);
  }

  if (owned.length > 0) {
    console.log(
      `Kept ${owned.length} placeholder game(s) that customers already own or preordered:`
    );
    for (const game of owned) console.log(`  ${game.slug}`);
  }
}

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

  for (const { categories: categorySlugs, appId, ...data } of games) {
    const imageUrl = cover(appId);

    await prisma.game.upsert({
      where: { slug: data.slug },
      // Only the cover is refreshed on re-runs, so prices and descriptions
      // edited in the admin dashboard are not silently reverted.
      update: { imageUrl },
      create: {
        ...data,
        imageUrl,
        categories: { connect: categorySlugs.map((slug) => ({ slug })) },
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${games.length} games.`);

  await removeLegacyPlaceholders();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
