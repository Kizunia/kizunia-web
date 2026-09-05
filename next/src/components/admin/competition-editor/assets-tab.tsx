"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReusableImageUploader from "@/components/cloudinary/imageUploader/reusableImageUploader";

import { CompetitionApi } from "@/modules/competitions/api/competition-api";
import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import { Button } from "@/components/ui/button";

export function AssetsTab() {
  const competition = useCompetitionEditorStore((s) => s.competition);

  const setCompetition = useCompetitionEditorStore((s) => s.setCompetition);

  if (!competition) {
    return null;
  }

  return (
    <div className="">
      <Dialog>
        <DialogTrigger>
            <Button variant={"secondary"} >Update Logo</Button>
        </DialogTrigger>
        <DialogContent>
          <ReusableImageUploader
            title="Competition Logo"
            initialImage={competition.logoAsset?.secureUrl ?? ""}
            purpose="COMPETITION_LOGO"
            targetEntityId={competition.id}
            customCropShape="rect"
            accept="image/*"
            onUpload={async (_, asset) => {
              if (!asset) return;

              try {
                const updated = await CompetitionApi.setAsset(
                  competition.id,
                  "logo",
                  { assetId: asset.id },
                );

                setCompetition(updated);

                toast.success("Logo updated successfully.");
              } catch (error) {
                console.error(error);

                toast.error("Failed to update logo.");
              }
            }}
            onDelete={async () => {
              const updated = await CompetitionApi.clearAsset(
                competition.id,
                "logo",
              );

              setCompetition(updated);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger>
            <Button variant={"secondary"} >Update Banner</Button>
        </DialogTrigger>
        <DialogContent>
          <ReusableImageUploader
            title="Competition Banner"
            initialImage={competition.bannerAsset?.secureUrl ?? ""}
            purpose="COMPETITION_BANNER"
            targetEntityId={competition.id}
            customCropShape="rect"
            aspectRatio={16 / 9}
            accept="image/*"
            onUpload={async (_, asset) => {
              if (!asset) return;

              try {
                const updated = await CompetitionApi.setAsset(
                  competition.id,
                  "banner",
                  { assetId: asset.id },
                );

                setCompetition(updated);

                toast.success("Banner updated successfully.");
              } catch (error) {
                console.error(error);

                toast.error("Failed to update banner.");
              }
            }}
            onDelete={async () => {
              const updated = await CompetitionApi.clearAsset(
                competition.id,
                "banner",
              );

              setCompetition(updated);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
