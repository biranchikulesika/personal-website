import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthService } from "@/lib/auth";
import { ContentService } from "@/lib/services/content.service";
import { getMediaStorage } from "@/lib/storage";
import { resolveUploadTarget } from "@/lib/storage/upload";
import { MediaItemSchema } from "@/lib/validation";

/**
 * POST /api/admin/media — multipart media upload.
 *
 * Uploads travel here rather than through a server action: a base64 data URL in
 * an action body inflates by 33% and dies on the 1 MB server action limit.
 * Route handlers accept raw multipart, so any client-side prepared image passes.
 */
const contentService = new ContentService();

function textField(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function tagsField(form: FormData): string[] {
  try {
    const parsed = JSON.parse(textField(form, "tags") || "[]");
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    await getAuthService().requireAdmin();
  } catch {
    return NextResponse.json(
      { success: false, error: "Forbidden: administrative privileges required" },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid upload request" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file uploaded" },
      { status: 400 },
    );
  }

  try {
    const name = textField(form, "name").trim();
    const { fileName, contentType } = resolveUploadTarget({
      name,
      contentType: file.type,
      size: file.size,
    });

    const { url } = await getMediaStorage().upload({
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName,
      contentType,
    });

    const media = await contentService.addMedia(
      MediaItemSchema.parse({
        id: `media-${Date.now()}`,
        name: name || file.name || fileName,
        src: url,
        alt: textField(form, "alt").trim(),
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        dimensions: textField(form, "dimensions").trim() || undefined,
        uploadedAt: new Date().toISOString(),
        tags: tagsField(form),
      }),
    );

    revalidatePath("/admin");
    return NextResponse.json({ success: true, media });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || "Failed to upload media" },
      { status: 400 },
    );
  }
}