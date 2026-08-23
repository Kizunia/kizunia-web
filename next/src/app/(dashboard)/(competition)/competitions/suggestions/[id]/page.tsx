import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import PageWrapper from "@/components/page-wrapper";

import { CompetitionSuggestionService } from "@/modules/competitions/backend/suggestion/service";
import { SessionService } from "@/lib/auth/index";

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ");
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompetitionSuggestionPage({
  params,
}: Props) {
  const { id } = await params;

    const actor =  await SessionService.getStrictActor();

  const suggestion =
    await CompetitionSuggestionService.findById({
      actor,
      id,
    });

  if (!suggestion) {
    notFound();
  }

  return (
    <PageWrapper
      breadcrumbs={[
        {
          label: "Competitions",
          href: "/competitions",
        },
        {
          label: "My Suggestions",
          href: "/competitions/suggestions",
        },
        {
          label: suggestion.suggestionTitle,
          href: "#",
        },
      ]}
    >
      <div className=" max-w-3xl  space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-3xl">
                  {suggestion.suggestionTitle}
                </CardTitle>

                <CardDescription>
                  Submitted{" "}
                  {formatDate(
                    suggestion.submittedAt,
                  )}
                </CardDescription>
              </div>

              <Badge className="shrink-0">
                {formatStatus(suggestion.status)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>

          <CardContent>
            {suggestion.suggestionContent?.content ? (
              <div className="whitespace-pre-wrap text-sm leading-7">
                {suggestion.suggestionContent.content}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description was provided.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Edit suggestion */}
        {suggestion.competitionId && (
          <Card>
            <CardHeader>
              <CardTitle>
                Suggested Competition Update
              </CardTitle>

              <CardDescription>
                This suggestion is associated with an
                existing competition.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button asChild variant="outline">
                <Link
                  href={`/competitions/${suggestion.competitionId}`}
                >
                  View Competition
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <Button asChild variant="ghost">
            <Link href="/competitions/suggestions">
              ← Back to My Suggestions
            </Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}