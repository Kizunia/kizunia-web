

import PageWrapper from "@/components/page-wrapper";


import { CompetitionService } from "@/modules/hackathons/backend/service";
import CompetitionsCards from "@/modules/hackathons/components/allCompititions/CompetitionsCards";
import { searchCompetitionsSchema } from "@/modules/hackathons/schemas/search.schema";

import { HackathonCardDTO } from "@/modules/hackathons/types/dto";
interface Props {
  searchParams: Promise<{
    mode?: string;
    page?: string;
    category?: string;
  }>;
}

export default async function CompetitionsPage({ searchParams }: Props) {
  let competitions: HackathonCardDTO[] = [];
  try {
    const rawSearchParams = await searchParams;

    const filters = searchCompetitionsSchema.parse(rawSearchParams);

     competitions = await CompetitionService.findPublic({
      sort: "start-date",
      page: 1,
      mode: filters.mode,
    });
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
      <CompetitionsCards competitions={competitions} />
    </PageWrapper>
  );
}
