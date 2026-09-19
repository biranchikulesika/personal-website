'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';
import { addMediaAction } from '@/app/admin/actions';
import { UploadIcon, LinkIcon, ImageIcon, CheckIcon } from '@/components/icons';
import { NoMediaState, NoSearchResults } from '@/components/ui/states';

interface BookCoverPickerProps {
  value: string;
  onChange: (value: string) => void;
  mediaItems: MediaItem[];
  onMediaAdded?: (media: MediaItem) => void;
  title?: string;
  author?: string;
}

type SourceMode = 'idle' | 'import';

function isImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^https?:\/\/.+/i.test(trimmed) || /^data:image\//i.test(trimmed);
}

async function readClipboardImageUrl(): Promise<string | null> {
  try {
    if (typeof navigator.clipboard?.readText !== 'function') return null;
    const text = await navigator.clipboard.readText();
    return isImageUrl(text) ? text.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Cover image editor for the book — the preview IS the editor. The source
 * controls (paste link, upload from device, import from the media library)
 * live inside the preview itself, so the admin sets the cover exactly where
 * they see it:
 *
 *  - No cover set → a centered segmented control inside the cover area:
 *    Paste link | Upload | Import. Drag & drop works on the whole area.
 *  - Cover set    → only a small remove button, overlaid top-right. The
 *    source controls return after the cover is removed.
 */
export function BookCoverPicker({
  value,
  onChange,
  mediaItems,
  onMediaAdded,
  title = '',
  author = '',
}: BookCoverPickerProps) {
  const [mode, setMode] = useState<SourceMode>('idle');
  const [search, setSearch] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss the inline clipboard error.
  useEffect(() => {
    if (!pasteError) return;
    const timer = setTimeout(() => setPasteError(null), 3500);
    return () => clearTimeout(timer);
  }, [pasteError]);

  const filteredMedia = mediaItems.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.alt.toLowerCase().includes(search.toLowerCase()),
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const commitCover = (url: string) => {
    onChange(url);
    setMode('idle');
  };

  const handlePasteLink = async () => {
    const url = await readClipboardImageUrl();
    if (url) {
      commitCover(url);
      setPasteError(null);
      showToast('Cover set from clipboard link');
    } else {
      setMode('idle');
      setPasteError(
        "Clipboard doesn't contain a valid image URL. Copy a link or image and try again.",
      );
    }
  };

  async function handleFileUpload(files: FileList | File[] | null) {
    const file = files?.[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const media: MediaItem = {
        id: `media-${Date.now()}`,
        name: file.name,
        src: dataUrl,
        alt: file.name.replace(/\.[^.]+$/, ''),
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        tag: 'book',
      };

      const res = await addMediaAction(media);
      commitCover(dataUrl);
      if (res.success && res.media) {
        onMediaAdded?.(res.media);
        showToast(`"${file.name}" uploaded and set as cover`);
      } else {
        showToast('Cover set locally (media registration failed)');
      }
    } catch (err: unknown) {
      showToast((err as Error).message || 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const removeCover = () => {
    onChange('');
    setMode('idle');
  };

  return (
    <div
      className="relative aspect-2/3 w-full overflow-hidden rounded-xl border border-tinted/20 bg-post-card shadow-sm"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files.length > 0) {
          void handleFileUpload(event.dataTransfer.files);
        }
      }}
    >
      {/* The cover image or the book placeholder */}
      {value.trim() ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={value}
          alt={`${title || 'Book'} cover`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute bottom-0 left-0 top-0 w-2.5 border-r border-tinted/30 bg-night-soft"
          />
          <div className="flex h-full w-full flex-col justify-between p-4">
            <div className="pl-2">
              <span className="font-serif text-sm font-normal italic leading-snug text-paper sm:text-base">
                {title || 'Untitled'}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-tinted/20 pl-2 pt-2 text-[11px] text-gray-mid">
              <span className="truncate pr-1">{author || 'Author'}</span>
            </div>
          </div>
        </>
      )}

      {/* Cover set → minimal remove button only */}
      {value.trim() ? (
        <button
          type="button"
          onClick={removeCover}
          title="Remove cover"
          aria-label="Remove cover"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-night/80 text-paper border border-tinted/30 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-red-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <path d="M5 12h14" />
          </svg>
        </button>
      ) : (
        /* No cover → segmented paste / upload / import control inside the preview */
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px]">
          <div className="w-full max-w-47.5 rounded-2xl border border-tinted/20 bg-night/95 p-3 shadow-lg">
            <div className="flex items-center gap-1 rounded-full border border-tinted/20 bg-night-soft p-1">
              <button
                type="button"
                onClick={handlePasteLink}
                title="Paste link"
                aria-label="Paste cover image link"
                className="group flex flex-1 items-center justify-center rounded-full py-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
              >
                <LinkIcon className="h-4 w-4 text-gray-mid group-hover:text-paper" />
              </button>
              <span className="h-4 w-px bg-tinted/30" aria-hidden />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload from device"
                aria-label="Upload cover image from device"
                className="group flex flex-1 items-center justify-center rounded-full py-1.5 text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
              >
                <UploadIcon className="h-4 w-4 text-gray-mid group-hover:text-paper" />
              </button>
              <span className="h-4 w-px bg-tinted/30" aria-hidden />
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'import' ? 'idle' : 'import');
                  setPasteError(null);
                }}
                title="Import from media library"
                aria-label="Import cover image from media library"
                aria-pressed={mode === 'import'}
                className={`group flex flex-1 items-center justify-center rounded-full py-1.5 transition-colors ${
                  mode === 'import'
                    ? 'bg-accent text-paper'
                    : 'text-gray-mid hover:bg-post-card hover:text-paper'
                }`}
              >
                <ImageIcon
                  className={`h-4 w-4 ${
                    mode === 'import' ? 'text-paper' : 'text-gray-mid'
                  }`}
                />
              </button>
            </div>

            {/* Inline clipboard error — never a popup */}
            {pasteError && (
              <p
                role="alert"
                className="mt-2 rounded-lg bg-red-950/40 border border-red-800/40 px-2 py-1 text-center text-[10px] font-medium text-red-400"
              >
                {pasteError}
              </p>
            )}

            {/* Import mode → media library grid */}
            {mode === 'import' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-tinted/20 bg-night-soft px-2.5 py-1.5 text-[11px] text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
                <div className="mt-2 grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto">
                  {filteredMedia.map((media) => {
                    const selected = value === media.src;
                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => {
                          commitCover(media.src);
                          showToast(`"${media.name}" set as cover`);
                        }}
                        className={`group relative aspect-2/3 overflow-hidden rounded-md border transition-all focus:outline-none ${
                          selected
                            ? 'border-accent ring-2 ring-accent/30'
                            : 'border-tinted/20 hover:border-accent/40'
                        }`}
                      >
                        <Image
                          src={media.src}
                          alt={media.alt}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                        {selected && (
                          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-paper">
                            <CheckIcon className="h-2 w-2" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredMedia.length === 0 && (
                    <div className="col-span-full">
                      {mediaItems.length === 0 ? (
                        <NoMediaState compact />
                      ) : (
                        <NoSearchResults
                          compact
                          query={search || undefined}
                          onReset={search ? () => setSearch('') : undefined}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {toast && (
              <p className="mt-2 text-center text-[10px] font-medium text-accent">
                {toast}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hidden upload input — shared by the click / drag & drop target */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFileUpload(event.target.files)}
      />
    </div>
  );
}
