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
};

/** Explicit raster allowlist; SVG is excluded because it can execute scripts. */
export const ALLOWED_IMAGE_MIME = new Set(Object.keys(MIME_EXTENSIONS));

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
  // Every upload gets its own key: two files both named "cover.png" must never
  // share (and silently overwrite) one storage object.
  const unique = crypto.randomUUID().slice(0, 8);

  return {
    fileName: `${stem ? `${stem}-` : "res-"}${date}-${unique}.${ext}`,
    contentType,
  };
}

/**
 * Validates an editor-supplied base64 image before it reaches storage.
 * Returns null for unsupported types or oversized payloads so callers can keep
 * the original value instead of persisting an unchecked file.
 */
export function parseImageDataUrl(
  dataUrl: string,
): { mimeType: string; ext: string; buffer: Buffer } | null {
  const match = dataUrl.match(
    /^data:(image\/[a-z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/i,
  );
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME.has(mimeType)) return null;
  if (match[2].length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 4) return null;

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_UPLOAD_BYTES) return null;

  return {
    mimeType,
    ext: mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length),
    buffer,
  };
}