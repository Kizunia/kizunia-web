// prisma/seed.ts
// ─────────────────────────────────────────────────────────────────────────────
// Kizunia Seed — Main Orchestrator
//
// Structure:
//   prisma/
//   ├── seed.ts                    ← this file (entry point)
//   └── seed/
//       ├── data/
//       │   ├── users.ts           ← 8 diverse user profiles
//       │   ├── technologies.ts    ← 43 technologies across all stacks
//       │   ├── categories.ts      ← 20 hackathon theme categories
//       │   ├── badges.ts          ← 10 achievement badges
//       │   ├── hackathons.ts      ← 25 hackathons (real-inspired + fictional)
//       │   └── projects.ts        ← 6 projects submitted to hackathons
//       └── seeders/
//           ├── users.seeder.ts
//           ├── taxonomy.seeder.ts
//           ├── user-enrichment.seeder.ts
//           ├── hackathons.seeder.ts
//           ├── projects.seeder.ts
//           └── suggestions.seeder.ts
//
// Run:  pnpm prisma db seed
//       (or: npx prisma db seed)
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "../src/generated/prisma";
import { users } from "./seed/data/users";
import { seedUsers } from "./seed/seeders/users.seeder";
import { seedTaxonomy } from "./seed/seeders/taxonomy.seeder";
import { seedUserEnrichment } from "./seed/seeders/user-enrichment.seeder";
import { seedHackathons } from "./seed/seeders/hackathons.seeder";
import { seedProjects } from "./seed/seeders/projects.seeder";
import { seedSuggestions } from "./seed/seeders/suggestions.seeder";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🌱 Kizunia Seed Starting...\n");

  // ── Step 1: Users ──────────────────────────────────────────
  await seedUsers(prisma);

  // Build ordered ID list matching the users array index order
  // (fetched from DB so we get the actual persisted IDs)
  const userRecords = await prisma.user.findMany({
    where: { email: { in: users.map((u) => u.email) } },
    select: { id: true, email: true },
  });
  const emailToId = Object.fromEntries(userRecords.map((u) => [u.email, u.id]));
  const userIdList = users.map((u) => emailToId[u.email]!);

  // ── Step 2: Taxonomy (tech, categories, badges) ────────────
  const { techMap, catMap, badgeMap } = await seedTaxonomy(prisma);

  // ── Step 3: User enrichment (interests, badges, prefs) ─────
  await seedUserEnrichment(prisma, { techMap, catMap, badgeMap, userIdList });

  // ── Step 4: Hackathons ─────────────────────────────────────
  const hackathonMap = await seedHackathons(prisma, {
    techMap,
    catMap,
    userIdList,
  });

  // ── Step 5: Projects ───────────────────────────────────────
  await seedProjects(prisma, {
    techMap,
    catMap,
    badgeMap,
    userIdList,
    hackathonMap,
  });

  // ── Step 6: Suggestions ────────────────────────────────────
  await seedSuggestions(prisma, {
    catMap,
    techMap,
    userIdList,
    hackathonMap,
  });

  // ── Summary ────────────────────────────────────────────────
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.hackathon.count(),
    prisma.project.count(),
    prisma.technology.count(),
    prisma.category.count(),
    prisma.badge.count(),
    prisma.hackathonSuggestion.count(),
    prisma.hackathonBookmark.count(),
  ]);

  console.log("\n✅ Seed Complete!\n");
  console.log("📊 Database Summary:");
  console.log(`   Users              : ${counts[0]}`);
  console.log(`   Hackathons         : ${counts[1]}`);
  console.log(`   Projects           : ${counts[2]}`);
  console.log(`   Technologies       : ${counts[3]}`);
  console.log(`   Categories         : ${counts[4]}`);
  console.log(`   Badges             : ${counts[5]}`);
  console.log(`   Suggestions        : ${counts[6]}`);
  console.log(`   Bookmarks          : ${counts[7]}`);
  console.log("");
}

main()
  .catch(async (e) => {
    console.error("\n❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
