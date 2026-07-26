import { notFound } from "next/navigation";
import { Calendar, Globe, MapPin, Trophy, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import PageWrapper from "@/components/page-wrapper";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForwardRefEditor } from "@/components/shared/mdx/ForwardRefEditor";
import { Suspense } from "react";
import { CompetitionApi } from "@/modules/hackathons/api/hackathon-api";
import { ForwardRefMdxViewer } from "@/components/shared/mdx/ForwardRefMdxViewer";

export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    location?: string;
    organizer?: string;
    minTeamSize?: string;
  }>;
}) {
  const { slug } = await params;
  console.log("slug", slug);
  const response = await CompetitionApi.getPublic(slug);

  if (!response.success) {
    notFound();
  }

  const competition = response.data;

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Competitions", href: "/competitions" },
        { label: competition.title, href: `/competitions/${competition.slug}` },
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}

        <Card className="p-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="shrink-0">
              {competition.logoAsset ? (
                <img
                  src={competition.logoAsset.secureUrl}
                  alt={competition.title}
                  className="h-24 w-24 rounded-xl border object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-muted text-3xl font-bold">
                  {competition.title[0]}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-4xl font-bold">{competition.title}</h1>

                  <p className="mt-1 text-muted-foreground">
                    {competition.organizer}
                  </p>
                </div>

                {competition.status && (
                  <Badge>{competition.status.replaceAll("_", " ")}</Badge>
                )}
              </div>

              <p className="text-muted-foreground">
                {competition.shortDescription}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{competition.mode}</Badge>

                {competition.location && (
                  <Badge variant="outline">
                    <MapPin className="mr-1 h-3 w-3" />
                    {competition.location}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Information */}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6 space-y-4">
              <h1 className="text-4xl font-semibold">About</h1>

              {/* <Separator /> */}

              <div>
                {/* {competition.content?.content ?? "Documentation coming soon."}{" "} */}
                <Suspense fallback={null}>
                  <ForwardRefMdxViewer
                  
                    markdown={
                      competition.content?.content?? "No documentation."
                    }
//                     markdown={`
//                       # 🚀 Kizunia AI Hackathon 2026

// Welcome to the **largest student hackathon** focused on **AI**, **Open Source**, and **Developer Experience**.

// ---

// ## 📖 About

// Kizunia AI Hackathon is a **48-hour** innovation challenge where developers, designers, and creators collaborate to build impactful software.

// ### Goals

// - Learn something new
// - Build an amazing project
// - Meet talented people
// - Have fun 🚀

// > "The best way to learn is by building."

// ---

// ## 🏆 Tracks

// ### 🤖 Artificial Intelligence

// - LLM Applications
// - AI Agents
// - Computer Vision
// - NLP
// - Generative AI

// ### 🌐 Web

// - Next.js
// - React
// - TypeScript
// - TailwindCSS
// - Prisma
// - Better Auth

// ### 📱 Mobile

// - Flutter
// - React Native
// - Kotlin
// - Swift

// ---

// ## 📅 Timeline

// | Event | Date |
// |-------|------|
// | Registration Opens | Jan 1 |
// | Registration Ends | Jan 20 |
// | Team Formation | Jan 21 |
// | Submission | Jan 22 |
// | Final Demo | Jan 23 |

// ---

// ## 👥 Team Rules

// 1. Maximum **5** members.
// 2. Minimum **2** members.
// 3. Cross-college teams are allowed.
// 4. AI tools are allowed.
// 5. Judges' decisions are final.

// ---

// ## ✅ Checklist

// it is not working properly, but it is a good start. I will continue to work on it and make sure it is fully functional.

// ---

// ## 💰 Prize Pool

// | Position | Prize |
// |----------|-------|
// | 🥇 First | $2,000 |
// | 🥈 Second | $1,000 |
// | 🥉 Third | $500 |

// ---

// ## 💻 TypeScript Example



// ---

// ## 🐍 Python Example



// ---

// ## 🗄 SQL Example

// ---

// ## 🌐 JSON


// ---

// ## ⚙ Bash


// ---

// ## 📷 Image

// ![Kizunia](https://picsum.photos/800/300)

// ---

// ## 🔗 Useful Links

// - GitHub: https://github.com
// - Prisma: https://prisma.io
// - Next.js: https://nextjs.org

// ---

// ## 📌 Nested Lists

// - Frontend
//   - React
//   - Next.js
//     - App Router
//     - Server Components
// - Backend
//   - Node.js
//   - Prisma
//   - PostgreSQL

// ---

// ## 💡 Blockquote

// > Innovation distinguishes between a leader and a follower.
// >
// > — Steve Jobs

// ---

// ## 📐 Horizontal Rule

// ---

// ## 😄 Inline Formatting

// This is **bold**.

// This is *italic*.

// This is ***bold italic***.

// This is ~~strikethrough~~.



// ---

// ## 🧪 HTML

// <div style="padding:16px;border:2px solid #3b82f6;border-radius:8px;">
// This is raw HTML inside Markdown.
// </div>

// ---

// ## 📚 Long Paragraph

// Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sed turpis vitae elit faucibus luctus. Integer justo non neque ultricies hendrerit. Donec posuere, mauris ut maximus cursus, lacus arcu dignissim magna, vitae dignissim neque sapien vel augue. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.

// ---

// # 🎉 Thank You

// Happy Hacking ❤️
// `}
                  />
                </Suspense>
              </div>
            </Card>

            {competition.categories.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Categories</h2>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {competition.categories.map((category) => (
                    <Badge key={category.categoryId} variant="secondary">
                      {category.category.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {competition.technologies.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Technologies</h2>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {competition.technologies.map((tech) => (
                    <Badge key={tech.technologyId} variant="outline">
                      {tech.technology.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}

          <div>
            <Card className="p-6 space-y-5">
              <h2 className="text-lg font-semibold">Competition Details</h2>

              {competition.registrationDeadline && (
                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Registration Ends</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        competition.registrationDeadline,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {competition.startDate && (
                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Starts</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(competition.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {competition.endDate && (
                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Ends</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(competition.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {competition.prizePool && (
                <div className="flex gap-3">
                  <Trophy className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Prize Pool</p>
                    <p className="text-sm text-muted-foreground">
                      {competition.prizePool}
                    </p>
                  </div>
                </div>
              )}

              {competition.location && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {competition.location}
                    </p>
                  </div>
                </div>
              )}

              {(competition.minTeamSize || competition.maxTeamSize) && (
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Team Size</p>
                    <p className="text-sm text-muted-foreground">
                      {competition.minTeamSize ?? 1}
                      {competition.maxTeamSize &&
                        ` - ${competition.maxTeamSize}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Globe className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {competition.mode}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
