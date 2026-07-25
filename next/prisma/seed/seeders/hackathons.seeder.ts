// prisma/seed/seeders/hackathons.seeder.ts
import { PrismaClient } from "../../../src/generated/prisma";
import { hackathons } from "../data/hackathons";
import { users } from "../data/users";

interface Maps {
  techMap: Record<string, string>;
  catMap: Record<string, string>;
  userIdList: string[];
}

export async function seedHackathons(
  prisma: PrismaClient,
  { techMap, catMap, userIdList }: Maps
) {
  console.log("  🏆 Seeding hackathons...");
  const hackathonMap: Record<string, string> = {};

  for (const h of hackathons) {
    // ── 1. Upsert the hackathon ──────────────────────────────
    const hack = await prisma.hackathon.upsert({
      where: { slug: h.slug },
      update: {
        title: h.title,
        shortDescription: h.shortDescription,
        organizer: h.organizer,
        mode: h.mode,
        location: h.location,
        status: h.status,
        visibility: h.visibility,
        startDate: h.startDate,
        endDate: h.endDate,
        registrationDeadline: h.registrationDeadline,
        prizePool: h.prizePool,
        minTeamSize: h.minTeamSize,
        maxTeamSize: h.maxTeamSize,
        registrationPlatform: h.registrationPlatform,
        registrationType: h.registrationType,
        registrationFeeType: h.registrationFeeType,
        registrationFee: h.registrationFee,
        organizerType: h.organizerType,
        difficulty: h.difficulty,
        certificateType: h.certificateType,
        website: h.website,
        registrationLink: h.registrationLink,
      },
      create: {
        title: h.title,
        slug: h.slug,
        shortDescription: h.shortDescription,
        organizer: h.organizer,
        mode: h.mode,
        location: h.location,
        status: h.status,
        visibility: h.visibility,
        startDate: h.startDate,
        endDate: h.endDate,
        registrationDeadline: h.registrationDeadline,
        prizePool: h.prizePool,
        minTeamSize: h.minTeamSize,
        maxTeamSize: h.maxTeamSize,
        registrationPlatform: h.registrationPlatform,
        registrationType: h.registrationType,
        registrationFeeType: h.registrationFeeType,
        registrationFee: h.registrationFee,
        organizerType: h.organizerType,
        difficulty: h.difficulty,
        certificateType: h.certificateType,
        website: h.website,
        registrationLink: h.registrationLink,
        createdById: userIdList[h.ownerIndex],
      },
    });
    hackathonMap[h.slug] = hack.id;

    // ── 2. Owner member ──────────────────────────────────────
    await prisma.hackathonMember.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: hack.id,
          userId: userIdList[h.ownerIndex],
        },
      },
      update: {},
      create: {
        hackathonId: hack.id,
        userId: userIdList[h.ownerIndex],
        role: "OWNER",
      },
    });

    // ── 3. Extra members ──────────────────────────────────────
    for (const m of h.members) {
      await prisma.hackathonMember
        .upsert({
          where: {
            hackathonId_userId: {
              hackathonId: hack.id,
              userId: userIdList[m.userIndex],
            },
          },
          update: { role: m.role },
          create: {
            hackathonId: hack.id,
            userId: userIdList[m.userIndex],
            role: m.role,
          },
        })
        .catch(() => {}); // skip if same user already owner
    }

    // ── 4. Categories ─────────────────────────────────────────
    for (const slug of h.categorySlugs) {
      const catId = catMap[slug];
      if (!catId) {
        console.warn(`     ⚠ Unknown category slug: ${slug}`);
        continue;
      }
      await prisma.hackathonCategory
        .create({ data: { hackathonId: hack.id, categoryId: catId } })
        .catch(() => {}); // ignore duplicate
    }

    // ── 5. Technologies ───────────────────────────────────────
    for (const slug of h.technologySlugs) {
      const techId = techMap[slug];
      if (!techId) {
        console.warn(`     ⚠ Unknown technology slug: ${slug}`);
        continue;
      }
      await prisma.hackathonTechnology
        .create({ data: { hackathonId: hack.id, technologyId: techId } })
        .catch(() => {}); // ignore duplicate
    }

    // ── 6. Eligibilities ──────────────────────────────────────
    for (const type of h.eligibilities) {
      await prisma.hackathonEligibility
        .create({ data: { hackathonId: hack.id, type } })
        .catch(() => {}); // ignore duplicate
    }

    console.log(`     ✓ ${h.title} [${h.status}] [${h.visibility}]`);
  }

  // ── 7. Add some bookmarks for realism ──────────────────────
  const bookmarks: [string, number][] = [
    ["ethglobal-new-delhi-2026", 1],
    ["ethglobal-new-delhi-2026", 3],
    ["sih-2026", 2],
    ["sih-2026", 5],
    ["mlh-ghw-ai-2026", 6],
    ["hackmit-2026", 0],
    ["hackmit-2026", 7],
    ["defi-builders-summit-2026", 1],
    ["cyberstrike-ctf-2026", 3],
  ];
  for (const [slug, uIdx] of bookmarks) {
    const hid = hackathonMap[slug];
    const uid = userIdList[uIdx];
    if (hid && uid) {
      await prisma.hackathonBookmark
        .create({ data: { hackathonId: hid, userId: uid } })
        .catch(() => {});
    }
  }
  console.log(`     ✓ ${bookmarks.length} bookmarks added`);

  return hackathonMap;
}
