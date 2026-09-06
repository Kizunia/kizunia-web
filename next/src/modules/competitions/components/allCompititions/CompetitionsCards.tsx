import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import {
  BlendIcon,
  CalendarIcon,
  GlobeIcon,
  MapPinIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { CompetitionMode, RegistrationFeeType } from "@/generated/prisma";
import { COMPETITION_MODE_OPTIONS } from "../../constants";
import { CompetitionCardDTO } from "../../types/dto";
import { getInitials } from "@/utils/utils";
import { StatusBadge } from "../status-badge";
import { CompetitionShareButton } from "./competition-share-button";

/**
 * One row per competition, height driven by whatever that competition
 * actually has. Records here range from "just a title and a date" to fully
 * filled out, and a shared fixed height either clips the full ones or leaves
 * the sparse ones mostly blank. Every block below renders only when its data
 * exists, so a thin competition produces a short row instead of empty space.
 */
export default function CompetitionsCards({
  competitions,
}: {
  competitions: CompetitionCardDTO[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {competitions.map((competition) => (
        <CompetitionRow key={competition.id} competition={competition} />
      ))}
    </div>
  );
}

function CompetitionRow({ competition }: { competition: CompetitionCardDTO }) {
  const {
    slug,
    title,
    organizer,
    shortDescription,
    logoUrl,
    mode,
    status,
    startDate,
    registrationDeadline,
    registrationFeeType,
    minTeamSize,
    maxTeamSize,
    locations,
  } = competition;

  const description = shortDescription?.trim() ? shortDescription.trim() : null;

  const fee = feeLabel(registrationFeeType);
  const teamSize = formatTeamSize(minTeamSize, maxTeamSize);
  const modeLabel = COMPETITION_MODE_OPTIONS.find(
    (option) => option.value === mode,
  )?.label;
  const ModeIcon = mode ? MODE_ICONS[mode] : null;

  const hasFacts = fee || teamSize || modeLabel;
  const hasLocation = locations.length > 0;
  const hasFooter = true || startDate || registrationDeadline || status; // share button is always present, so this is always true

  return (
    <Card className="group/card relative flex-row overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="flex flex-1 flex-col">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/competitions/${slug}`}
                className="after:absolute after:inset-0 focus-visible:outline-none"
              >
                <h3 className="line-clamp-1 font-heading text-lg font-semibold group-hover/card:text-primary">
                  {title}
                </h3>
              </Link>

              {organizer && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {organizer}
                </p>
              )}
            </div>

            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage
                src={logoUrl ?? undefined}
                alt={organizer || "Competition logo"}
              />
              <AvatarFallback>{getInitials(title)}</AvatarFallback>
            </Avatar>
          </div>

          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </CardHeader>

        {(hasFacts || hasLocation) && (
          <CardContent className="space-y-2">
            {hasFacts && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {fee && (
                  <span className="inline-flex items-center gap-1.5">
                    <TicketIcon className="h-4 w-4" />
                    {fee}
                  </span>
                )}

                {teamSize && (
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="h-4 w-4" />
                    {teamSize}
                  </span>
                )}

                {modeLabel && ModeIcon && (
                  <span className="inline-flex items-center gap-1.5">
                    <ModeIcon className="h-4 w-4" />
                    {modeLabel}
                  </span>
                )}
              </div>
            )}

            {hasLocation && (
              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPinIcon className="h-4 w-4 shrink-0 translate-y-0.5" />

                <span className="line-clamp-2">
                  {locations[0].displayName}

                  {locations.length > 1 && ` +${locations.length - 1} more`}
                </span>
              </div>
            )}
          </CardContent>
        )}

        {hasFooter && (
          <CardFooter className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              {startDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  {format(startDate, "d MMM yyyy")}
                </span>
              )}

              {registrationDeadline && (
                <span>{formatDeadline(registrationDeadline)}</span>
              )}

              {status && <StatusBadge status={status} />}
            </div>

            <div className="relative z-10 shrink-0">
              <CompetitionShareButton slug={slug} title={title} />
            </div>
          </CardFooter>
        )}
      </div>

      {/* <div className="relative z-10 shrink-0 p-2">
        <CompetitionShareButton slug={slug} title={title} />
      </div> */}
    </Card>
  );
}

const MODE_ICONS: Record<CompetitionMode, typeof GlobeIcon> = {
  ONLINE: GlobeIcon,
  OFFLINE: MapPinIcon,
  HYBRID: BlendIcon,
};

const FEE_LABELS: Record<RegistrationFeeType, string> = {
  FREE: "Free",
  PAID: "Paid entry",
  CONDITIONAL: "Conditional fee",
};

function feeLabel(feeType: RegistrationFeeType | null): string | null {
  return feeType ? FEE_LABELS[feeType] : null;
}

function formatTeamSize(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    if (min === 1 && max === 1) return "Solo";
    if (min === max) return `${min} members`;
    return `${min}–${max} members`;
  }
  if (min != null) return `${min}+ members`;
  return `Up to ${max} members`;
}

function formatDeadline(deadline: Date): string {
  const daysLeft = differenceInCalendarDays(deadline, new Date());

  if (daysLeft < 0) return "Registration closed";
  if (daysLeft === 0) return "Closes today";
  if (daysLeft === 1) return "Closes tomorrow";
  if (daysLeft <= 30) return `Closes in ${daysLeft} days`;

  return `Closes ${format(deadline, "d MMM yyyy")}`;
}
