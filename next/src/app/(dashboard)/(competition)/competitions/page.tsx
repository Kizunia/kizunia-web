import Link from "next/link";
import { Calendar, Globe, MapPin, Trophy } from "lucide-react";

import PageWrapper from "@/components/page-wrapper";
import prisma from "@/lib/prisma";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CompetitionsPage() {
  const competitions = await prisma.hackathon.findMany({
    where: {
      deletedAt: null,
      visibility: "PUBLIC",
    },
    include: {
      coverAsset: true,
      logoAsset: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  return (
   <PageWrapper breadcrumbs={[{ label: "Competitions", href: "/competitions" }]}>
   
      <div className="space-y-8">
        {/* Header */}

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Competitions {competitions.length}+</h1>

          <p className="max-w-2xl text-muted-foreground">
            Discover hackathons, coding competitions, innovation challenges, and
            open opportunities from colleges and organizations.
          </p>
        </div>

        {/* Empty State */}

        {competitions.length === 0 && (
          <Card>
            <CardContent className="flex h-48 items-center justify-center">
              <p className="text-muted-foreground">
                No competitions available.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Grid */}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {competitions.map((competition) => (
            <Link
              key={competition.id}
              href={`/competitions/${competition.slug}`}
              className="group"
            >
              <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl">
                <CardHeader className="space-y-4">
                  <div className="flex items-start gap-4">
                    {competition.logoAsset ? (
                      <img
                        src={competition.logoAsset.secureUrl}
                        alt={competition.organizer}
                        className="h-12 w-12 rounded-lg border bg-background object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted text-sm font-semibold">
                        {competition.organizer.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-1">
                        {competition.title}
                      </CardTitle>

                      <CardDescription className="line-clamp-1">
                        {competition.organizer}
                      </CardDescription>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {competition.shortDescription}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge>{competition.status.replaceAll("_", " ")}</Badge>

                    <Badge variant="secondary">{competition.mode}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {competition.startDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {competition.startDate.toLocaleDateString()}
                    </div>
                  )}

                  {competition.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {competition.location}
                    </div>
                  )}

                  {competition.prizePool && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      {competition.prizePool}
                    </div>
                  )}

                  {competition.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      Official Website
                    </div>
                  )}

                  {competition.registrationDeadline && (
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                      <span className="font-medium">Registration Deadline</span>

                      <div className="mt-1 text-muted-foreground">
                        {competition.registrationDeadline.toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
