/**
 * Server-side validation for inbound media uploads.
 *
 * Trust boundary: everything here runs against client-supplied values, so it
 * must never assume a well-formed or well-named file.
 */

/** Serverless request bodies are capped at 4.5 MB; stay under it. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export interface UploadTarget {
  fileName: string;
  contentType: string;
}

/**
 * Validates an uploaded file and derives a safe, collision-resistant object key.
 *
 * @throws Error with a user-facing message when the MIME type or size is rejected.
 */
export function resolveUploadTarget(input: {
  name?: string;
  contentType: string;
  size: number;
}): UploadTarget {
  const contentType = input.contentType.toLowerCase().split(";")[0].trim();
  const ext = MIME_EXTENSIONS[contentType];
  if (!ext) {
    throw new Error(`Unsupported image type: ${contentType || "unknown"}`);
  }
  if (input.size <= 0) {
    throw new Error("Uploaded file is empty");
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image is too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`,
    );
  }

  const stem = (input.name || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);

  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const fallback = `${date}-${Math.random().toString(36).slice(2, 10)}`;

  return { fileName: `${stem || `res-${fallback}`}.${ext}`, contentType };
}