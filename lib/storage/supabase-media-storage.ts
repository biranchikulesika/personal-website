import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  MediaStorage,
  UploadMediaParams,
  UploadMediaResult,
} from "./media-storage";

export class SupabaseMediaStorage implements MediaStorage {
  private bucketName = "media";

  async upload(params: UploadMediaParams): Promise<UploadMediaResult> {
    const supabase = getSupabaseAdmin();
    const storagePath = `uploads/${params.fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(storagePath, params.buffer, {
        contentType: params.contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload asset to storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);

    return {
      url: publicUrlData.publicUrl,
      path: storagePath,
    };
  }

  async delete(paths: string[]): Promise<number> {
    if (paths.length === 0) return 0;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .remove(paths);

    if (error) {
      throw new Error(`Failed to delete assets from storage: ${error.message}`);
    }

    return data?.length ?? 0;
  }

  getUrl(path: string): string {
    const supabase = getSupabaseAdmin();
    const { data } = supabase.storage.from(this.bucketName).getPublicUrl(path);
    return data.publicUrl;
  }
}
