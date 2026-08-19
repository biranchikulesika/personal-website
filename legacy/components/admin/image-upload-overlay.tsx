'use client';

import { UploadCloud } from 'lucide-react';

interface ImageUploadOverlayProps {
  isDragging: boolean;
}

/**
 * Full-cover drag overlay that appears when files are dragged over the editor.
 * Provides clear visual feedback about what will happen on drop.
 */
export default function ImageUploadOverlay({ isDragging }: ImageUploadOverlayProps) {
  if (!isDragging) return null;

  return (
    <div
      className="absolute inset-0 z-[60] pointer-events-none flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 rounded-full bg-[#ff7700]/10 border border-[#ff7700]/30">
          <UploadCloud className="w-10 h-10 text-[#ff7700]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-lg font-medium text-neutral-200">
            Drop images here
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Supports JPEG, PNG, WebP, GIF, AVIF &middot; Max 10 MB each
          </p>
        </div>
      </div>

      {/* Dotted border indicator */}
      <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-[#ff7700]/40 pointer-events-none" />
    </div>
  );
}
