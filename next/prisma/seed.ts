// prisma/seed.ts
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Users
  const alice = await prisma.user.upsert({
    where: { email: "alice@kizunia.dev" },
    update: {},
    create: {
      name: "Alice",
      email: "alice@kizunia.dev",
      username: "alice",
      displayUsername: "alice",
      role: "user",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@kizunia.dev" },
    update: {},
    create: {
      name: "Bob",
      email: "bob@kizunia.dev",
      username: "bob",
      displayUsername: "bob",
      role: "user",
    },
  });

  // Categories
  const ai = await prisma.category.upsert({
    where: { slug: "ai" },
    update: {},
    create: { name: "AI", slug: "ai" },
  });

  const web3 = await prisma.category.upsert({
    where: { slug: "web3" },
    update: {},
    create: { name: "Web3", slug: "web3" },
  });

  // Technologies
  const react = await prisma.technology.upsert({
    where: { slug: "react" },
    update: {},
    create: { name: "React", slug: "react" },
  });

  const flutter = await prisma.technology.upsert({
    where: { slug: "flutter" },
    update: {},
    create: { name: "Flutter", slug: "flutter" },
  });

  const competitions = [
    {
      title: "AI React Challenge",
      slug: "ai-react-challenge",
      mode: "OFFLINE",
      registrationFeeType: "FREE",
      registrationPlatform: "UNSTOP",
      difficulty: "BEGINNER",
      organizerType: "COMPANY",
      organizer: "Google",
      minTeamSize: 2,
      maxTeamSize: 5,
      registrationDeadline: new Date("2026-09-15"),
      owner: alice.id,
      categories: [ai.id, web3.id],
      technologies: [react.id, flutter.id],
      eligibilities: ["UNDERGRADUATE"],
    },
    {
      title: "Flutter Buildathon",
      slug: "flutter-buildathon",
      mode: "OFFLINE",
      registrationFeeType: "FREE",
      registrationPlatform: "DEVFOLIO",
      difficulty: "INTERMEDIATE",
      organizerType: "COLLEGE",
      organizer: "VIT Pune",
      minTeamSize: 2,
      maxTeamSize: 4,
      registrationDeadline: new Date("2026-09-10"),
      owner: bob.id,
      categories: [ai.id],
      technologies: [flutter.id],
      eligibilities: ["UNDERGRADUATE"],
    },
    {
      title: "Web3 Online Sprint",
      slug: "web3-online-sprint",
      mode: "ONLINE",
      registrationFeeType: "FREE",
      registrationPlatform: "DEVPOST",
      difficulty: "BEGINNER",
      organizerType: "COMMUNITY",
      organizer: "ETH India",
      minTeamSize: 1,
      maxTeamSize: 6,
      registrationDeadline: new Date("2026-09-25"),
      owner: alice.id,
      categories: [web3.id],
      technologies: [react.id],
      eligibilities: ["POSTGRADUATE"],
    },
    {
      title: "Cyber Cup",
      slug: "cyber-cup",
      mode: "HYBRID",
      registrationFeeType: "PAID",
      registrationPlatform: "LUMA",
      difficulty: "ADVANCED",
      organizerType: "COMPANY",
      organizer: "Microsoft",
      minTeamSize: 3,
      maxTeamSize: 5,
      registrationDeadline: new Date("2026-08-20"),
      owner: bob.id,
      categories: [ai.id],
      technologies: [react.id],
      eligibilities: ["UNDERGRADUATE","POSTGRADUATE"],
    },
    {
      title: "NextGen AI Hack",
      slug: "nextgen-ai-hack",
      mode: "OFFLINE",
      registrationFeeType: "FREE",
      registrationPlatform: "UNSTOP",
      difficulty: "INTERMEDIATE",
      organizerType: "COMPANY",
      organizer: "OpenAI",
      minTeamSize: 2,
      maxTeamSize: 5,
      registrationDeadline: new Date("2026-09-18"),
      owner: alice.id,
      categories: [ai.id],
      technologies: [react.id, flutter.id],
      eligibilities: ["UNDERGRADUATE"],
    }
  ];

  for (const c of competitions) {
    const comp = await prisma.hackathon.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        title: c.title,
        slug: c.slug,
        mode: c.mode as any,
        registrationFeeType: c.registrationFeeType as any,
        registrationPlatform: c.registrationPlatform as any,
        difficulty: c.difficulty as any,
        organizerType: c.organizerType as any,
        organizer: c.organizer,
        minTeamSize: c.minTeamSize,
        maxTeamSize: c.maxTeamSize,
        registrationDeadline: c.registrationDeadline,
      },
    });

    await prisma.hackathonMember.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: comp.id,
          userId: c.owner,
        },
      },
      update: {},
      create: {
        hackathonId: comp.id,
        userId: c.owner,
        role: "OWNER",
      },
    });

    for (const catId of c.categories) {
      await prisma.hackathonCategory.create({
        data: { hackathonId: comp.id, categoryId: catId },
      }).catch(()=>{});
    }

    for (const techId of c.technologies) {
      await prisma.hackathonTechnology.create({
        data: { hackathonId: comp.id, technologyId: techId },
      }).catch(()=>{});
    }

    for (const type of c.eligibilities) {
      await prisma.hackathonEligibility.create({
        data: {
          hackathonId: comp.id,
          type: type as any,
        },
      }).catch(()=>{});
    }
  }

  console.log("Seed complete");
}

main()
.finally(()=>prisma.$disconnect())
.catch(async(e)=>{
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
