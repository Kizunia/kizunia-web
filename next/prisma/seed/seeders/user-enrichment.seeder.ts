// prisma/seed/seeders/user-enrichment.seeder.ts
// Seeds user technologies, categories, badges, and notification preferences.
import { PrismaClient } from "../../../src/generated/prisma";
import { users } from "../data/users";

interface Maps {
  techMap: Record<string, string>;
  catMap: Record<string, string>;
  badgeMap: Record<string, string>;
  userIdList: string[];
}

// Per-user technology and category interests + badges
const userEnrichments: {
  index: number;
  technologies: string[];
  categories: string[];
  badges: string[];
}[] = [
  {
    index: 0, // Priya — admin / organizer
    technologies: ["react", "nextjs", "nodejs", "postgresql", "docker", "github-actions"],
    categories: ["web-dev", "ai", "open-source", "social-impact"],
    badges: ["Verified Organizer", "Community Leader", "Early Adopter"],
  },
  {
    index: 1, // Arjun — ML engineer
    technologies: ["python", "pytorch", "tensorflow", "langchain", "openai-api", "fastapi"],
    categories: ["ai", "ml", "genai-llms", "data-science"],
    badges: ["Hackathon Winner", "Rising Star", "Early Adopter"],
  },
  {
    index: 2, // Sara — blockchain dev
    technologies: ["solidity", "ethereum", "solana", "rust", "react", "ipfs"],
    categories: ["web3", "fintech", "open-source"],
    badges: ["Verified Organizer", "Open Source Hero"],
  },
  {
    index: 3, // Rahul — Flutter / mobile
    technologies: ["flutter", "react-native", "kotlin", "firebase", "dart"],
    categories: ["mobile-dev", "iot", "sustainability"],
    badges: ["3x Winner", "Hackathon Winner"],
  },
  {
    index: 4, // Emily — DevOps / cloud
    technologies: ["aws", "docker", "kubernetes", "terraform", "golang", "github-actions"],
    categories: ["cloud-devops", "dev-tools", "cybersecurity"],
    badges: ["Verified Organizer", "Top Contributor"],
  },
  {
    index: 5, // Karthik — cybersecurity
    technologies: ["python", "rust", "docker"],
    categories: ["cybersecurity", "open-source"],
    badges: ["Bug Hunter", "Hackathon Winner"],
  },
  {
    index: 6, // Aisha — designer / frontend
    technologies: ["figma", "react", "tailwindcss", "svelte"],
    categories: ["design-ux", "web-dev", "edtech"],
    badges: ["Rising Star", "Early Adopter"],
  },
  {
    index: 7, // James — data scientist
    technologies: ["python", "pytorch", "huggingface", "langchain", "postgresql", "fastapi"],
    categories: ["ml", "data-science", "healthtech", "ai"],
    badges: ["Top Contributor", "Mentor"],
  },
];

export async function seedUserEnrichment(
  prisma: PrismaClient,
  { techMap, catMap, badgeMap, userIdList }: Maps
) {
  console.log("  🔗 Seeding user technologies, categories & badges...");

  for (const enrichment of userEnrichments) {
    const userId = userIdList[enrichment.index];
    if (!userId) continue;

    // Technologies
    for (const slug of enrichment.technologies) {
      const techId = techMap[slug];
      if (!techId) continue;
      await prisma.userTechnology
        .create({ data: { userId, technologyId: techId } })
        .catch(() => {});
    }

    // Categories
    for (const slug of enrichment.categories) {
      const catId = catMap[slug];
      if (!catId) continue;
      await prisma.userCategory
        .create({ data: { userId, categoryId: catId } })
        .catch(() => {});
    }

    // Badges
    for (const name of enrichment.badges) {
      const badgeId = badgeMap[name];
      if (!badgeId) continue;
      await prisma.userBadge
        .create({ data: { userId, badgeId } })
        .catch(() => {});
    }

    // Notification preferences (one per user)
    await prisma.notificationPreference
      .upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          emailNotifications: true,
          pushNotifications: enrichment.index < 4, // first 4 users have push on
          preferences: {
            hackathonReminders: true,
            newHackathons: enrichment.index % 2 === 0,
            weeklyDigest: true,
          },
        },
      })
      .catch(() => {});

    console.log(`     ✓ User #${enrichment.index + 1} enriched`);
  }
}
