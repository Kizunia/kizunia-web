import { useCallback, useState } from "react";

interface UseCloudinaryUploadOptions {
  folder?: string;
  signatureEndpoint?: string; // server route that returns { signature }
}

// Strongly typed Cloudinary upload response (common documented fields)
export interface CloudinaryUploadResult {
  asset_id?: string;
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  url: string;
  secure_url: string;
  folder?: string;
  access_mode?: string;
  original_filename: string;
  placeholder?: boolean;
  pages?: number;
  moderation?: unknown[];
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // forward compatibility without using 'any'
}

export function useCloudinaryUpload(options: UseCloudinaryUploadOptions = {}) {
  const { folder = "default_folder", signatureEndpoint = "/api/cloudinary-sign" } = options;
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: Blob): Promise<{ url: string; info: CloudinaryUploadResult }> => {
      setUploading(true);
      setProgress(0);
      const timestamp = Math.floor(Date.now() / 1000);

      // 1. Sign parameters server-side
      const signRes = await fetch(signatureEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign: { timestamp, folder } }),
      });
      if (!signRes.ok) throw new Error("Failed to obtain signature");
      const { signature } = (await signRes.json()) as { signature: string };

      // 2. Prepare form data
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
      if (!cloudName || !apiKey) throw new Error("Cloudinary env vars missing");

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      // 3. Upload with XHR to track progress
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const info: CloudinaryUploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);
        xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
            } catch {
              reject(new Error("Invalid Cloudinary response"));
            }
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload error"));
        xhr.send(form);
      });

      setUploading(false);
      setProgress(100);
      return { url: info.secure_url, info };
    },
    [folder, signatureEndpoint]
  );

  return { upload, progress, uploading };
}
