import type { MediaItem } from "@/lib/types";

/**
 * Browser-side media upload.
 *
 * Files go to the `/api/admin/media` route as multipart form data — never as a
 * base64 data URL in a server action, which base64-inflates by 33% and blows
 * past the 1 MB server action body limit. Every image is re-encoded through a
 * canvas first, which both strips EXIF and caps the payload well under the
 * serverless request limit no matter how large the source file is.
 */

const MAX_EDGE = 2000;
const RE_ENCODE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface UploadMediaMeta {
  name?: string;
  alt?: string;
  tags?: string[];
  dimensions?: string;
}

async function reEncode(file: File): Promise<Blob> {
  if (!RE_ENCODE_TYPES.has(file.type)) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();

    const scale = Math.min(
      1,
      MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, contentType, 0.85),
    );
    if (!blob) throw new Error("Failed to encode image");

    return blob;
  } catch {
    // Undecodable or exotic image: send the original bytes and let the server decide.
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Uploads an image file to storage and registers it in the media library.
 * Rejects with a user-facing message when the upload fails.
 */
export async function uploadMediaFile(
  file: File,
  meta: UploadMediaMeta = {},
): Promise<MediaItem> {
  const body = await reEncode(file);

  const form = new FormData();
  form.append(
    "file",
    body,
    (meta.name || file.name).replace(/[^\w.-]+/g, "_"),
  );
  if (meta.name) form.append("name", meta.name);
  if (meta.alt) form.append("alt", meta.alt);
  if (meta.tags?.length) form.append("tags", JSON.stringify(meta.tags));
  if (meta.dimensions) form.append("dimensions", meta.dimensions);

  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.media) {
    throw new Error(payload?.error || `Upload failed (${response.status})`);
  }
  return payload.media as MediaItem;
}