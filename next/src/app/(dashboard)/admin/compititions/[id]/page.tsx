import { notFound } from "next/navigation";
import { CompetitionFacade } from "@/modules/hackathons/backend/facade";
import { CompetitionEditor } from "@/components/admin/competition-editor/competition-editor";
import PageWrapper from "@/components/page-wrapper";

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const competition = await CompetitionFacade.getForEdit(id);

  return <PageWrapper breadcrumbs={[{ label: "Competitions", href: "/admin/competitions" }, { label: competition.title, href: `/admin/competitions/${competition.id}` }]}>
    <CompetitionEditor competition={competition} />
  </PageWrapper>
}
