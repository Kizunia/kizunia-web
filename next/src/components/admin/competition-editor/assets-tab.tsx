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

import { CompetitionApi } from "@/modules/hackathons/api/hackathon-api";
import { useCompetitionEditorStore } from "@/modules/hackathons/store/editor-store";
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
            title="Hackathon Logo"
            initialImage={competition.logoAsset?.secureUrl ?? ""}
            cloudinaryFolder={`hackathons/${competition.id}/logo`}
            customCropShape="rect"
            accept="image/*"
            onUpload={async (_, info) => {
              if (!info) return;

              try {
                const updated = await CompetitionApi.setAsset(
                  competition.id,
                  "logo",
                  {
                    publicId: info.public_id,

                    secureUrl: info.secure_url,

                    format: info.format,

                    mimeType: `${info.resource_type}/${info.format}`,

                    width: info.width,

                    height: info.height,

                    bytes: info.bytes,

                    checksum: info.etag,

                    originalFilename: info.original_filename,
                  },
                );

                setCompetition(updated);

                toast.success("Logo updated successfully.");
              } catch (error) {
                console.error(error);

                toast.error("Failed to update logo.");
              }
            }}
            onDelete={async () => {
                toast.error("Delete functionality not implemented yet.");
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
            title="Hackathon Banner"
            initialImage={competition.logoAsset?.secureUrl ?? ""}
            cloudinaryFolder={`kizunia/hackathons/${competition.id}/banner`}
            customCropShape="rect"
            accept="image/*"
            onUpload={async (_, info) => {
              if (!info) return;

              try {
                const updated = await CompetitionApi.setAsset(
                  competition.id,
                  "banner",
                  {
                    publicId: info.public_id,

                    secureUrl: info.secure_url,

                    format: info.format,

                    mimeType: `${info.resource_type}/${info.format}`,

                    width: info.width,

                    height: info.height,

                    bytes: info.bytes,

                    checksum: info.etag,

                    originalFilename: info.original_filename,
                  },
                );

                setCompetition(updated);

                toast.success("Logo updated successfully.");
              } catch (error) {
                console.error(error);

                toast.error("Failed to update logo.");
              }
            }}
            onDelete={async () => {
                toast.error("Delete functionality not implemented yet.");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
