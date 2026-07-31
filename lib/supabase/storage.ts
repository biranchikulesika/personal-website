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

export async function getRecentUploads(bucket: StorageBucket, limit: number = 10) {
  const { data, error } = await supabaseClient.storage.from(bucket).list('', {
    limit,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  });

  if (error) {
    console.error('List Error:', error);
    return [];
  }

  return data
    .filter(file => file.name !== '.emptyFolderPlaceholder')
    .map(file => {
      const { data: { publicUrl } } = supabaseClient.storage.from(bucket).getPublicUrl(file.name);
      return {
        name: file.name,
        created_at: file.created_at,
        publicUrl,
        path: file.name
      };
    });
}

export function getPublicUrl({ bucket, path }: { bucket: StorageBucket; path: string }) {
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
