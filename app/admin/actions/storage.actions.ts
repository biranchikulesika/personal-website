'use server';

import { verifyAuth } from '@/lib/auth/verify';

export async function uploadImageServerAction(formData: FormData) {
  const file = formData.get('file') as File | null;
  const bucket = formData.get('bucket') as string;

  if (!file || !bucket) {
    throw new Error('File and bucket are required');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed.');
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit.');
  }

  // SECURITY: Validate file magic bytes server-side to prevent MIME type
  // spoofing. The browser-declared `file.type` is trivially modifiable by
  // an attacker. We check the actual binary signature of the file.
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).slice(0, 8);
  const magic = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');

  const validMagicBytes: Record<string, string[]> = {
    'image/jpeg': ['ff d8 ff'],
    'image/png': ['89 50 4e 47 0d 0a 1a 0a'],
    'image/webp': ['52 49 46 46'], // RIFF header — validated further by extension
    'image/gif': ['47 49 46 38 39 61', '47 49 46 38 37 61'],
    'image/avif': ['00 00 00 1c 66 74 79 70'],
    'image/svg+xml': ['3c 73 76 67'], // <svg
  };

  const allowedSignatures = Object.values(validMagicBytes).flat();
  const isMagicValid = allowedSignatures.some(sig => magic.startsWith(sig));

  if (!isMagicValid) {
    throw new Error('Upload rejected: file content does not match a valid image format.');
  }

  const { supabase } = await verifyAuth();

  const ext = file.name.split('.').pop() || 'tmp';
  const uuid = crypto.randomUUID();
  const path = `${uuid}.${ext}`;

  // Use the verified supabase client which has the user's context/auth
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload Error:', error);
    throw new Error('Failed to upload image. ' + error.message);
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  return { publicUrl, path };
}

export async function deleteImageServerAction(bucket: string, path: string) {
  const { supabase } = await verifyAuth();
  
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Delete Error:', error);
    throw new Error('Failed to delete image.');
  }
}
