import { StrictAuthorizationActor } from "@/authorization";
import PageWrapper from "@/components/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SessionService } from "@/lib/auth/session";
import { CompetitionManagementTableDTO } from "@/modules/competitions/backend/authorization/dto";

import { CompetitionService } from "@/modules/competitions/backend/service";
import CompetitionsCards from "@/modules/competitions/components/allCompititions/CompetitionsCards";
import { CompetitionSearchResult } from "@/modules/competitions/search/types";
import type { RawSearchParams } from "@/lib/search";

import { CompetitionCardDTO } from "@/modules/competitions/types/dto";
import AdminCompetitionsCards from "./_components/AdminCompetitionsCards";
import { AuthenticationError } from "@/lib/errors";
import { PlatformAuthorizer } from "@/authorization/platform/authorizer";
import { PlatformAction } from "@/authorization/platform/actions";
interface Props {
  searchParams: Promise<RawSearchParams>;
}

export default async function CompetitionsPage({ searchParams }: Props) {
  let competitions: CompetitionManagementTableDTO[] = [];
  let pagination: CompetitionSearchResult<CompetitionCardDTO>["pagination"];
  try {
    const rawSearchParams = await searchParams;
    const actor = await SessionService.getActor();
    if (!actor || !actor.role || !!actor.banned || !actor.id) {
      throw new AuthenticationError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to access this page.",
        status: 401,
      });
    }
    const strictActor: StrictAuthorizationActor = {
      id: actor.id,
      role: actor.role ?? "user",
      banned: actor.banned ?? true,
    };

    

    PlatformAuthorizer.can({actor: strictActor}, PlatformAction.VIEW_ALL_COMPETITIONS);

    const resp = await CompetitionService.searchAdmin(strictActor, rawSearchParams);
   
    competitions = resp.items;
    pagination = resp.pagination;
  } catch (error) {
    return (
      <PageWrapper
        breadcrumbs={[{ label: "Competitions", href: "/admin/competitions" }]}
      >
        {error instanceof Error ? (
          <p className="text-red-500">{error.message}</p>
        ) : (
          <p className="text-red-500">An unknown error occurred.</p>
        )}
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Competitions", href: "/admin/competitions" }]}
    >
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Competitions {pagination.total}+
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Discover competitions, coding competitions, innovation challenges, and
          open opportunities from colleges and organizations.
        </p>
      </div>

      {/* Empty State */}

      {pagination.total <= 0 && (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground">No competitions available.</p>
          </CardContent>
        </Card>
      )}
      {}
      <AdminCompetitionsCards competitions={competitions} />

      <Pagination>
        <PaginationContent className="gap-4">
          {pagination.hasPreviousPage && (
            <PaginationItem className="bg-primary text-primary-foreground rounded-xl">
              <PaginationPrevious
                href={`/admin/competitions?page=${pagination.page - 1}`}
              />
            </PaginationItem>
          )}

          {/* <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem> */}

          {pagination.hasNextPage && (
            <PaginationItem className="bg-primary text-primary-foreground  rounded-xl">
              <PaginationNext
                href={`/admin/competitions?page=${pagination.page + 1}`}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </PageWrapper>
  );
}
