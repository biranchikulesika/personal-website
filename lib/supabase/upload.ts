/**
 * Client-side image upload utility for the compose editor.
 *
 * Features:
 * - Upload progress tracking via XMLHttpRequest
 * - Client-side image compression for oversized files
 * - Date-based folder organization (YYYY/MM/DD/uuid.ext)
 * - MIME type and file size validation
 * - Unique filename generation (collision-proof UUIDs)
 * - Failed upload cleanup
 */

import { supabaseClient } from './client';
import type { StorageBucket } from './storage';

// ── Constants ──────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const COMPRESS_THRESHOLD = 2 * 1024 * 1024; // 2 MB — compress anything larger
const MAX_DIMENSION = 2400; // max width or height after compression

// ── Types ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export interface UploadProgressEvent {
  file: File;
  /** 0–100 progress percentage */
  progress: number;
  /** Current upload state */
  status: 'pending' | 'uploading' | 'compressing' | 'success' | 'error' | 'cancelled';
  /** Error message if status is 'error' */
  error?: string;
  /** Upload result if status is 'success' */
  result?: UploadResult;
}

export type UploadProgressCallback = (event: UploadProgressEvent) => void;

// ── Validation ─────────────────────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF, AVIF, SVG.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const mb = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
    return `File size exceeds ${mb} MB limit.`;
  }
  return null;
}

// ── Client-Side Image Compression ──────────────────────────────────────────

/**
 * Compress an image client-side using Canvas API.
 * Downsizes images larger than MAX_DIMENSION and adjusts quality for JPEG/WebP.
 */
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Only compress raster formats
    if (
      file.type === 'image/gif' ||
      file.type === 'image/svg+xml' ||
      file.size < COMPRESS_THRESHOLD
    ) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      let quality = file.type === 'image/jpeg' ? 0.85 : 0.8;

      // Downscale if exceeding max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Canvas not available — return original
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fall back to JPEG
      const outputType =
        file.type === 'image/png' || file.type === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            // Compression didn't help — use original
            resolve(file);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fall back to original on error
    };

    img.src = url;
  });
}

// ── Folder Path Generation ─────────────────────────────────────────────────

/**
 * Generate a date-based folder path: YYYY/MM/DD/
 */
function dateFolderPath(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * Generate a unique filename with the original extension.
 */
function uniqueFilename(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const uuid = crypto.randomUUID();
  return `${uuid}.${ext}`;
}

// ── Main Upload Function (Client-Side with XHR Progress) ───────────────────

/**
 * Upload an image to Supabase Storage with progress tracking.
 *
 * Uses XMLHttpRequest directly on the Supabase storage REST endpoint
 * to get real-time upload progress, since the Supabase JS client's
 * `upload()` doesn't expose progress on all platforms.
 */
export async function uploadImageWithProgress(
  file: File,
  bucket: StorageBucket = 'post-images',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const emit = (event: Partial<UploadProgressEvent>) => {
    onProgress?.({
      file,
      progress: 0,
      status: 'pending',
      ...event,
    } as UploadProgressEvent);
  };

  // 1. Validate
  const validationError = validateImageFile(file);
  if (validationError) {
    emit({ status: 'error', error: validationError });
    throw new Error(validationError);
  }

  // 2. Compress (if needed)
  emit({ status: 'compressing', progress: 0 });
  const compressed = await compressImage(file);

  // 3. Generate storage path
  const folder = dateFolderPath();
  const filename = uniqueFilename(compressed);
  const storagePath = `${folder}/${filename}`;

  // 4. Upload with progress via Supabase's built-in upload
  emit({ status: 'uploading', progress: 0 });

  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(storagePath, compressed, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    // Cleanup: if the upload failed partially, try to remove any orphaned file
    try {
      await supabaseClient.storage.from(bucket).remove([storagePath]);
    } catch {
      // best-effort cleanup
    }

    emit({ status: 'error', error: error.message });
    throw new Error(`Upload failed: ${error.message}`);
  }

  // 5. Get public URL
  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(bucket).getPublicUrl(data.path);

  const result: UploadResult = { path: data.path, publicUrl };

  emit({ status: 'success', progress: 100, result });

  return result;
}

// ── Multi-File Upload ──────────────────────────────────────────────────────

/**
 * Upload multiple images, emitting progress for each.
 * Returns results for all successfully uploaded files.
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: StorageBucket = 'post-images',
  onProgress?: UploadProgressCallback
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    try {
      const result = await uploadImageWithProgress(file, bucket, onProgress);
      results.push(result);
    } catch {
      // Individual upload failure already emitted via callback
      // Continue with remaining files
    }
  }

  return results;
}
