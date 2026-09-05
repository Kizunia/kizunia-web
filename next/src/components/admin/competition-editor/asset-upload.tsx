"use client";
import type { SetAssetInput } from "@/modules/assets/schemas/set-asset";




import Image from "next/image";

import { Button } from "@/components/ui/button";


interface AssetUploadProps {
  label: string;

  asset: {
    secureUrl: string;
  } | null;

  onUpload(
    upload: SetAssetInput,
  ): Promise<void>;
}

export function AssetUpload({
  label,
  asset,
  onUpload,
}: AssetUploadProps) {
  async function handleUpload() {
    /**
     * TODO
     *
     * Open your Cloudinary uploader here.
     *
     * When upload succeeds call:
     *
     * await onUpload(uploadResult)
     */
  }

  return (
    <div className="space-y-4">

      <h3 className="font-medium">
        {label}
      </h3>

      {asset && (
        <Image
          src={asset.secureUrl}
          alt={label}
          width={300}
          height={200}
          className="rounded-md border"
        />
      )}

      <Button onClick={handleUpload}>
        Upload {label}
      </Button>

    </div>
  );
}