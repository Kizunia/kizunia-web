import { notFound } from "next/navigation";
import {
  Calendar,
  Globe,
  MapPin,
  SquareArrowOutUpRight,
  Trophy,
  Users,
  CreditCard,
  Monitor,
} from "lucide-react";
import prisma from "@/lib/prisma";
import PageWrapper from "@/components/page-wrapper";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForwardRefEditor } from "@/components/shared/mdx/ForwardRefEditor";
import { Suspense } from "react";
import { CompetitionApi } from "@/modules/competitions/api/competition-api";
import { ForwardRefMdxViewer } from "@/components/shared/mdx/ForwardRefMdxViewer";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApiError } from "@/lib/http";
import { CompetitionErrorCode } from "@/modules/competitions/errors/error-code";
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
  let response;
  try {
    response = await CompetitionApi.getPublic(slug);
  } catch (error) {
    if (error instanceof ApiError) {
      if (
        error.code == CompetitionErrorCode.NOT_FOUND ||
        error.code == CompetitionErrorCode.ARCHIVED ||
        error.code == CompetitionErrorCode.DELETED
      )
        notFound();
    } else {
      throw error;
    }
  }
  if (!!!response) {
    notFound();
  }
  const competition = response.data;

  const isSideBarRequired =
    competition.registrationDeadline ||
    competition.startDate ||
    competition.endDate ||
    competition.prizePool ||
    competition.location ||
    competition.minTeamSize ||
    competition.maxTeamSize ||
    competition.mode ||
    competition.registrationFee !== null ||
    competition.registrationFeeType ||
    competition.registrationPlatform;

  const isAboutSectionRequired =
    competition.content?.content &&
    competition.content?.content !== "No documentation.";

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Competitions", href: "/competitions" },
        { label: competition.title, href: `/competitions/${competition.slug}` },
      ]}
    >
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        {competition.bannerAsset && (
          <div className="relative aspect-[3/1] w-full rounded-xl overflow-hidden border">
            <Image
              src={competition.bannerAsset.secureUrl}
              alt={competition.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}
        <Card className="p-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
              {competition.logoAsset ? (
                <Image
                  src={competition.logoAsset.secureUrl}
                  alt={`${competition.title} logo`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-3xl font-bold">
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

              {competition.shortDescription && (
                <p className="text-muted-foreground">
                  {competition.shortDescription}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {competition.mode && (
                  <Badge variant="secondary">{competition.mode}</Badge>
                )}

                {competition.difficulty && (
                  <Badge variant="outline">{competition.difficulty.replaceAll("_", " ")}</Badge>
                )}

                {/* {competition.certificateType && (
                  <Badge variant="outline">{competition.certificateType.replaceAll("_", " ")}</Badge>
                )} */}

                {competition.organizerType && (
                  <Badge variant="outline">{competition.organizerType.replaceAll("_", " ")}</Badge>
                )}

                {competition.location && (
                  <Badge variant="outline">
                    <MapPin className="mr-1 h-3 w-3" />
                    {competition.location}
                  </Badge>
                )}

                {competition.website && (
                  <Badge asChild variant="default">
                    <Link href={competition.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="mr-1 h-3 w-3" />
                      Official Website
                    </Link>
                  </Badge>
                )}

                {competition.registrationLink && (
                  <Badge asChild>
                    <Link href={competition.registrationLink} target="_blank" rel="noopener noreferrer">
                      <SquareArrowOutUpRight className="mr-1 h-3 w-3" />
                      Register
                    </Link>
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Information */}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {isAboutSectionRequired && (
              <Card className="p-6 space-y-4">
                <h1 className="text-4xl font-semibold">About</h1>

                {/* <Separator /> */}

                <div>
                  {/* {competition.content?.content ?? "Documentation coming soon."}{" "} */}
                  <Suspense fallback={null}>
                    <ForwardRefMdxViewer
                      markdown={
                        competition.content?.content ?? "No documentation."
                      }
                    />
                  </Suspense>
                </div>
              </Card>
            )}

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

            {competition.eligibilities && competition.eligibilities.length > 0 && (
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Eligibilities</h2>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {competition.eligibilities.map((el: any) => (
                    <Badge key={el.type} variant="outline">
                      {el.type.replaceAll("_", " ")}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}

          {isSideBarRequired && (
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

                {competition.mode && (
                  <div className="flex gap-3">
                    <Globe className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Mode</p>
                      <p className="text-sm text-muted-foreground">
                        {competition.mode}
                      </p>
                    </div>
                  </div>
                )}

                {(competition.registrationFee !== null || competition.registrationFeeType) && (
                  <div className="flex gap-3">
                    <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Registration Fee</p>
                      <p className="text-sm text-muted-foreground">
                        {competition.registrationFeeType === "FREE" ? "Free" : `${competition.registrationFee ?? ""} ${competition.registrationFeeType ?? ""}`.trim()}
                      </p>
                    </div>
                  </div>
                )}

                {competition.registrationPlatform && (
                  <div className="flex gap-3">
                    <Monitor className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Registration Platform</p>
                      <p className="text-sm text-muted-foreground">
                        {competition.registrationPlatform}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
