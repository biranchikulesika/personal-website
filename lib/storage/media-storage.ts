export interface UploadMediaParams {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}

export interface UploadMediaResult {
  url: string;
  path: string;
}

/**
 * Storage abstraction contract for media assets.
 * Isolates the rest of the application from specific bucket or cloud storage providers.
 */
export interface MediaStorage {
  upload(params: UploadMediaParams): Promise<UploadMediaResult>;
  delete(paths: string[]): Promise<number>;
  getUrl(path: string): string;
}
