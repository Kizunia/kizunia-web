import Link from "next/link";
import { Calendar, Globe, MapPin, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetitionCardDTO } from "../../types/dto";
import { getInitials } from "@/utils/utils";

export default function CompetitionsCards({
  competitions,
}: {
  competitions: CompetitionCardDTO[];
}) {
  return (
    <div className="space-y-8">
      {/* Header */}

      {/* Grid */}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => (
          <Link
            key={competition.id}
            href={`/competitions/${competition.slug}`}
            className="group"
          >
            <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl flex h-[275px] flex-col">
              <CardHeader className="space-y-4 ">
                <div className="flex items-center gap-4">
                  <Avatar className=" h-12 w-12 ">
                    <AvatarImage
                      src={competition.logoUrl ?? undefined}
                      alt={competition.organizer || "Competition Logo"}
                      className="bg-red-700"
                    />
                    <AvatarFallback>
                      {getInitials(competition.title)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 items-center  justify-center h-full">
                    <CardTitle className="line-clamp-1">
                      {competition.title}
                    </CardTitle>

                    <CardDescription className="line-clamp-1">
                      {competition.organizer}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {competition.shortDescription?.length &&
                    competition.shortDescription?.length > 0 && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {competition.shortDescription}
                      </p>
                    )}
                  {competition.mode && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{competition.mode}</Badge>
                    </div>
                  )}{" "}
                </div>
              </CardHeader>

              {(competition.startDate ||
                competition.locations.length > 0 ||
                competition.registrationDeadline) && (
                <CardContent className="space-y-3 ">
                  {competition.startDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {competition.startDate.toLocaleDateString()}
                    </div>
                  )}

                  {competition.locations.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />

                      {/* A card has room for one place; the rest are counted so
                          a multi-city competition still reads as multi-city. */}
                      {competition.locations[0].displayName}

                      {competition.locations.length > 1 &&
                        ` +${competition.locations.length - 1} more`}
                    </div>
                  )}

                  {/* {competition.registrationDeadline && (
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                      <span className="font-medium">Registration Deadline</span>

                      <div className="mt-1 text-muted-foreground">
                        {competition.registrationDeadline.toLocaleDateString()}
                      </div>
                    </div>
                  )} */}
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
