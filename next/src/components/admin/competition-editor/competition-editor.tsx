"use client";
import { CompetitionEditDTOWithPermissions } from "@/modules/competitions/types/edit-dto";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { GeneralTab } from "./general-tab";
import { DocumentationTab } from "./documentation-tab";
import { DetailsTab } from "./details-tab";
import { LocationsTab } from "./locations-tab";
import { TechnologiesTab } from "./technologies-tab";
import { ScheduleTab } from "./schedule-tab";
import { SummaryTab } from "./summary-tab";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import { DangerTab } from "./danger-tab";
import { EditorHeader } from "./editor-header";
import { useSaveShortcut, useUnsavedChangesGuard } from "./use-save-shortcut";
import type { EditorTab } from "@/modules/competitions/editor/field-metadata";

type TabValue = EditorTab | "summary" | "details" | "danger";

export function CompetitionEditor({
  competition,
}: {
  competition: CompetitionEditDTOWithPermissions;
}) {
  const initialize = useCompetitionEditorStore((state) => state.initialize);

  const [activeTab, setActiveTab] = useState<TabValue>("summary");

  useEffect(() => {
    initialize(competition);
  }, [competition, initialize]);

  useSaveShortcut();
  useUnsavedChangesGuard();

  const editedCompetition = useCompetitionEditorStore((s) => s.competition);

  if (!editedCompetition) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 md:p-6">
      <EditorHeader />

      <Card>
        <CardHeader>
          <CardTitle>Edit Competition</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabValue)}
          >
            <div className="w-full overflow-x-auto">
              <TabsList className="w-max">
                <TabsTrigger value="summary">Summary</TabsTrigger>

                <TabsTrigger value="general">General</TabsTrigger>

                <TabsTrigger value="documentation">Documentation</TabsTrigger>

                <TabsTrigger value="schedule">Schedule</TabsTrigger>

                <TabsTrigger value="locations">Locations</TabsTrigger>

                <TabsTrigger value="technologies">Technologies</TabsTrigger>

                <TabsTrigger value="details">Details</TabsTrigger>

                <TabsTrigger value="danger">Danger</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="summary">
              <SummaryTab onNavigateToTab={(tab) => setActiveTab(tab)} />
            </TabsContent>

            <TabsContent value="general">
              <GeneralTab />
            </TabsContent>

            <TabsContent value="documentation">
              <DocumentationTab />
            </TabsContent>

            <TabsContent value="schedule">
              <ScheduleTab />
            </TabsContent>

            <TabsContent value="locations">
              <LocationsTab />
            </TabsContent>

            <TabsContent value="technologies">
              <TechnologiesTab />
            </TabsContent>

            <TabsContent value="details">
              <DetailsTab />
            </TabsContent>

            <TabsContent value="danger">
              <DangerTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
