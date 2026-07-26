import { notFound } from "next/navigation";
import { CompetitionFacade } from "@/modules/hackathons/backend/facade";
import { CompetitionEditor } from "@/components/admin/competition-editor/competition-editor";


export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  
    const competition = await CompetitionFacade.getForEdit(id);

    return <CompetitionEditor competition={competition} />;
  
}
