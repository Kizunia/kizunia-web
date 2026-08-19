import { ProjectEditorHeader } from "./project-editor-header";
import { ProjectEditorNavigation } from "./project-editor-navigation";

interface ProjectEditorLayoutProps {
  projectId: string;
  projectName: string;
  children: React.ReactNode;
}

export function ProjectEditorLayout({
  projectId,
  projectName,
  children,
}: ProjectEditorLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-6">
        <ProjectEditorHeader projectName={projectName} />

        <ProjectEditorNavigation projectId={projectId} />

        <main>{children}</main>
      </div>
    </div>
  );
}