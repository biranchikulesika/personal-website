import { uploadImageServerAction, deleteImageServerAction } from '@/app/admin/actions/storage.actions';
import { supabaseClient } from '@/lib/supabase/client';

export type StorageBucket = 'media' | 'post-images' | 'cover-images' | 'persona-assets' | 'profile-assets' | 'newsletter-assets';

export interface UploadOptions {
  bucket: StorageBucket;
  file: File;
}

export async function uploadImage({ bucket, file }: UploadOptions) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  
  return await uploadImageServerAction(formData);
}

export async function deleteImage(bucket: StorageBucket, path: string) {
  return await deleteImageServerAction(bucket, path);
}

export async function getRecentUploads(bucket: StorageBucket, limit: number = 40) {
  // First attempt: fetch directly from uploaded_images registry
  const { data: dbRecords, error: dbError } = await supabaseClient
    .from('uploaded_images')
    .select('storage_path, file_name, public_url, created_at, first_uploaded_at')
    .eq('bucket', bucket)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!dbError && dbRecords && dbRecords.length > 0) {
    return dbRecords.map(item => ({
      name: item.file_name || item.storage_path.split('/').pop() || item.storage_path,
      created_at: item.created_at || item.first_uploaded_at,
      publicUrl: item.public_url,
      path: item.storage_path,
    }));
  }

  // Fallback: list from storage recursively
  const fetchFolder = async (folderPath: string, maxItems: number): Promise<any[]> => {
    const { data, error } = await supabaseClient.storage.from(bucket).list(folderPath, {
      limit: maxItems,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error || !data) return [];

    const items: any[] = [];
    for (const item of data) {
      if (item.name === '.emptyFolderPlaceholder') continue;
      const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;

      if (!item.id && !item.metadata) {
        // It is a folder, traverse into it
        const nested = await fetchFolder(fullPath, maxItems);
        items.push(...nested);
      } else {
        const { data: { publicUrl } } = supabaseClient.storage.from(bucket).getPublicUrl(fullPath);
        items.push({
          name: item.name,
          created_at: item.created_at || new Date().toISOString(),
          publicUrl,
          path: fullPath,
        });
      }
    }
    return items;
  };

  const results = await fetchFolder('', limit);
  return results.slice(0, limit);
}

export function getPublicUrl({ bucket, path }: { bucket: StorageBucket; path: string }) {
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
