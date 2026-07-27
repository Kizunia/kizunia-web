export interface AssetDTO {
  id: string;

  secureUrl: string;

  publicId: string;

  format: string | null;

  mimeType: string | null;

  width: number | null;

  height: number | null;

  bytes: number | null;

  originalFilename: string | null;
}