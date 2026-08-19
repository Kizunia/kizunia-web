import { ProjectEditorLayout } from "@/modules/projects/frontend/components/editor/project-editor-layout";

interface ProjectEditLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectEditLayout({
  children,
  params,
}: ProjectEditLayoutProps) {
  const { projectId } = await params;

  return (
    <ProjectEditorLayout
      projectId={projectId}
      projectName="Project"
    >
      {children}
    </ProjectEditorLayout>
  );
}