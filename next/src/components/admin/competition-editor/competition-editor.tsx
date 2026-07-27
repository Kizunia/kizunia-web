"use client";
import { SaveBar } from "./save-bar";
import { CompetitionEditDTO } from "@/modules/hackathons/types/edit-dto";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";

import { GeneralTab } from "./general-tab";
import { DocumentationTab } from "./documentation-tab";
import { DetailsTab } from "./details-tab";
import { useCompetitionEditorStore } from "@/modules/hackathons/store/editor-store";

export function CompetitionEditor({
  competition,
}: {
  competition: CompetitionEditDTO;
}) {
  const initialize = useCompetitionEditorStore(
  (state) => state.initialize,
);



useEffect(() => {
  initialize(competition);
}, [competition, initialize]);

const editedCompetition = useCompetitionEditorStore(
  (s) => s.competition,
);

if (!editedCompetition) {
  return null;
}

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6 p-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="space-y-1">
          <h1 className="text-3xl font-bold">
           { editedCompetition.title}
          </h1>

          <div className="flex gap-2">
            <Badge>
              {competition.status}
            </Badge>

            <Badge variant="secondary">
              {competition.visibility}
            </Badge>
          </div>
        </div>

      </div>

      <Card>

        <CardHeader>

          <CardTitle>
            Edit Competition
          </CardTitle>

        </CardHeader>

        <CardContent>

          <Tabs defaultValue="general">

            <TabsList>

              <TabsTrigger value="general">
                General
              </TabsTrigger>

              <TabsTrigger value="documentation">
                Documentation
              </TabsTrigger>

              <TabsTrigger value="details">
                Details
              </TabsTrigger>

            </TabsList>

            <TabsContent value="general">
              <GeneralTab  />
            </TabsContent>

            <TabsContent value="documentation">
              <DocumentationTab/>
            </TabsContent>

            <TabsContent value="details">
              <DetailsTab />
            </TabsContent>

          </Tabs>

        </CardContent>

      </Card>
      <SaveBar />

    </div>
  );
}