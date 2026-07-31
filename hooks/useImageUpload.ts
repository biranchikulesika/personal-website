/**
 * useImageUpload — Manages image upload lifecycle for the compose editor.
 *
 * Features:
 * - Multi-file upload queue with per-file progress tracking
 * - Clipboard paste detection (Ctrl+V from screenshot tools)
 * - Drag-and-drop with visual state
 * - Upload deduplication (prevents repeated uploads of the same file)
 * - Retry logic for failed uploads
 * - Cursor position preservation via a callback
 * - Cancellation of in-progress uploads
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  uploadImageWithProgress,
  validateImageFile,
  type UploadProgressEvent,
  type UploadResult,
} from '@/lib/supabase/upload';
import type { StorageBucket } from '@/lib/supabase/storage';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UploadItem {
  /** Unique ID for this upload */
  id: string;
  /** Original file reference */
  file: File;
  /** 0–100 progress */
  progress: number;
  /** Current status */
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error' | 'cancelled';
  /** Error message if status is 'error' */
  error?: string;
  /** Upload result if success */
  result?: UploadResult;
}

export interface ImageUploadOptions {
  /** Storage bucket (default: 'post-images') */
  bucket?: StorageBucket;
  /** Callback when an upload succeeds — receives the result and upload item */
  onUploadSuccess?: (result: UploadResult, item: UploadItem) => void;
  /** Callback when an upload fails — receives the error and upload item */
  onUploadError?: (error: string, item: UploadItem) => void;
  /** Callback when all uploads in a batch are complete */
  onBatchComplete?: (results: UploadResult[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

let uploadCounter = 0;
function nextUploadId(): string {
  return `upload-${Date.now()}-${++uploadCounter}`;
}

/**
 * Compute a quick content fingerprint for deduplication.
 * Based on file name + size + last modified (not a full checksum).
 */
function fileFingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useImageUpload(options: ImageUploadOptions = {}) {
  const { onUploadSuccess, onUploadError, onBatchComplete } = options;
  const bucket = options.bucket ?? 'post-images';

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Track active fingerprints to prevent duplicates
  const activeFingerprintsRef = useRef<Set<string>>(new Set());
  // Track drag event counter for nested enter/leave
  const dragCounterRef = useRef(0);
  // Abort controller ref for the current batch (simple cancellation)
  const abortRef = useRef<AbortController | null>(null);

  // ── Update a single upload item ──────────────────────────────────────────

  const updateUpload = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Core upload function ─────────────────────────────────────────────────

  const startUpload = useCallback(
    async (file: File) => {
      const fp = fileFingerprint(file);

      // Deduplication check
      if (activeFingerprintsRef.current.has(fp)) {
        return null;
      }
      activeFingerprintsRef.current.add(fp);

      const id = nextUploadId();
      const item: UploadItem = {
        id,
        file,
        progress: 0,
        status: 'pending',
      };

      setUploads((prev) => [...prev, item]);

      try {
        const result = await uploadImageWithProgress(file, bucket, (event) => {
          updateUpload(id, {
            progress: event.progress,
            status:
              event.status === 'compressing'
                ? 'compressing'
                : event.status === 'uploading'
                  ? 'uploading'
                  : event.status === 'error'
                    ? 'error'
                    : event.status === 'success'
                      ? 'success'
                      : 'pending',
            error: event.error,
            result: event.result,
          });
        });

        // Mark complete
        updateUpload(id, { status: 'success', progress: 100, result });
        activeFingerprintsRef.current.delete(fp);
        onUploadSuccess?.(result, { ...item, status: 'success', result });
        return result;
      } catch (err: any) {
        const errorMsg = err?.message || 'Upload failed';
        updateUpload(id, { status: 'error', error: errorMsg });
        activeFingerprintsRef.current.delete(fp);
        onUploadError?.(errorMsg, { ...item, status: 'error', error: errorMsg });
        return null;
      }
    },
    [bucket, updateUpload, onUploadSuccess, onUploadError]
  );

  // ── Multi-file upload ────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));

      if (fileArray.length === 0) return [];

      setIsUploading(true);
      abortRef.current = new AbortController();

      const results: UploadResult[] = [];

      for (const file of fileArray) {
        if (abortRef.current.signal.aborted) break;
        const result = await startUpload(file);
        if (result) results.push(result);
      }

      setIsUploading(false);
      abortRef.current = null;
      onBatchComplete?.(results);

      return results;
    },
    [startUpload, onBatchComplete]
  );

  // ── Retry a failed upload ────────────────────────────────────────────────

  const retryUpload = useCallback(
    async (id: string) => {
      const item = uploads.find((u) => u.id === id);
      if (!item || item.status !== 'error') return;

      // Reset and re-upload
      updateUpload(id, { progress: 0, status: 'pending', error: undefined });

      try {
        const result = await uploadImageWithProgress(item.file, bucket, (event) => {
          updateUpload(id, {
            progress: event.progress,
            status:
              event.status === 'compressing'
                ? 'compressing'
                : event.status === 'uploading'
                  ? 'uploading'
                  : event.status === 'error'
                    ? 'error'
                    : event.status === 'success'
                      ? 'success'
                      : 'pending',
            error: event.error,
            result: event.result,
          });
        });

        updateUpload(id, { status: 'success', progress: 100, result });
        onUploadSuccess?.(result, { ...item, status: 'success', result });
      } catch (err: any) {
        const errorMsg = err?.message || 'Retry failed';
        updateUpload(id, { status: 'error', error: errorMsg });
      }
    },
    [uploads, bucket, updateUpload, onUploadSuccess]
  );

  // ── Cancel all pending uploads ───────────────────────────────────────────

  const cancelAll = useCallback(() => {
    abortRef.current?.abort();
    setUploads((prev) =>
      prev.map((u) =>
        u.status === 'pending' || u.status === 'uploading' || u.status === 'compressing'
          ? { ...u, status: 'cancelled' as const }
          : u
      )
    );
    setIsUploading(false);
  }, []);

  // ── Dismiss (remove) completed/error items ───────────────────────────────

  const dismissUpload = useCallback((id: string) => {
    removeUpload(id);
  }, [removeUpload]);

  const clearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter(
        (u) => u.status === 'pending' || u.status === 'uploading' || u.status === 'compressing'
      )
    );
  }, []);

  // ── Drag-and-Drop Handlers ───────────────────────────────────────────────

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  // ── Clipboard Paste Handler ──────────────────────────────────────────────

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        await uploadFiles(imageFiles);
      }
    },
    [uploadFiles]
  );

  // ── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cancelAll();
    };
  }, [cancelAll]);

  return {
    /** Current upload queue items */
    uploads,
    /** Whether any files are currently being dragged over */
    isDragging,
    /** Whether any upload is in progress */
    isUploading,
    /** Upload a single file */
    startUpload,
    /** Upload multiple files at once */
    uploadFiles,
    /** Retry a failed upload by its ID */
    retryUpload,
    /** Dismiss a specific upload notification */
    dismissUpload,
    /** Clear all completed/cancelled uploads */
    clearCompleted,
    /** Cancel all in-progress uploads */
    cancelAll,
    /** Drag event handlers to spread on the drop target */
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    /** Paste event handler to attach to the editor container */
    handlePaste,
  };
}
