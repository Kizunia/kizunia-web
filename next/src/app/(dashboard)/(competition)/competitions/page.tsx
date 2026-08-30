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

import { CompetitionService } from "@/modules/competitions/backend/service";
import CompetitionsCards from "@/modules/competitions/components/allCompititions/CompetitionsCards";
import { CompetitionSearchSchema } from "@/modules/competitions/search/schema";
import { CompetitionSearchResult } from "@/modules/competitions/search/types";

import { CompetitionCardDTO } from "@/modules/competitions/types/dto";
interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CompetitionsPage({ searchParams }: Props) {
  let competitions: CompetitionCardDTO[] = [];
  let pagination: CompetitionSearchResult<CompetitionCardDTO>["pagination"];
  try {
    const rawSearchParams = await searchParams;
    const filters = CompetitionSearchSchema.parse(rawSearchParams);
    const resp = await CompetitionService.search(filters);

    competitions = resp.items;
    pagination = resp.pagination;
  } catch (error) {
    return (
      <PageWrapper
        breadcrumbs={[{ label: "Competitions", href: "/competitions" }]}
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
      breadcrumbs={[{ label: "Competitions", href: "/competitions" }]}
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
      <CompetitionsCards competitions={competitions} />

      {/* <div className="flex justify-center space-x-2">
        {pagination.hasPreviousPage && (
          <Link
            href={`/competitions?page=${pagination.page - 1}`}
           
          >
            Previous
          </Link>
        )}
        {pagination.hasNextPage && (
          <Link
            href={`/competitions?page=${pagination.page + 1}`}
            className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/80"
          >
            Next
          </Link>
        )}
      </div> */}

      <Pagination>
        <PaginationContent className="gap-4">
          {pagination.hasPreviousPage && (
            <PaginationItem className="bg-primary text-primary-foreground rounded-xl">
              <PaginationPrevious
                href={`/competitions?page=${pagination.page - 1}`}
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
                href={`/competitions?page=${pagination.page + 1}`}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </PageWrapper>
  );
}
