import { notFound } from "next/navigation";
import { Calendar, Globe, MapPin, Trophy, Users } from "lucide-react";

import prisma from "@/lib/prisma";
import PageWrapper from "@/components/page-wrapper";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function CompetitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ location?: string; organizer?: string; minTeamSize?: string }>;
}) {
  const { slug } = await params;

  const competition = await prisma.hackathon.findUnique({
    where: {
      slug,
    },
    include: {
      logoAsset: true,
      categories: {
        include: {
          category: true,
        },
      },
      technologies: {
        include: {
          technology: true,
        },
      },
    },
  });

  if (
    !competition ||
    competition.deletedAt ||
    competition.visibility !== "PUBLIC"
  ) {
    notFound();
  }

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

                <Badge>{competition.status.replaceAll("_", " ")}</Badge>
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
              <h2 className="text-xl font-semibold">About</h2>

              <Separator />

              <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap">
                {competition.documentation ?? "Documentation coming soon."}
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
                      {competition.registrationDeadline.toLocaleDateString()}
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
                      {competition.startDate.toLocaleDateString()}
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
                      {competition.endDate.toLocaleDateString()}
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
