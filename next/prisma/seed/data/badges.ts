// prisma/seed/data/badges.ts
// Badges for users and projects — achievement, verification, and community badges.

export const badges = [
  { name: "Verified Organizer", description: "Verified hackathon organizer on Kizunia" },
  { name: "Top Contributor", description: "Recognized for outstanding contributions" },
  { name: "Hackathon Winner", description: "Won at least one hackathon" },
  { name: "3x Winner", description: "Won three or more hackathons" },
  { name: "Early Adopter", description: "Joined Kizunia during beta" },
  { name: "Open Source Hero", description: "Significant open-source contributions" },
  { name: "Community Leader", description: "Leading a developer community" },
  { name: "Rising Star", description: "Promising newcomer in the community" },
  { name: "Bug Hunter", description: "Found and reported critical bugs" },
  { name: "Mentor", description: "Mentored participants in hackathons" },
] as const;
