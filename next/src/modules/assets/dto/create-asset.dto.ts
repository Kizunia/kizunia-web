export interface CreateAssetDTO {
  publicId: string;

  secureUrl: string;

  format: string | null;

  mimeType: string | null;

  width: number | null;

  height: number | null;

  bytes: number | null;

  checksum: string | null;

  originalFilename: string | null;
}