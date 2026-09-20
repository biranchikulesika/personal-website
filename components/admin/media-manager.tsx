'use client';

import { useState, useRef, useTransition, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';
import {
  addMediaAction,
  deleteMediaAction,
  deleteOrphanedMediaAction,
} from '@/app/admin/actions';
import {
  TrashIcon,
  LinkIcon,
  CodeIcon,
  EllipsisVerticalIcon,
  PencilIcon,
} from '@/components/icons';
import { NoMediaState, NoSearchResults } from '@/components/ui/states';
import { formatDisplayDateTime } from '@/lib/utils';

interface MediaManagerProps {
  initialMedia: MediaItem[];
  initialOrphanedMedia?: MediaItem[];
}

export function MediaManager({
  initialMedia,
  initialOrphanedMedia = [],
}: MediaManagerProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [orphanedList, setOrphanedList] = useState<MediaItem[]>(
    initialOrphanedMedia,
  );
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [showOrphanedOnly, setShowOrphanedOnly] = useState(false);
  const [selectedOrphanedIds, setSelectedOrphanedIds] = useState<Set<string>>(
    new Set(),
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    items: MediaItem[];
  } | null>(null);
  const [confirmTypedText, setConfirmTypedText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [captionInput, setCaptionInput] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [activePhoto, setActivePhoto] = useState<MediaItem | null>(null);
  const { message: toastMessage, showToast } = useToast(3000);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orphanedSrcs = new Set(orphanedList.map((m) => m.src));

  // New Media Form State
  const [fileName, setFileName] = useState('');
  const [fileSrc, setFileSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [fileSize, setFileSize] = useState('250 KB');
  const [dimensions, setDimensions] = useState('1200 × 800');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const m of mediaList) {
      const tags = Array.isArray(m.tags)
        ? m.tags
        : m.tag ? [m.tag] : [];
      for (const t of tags) {
        const cleaned = t.trim().toLowerCase();
        if (cleaned && cleaned !== 'atmosphere' && cleaned !== 'profile') {
          set.add(cleaned);
        }
      }
    }
    return Array.from(set).sort();
  }, [mediaList]);

  function getCleanExtension(file: File): string {
    const mime = file.type.toLowerCase();
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    if (mime === 'image/svg+xml') return 'svg';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    const match = file.name.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'jpg';
  }

  function generateResourceName(file: File): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const randomHash = Math.random().toString(36).substring(2, 10);
    const ext = getCleanExtension(file);
    return `res-${dateStr}-${randomHash}.${ext}`;
  }

  function stripImageMetadata(
    dataUrl: string,
    mimeType: string,
  ): Promise<{ cleanDataUrl: string; width: number; height: number; sizeBytes: number }> {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              cleanDataUrl: dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              sizeBytes: Math.round((dataUrl.length * 3) / 4),
            });
            return;
          }

          // Draw image to 2D canvas: extracts pure pixel buffer and discards all EXIF, GPS, camera and device metadata
          ctx.drawImage(img, 0, 0);

          let exportMime = 'image/jpeg';
          let quality: number | undefined = 0.95;
          if (mimeType === 'image/png') {
            exportMime = 'image/png';
            quality = undefined;
          } else if (mimeType === 'image/webp') {
            exportMime = 'image/webp';
            quality = 0.95;
          }

          const cleanDataUrl = canvas.toDataURL(exportMime, quality);
          const approxBytes = Math.round((cleanDataUrl.length * 3) / 4);

          resolve({
            cleanDataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeBytes: approxBytes,
          });
        } catch {
          resolve({
            cleanDataUrl: dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeBytes: Math.round((dataUrl.length * 3) / 4),
          });
        }
      };
      img.onerror = () => {
        resolve({
          cleanDataUrl: dataUrl,
          width: 1200,
          height: 800,
          sizeBytes: Math.round((dataUrl.length * 3) / 4),
        });
      };
      img.src = dataUrl;
    });
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;

      // 1. Strip all metadata (EXIF, GPS, camera specs, device profiles) via canvas re-encoding
      const { cleanDataUrl, width, height, sizeBytes } =
        await stripImageMetadata(rawDataUrl, file.type);

      // 2. Completely rename the file using standard resource convention (res-YYYYMMDD-[hash].[ext])
      const cleanResourceName = generateResourceName(file);

      setFileSrc(cleanDataUrl);
      setFileName(cleanResourceName);
      // 3. Keep alt text empty by default; user may add it if desired
      setAltText('');
      setFileSize(`${Math.max(1, Math.round(sizeBytes / 1024))} KB`);
      setDimensions(`${width} × ${height}`);
      setTagsInput(activeTag !== 'all' ? activeTag : '');

      setIsUploading(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCopy(id: string, text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied to clipboard!');
  }

  function handleAddMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName.trim() || !fileSrc.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && t !== 'atmosphere' && t !== 'profile');

    const newMedia: MediaItem = {
      id: `media-${Date.now()}`,
      name: fileName.trim(),
      src: fileSrc,
      alt: altText.trim(),
      size: fileSize,
      dimensions,
      uploadedAt: new Date().toISOString(),
      tags: parsedTags,
    };

    startTransition(async () => {
      const res = await addMediaAction(newMedia);
      if (res.success && res.media) {
        setMediaList((prev) => [res.media!, ...prev]);
        setIsUploading(false);
        setFileName('');
        setFileSrc('');
        setAltText('');
        setTagsInput('');
        showToast(`Resource "${fileName}" added to library!`);
      } else {
        showToast(res.error || 'Failed to add media');
      }
    });
  }

  function toggleOrphanedSelection(id: string) {
    setSelectedOrphanedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function requestDelete(items: MediaItem[]) {
    setConfirmTypedText('');
    setConfirmDelete({ items });
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    const items = confirmDelete.items;
    const orphanItems = items.filter((m) => orphanedSrcs.has(m.src));
    const recordItems = items.filter((m) => !orphanedSrcs.has(m.src));
    startTransition(async () => {
      let ok = true;
      if (orphanItems.length > 0) {
        const srcs = orphanItems.map((m) => m.src);
        const res = await deleteOrphanedMediaAction(srcs);
        if (res.success) {
          const removed = new Set(srcs);
          setOrphanedList((prev) => prev.filter((m) => !removed.has(m.src)));
        } else {
          showToast(res.error || 'Failed to delete assets');
          ok = false;
        }
      }
      for (const media of recordItems) {
        const res = await deleteMediaAction(media.id);
        if (res.success) {
          setMediaList((prev) => prev.filter((m) => m.id !== media.id));
        } else {
          showToast(res.error || 'Failed to delete media');
          ok = false;
        }
      }
      if (ok) {
        setSelectedOrphanedIds(new Set());
        setConfirmDelete(null);
        setConfirmTypedText('');
        showToast(`Deleted ${items.length} asset${items.length > 1 ? 's' : ''}`);
      }
    });
  }

  function handleOpenEditDetails(media: MediaItem) {
    setMenuOpenId(null);
    setEditingMedia(media);
    setCaptionInput(media.alt || '');
    const tags = Array.isArray(media.tags)
      ? media.tags
      : media.tag ? [media.tag] : [];
    setEditTagsInput(
      tags.filter((t) => t !== 'atmosphere' && t !== 'profile').join(', ')
    );
  }

  function handleSaveDetails(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!editingMedia) return;
    const target = editingMedia;
    const newCaption = captionInput.trim();
    const parsedTags = editTagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && t !== 'atmosphere' && t !== 'profile');

    const updatedMedia: MediaItem = {
      ...target,
      alt: newCaption,
      tags: parsedTags,
    };

    startTransition(async () => {
      const res = await addMediaAction(updatedMedia);
      if (res.success && res.media) {
        setMediaList((prev) => {
          const exists = prev.some((m) => m.id === target.id);
          if (exists) {
            return prev.map((m) => (m.id === target.id ? res.media! : m));
          }
          return [res.media!, ...prev];
        });
        setOrphanedList((prev) => prev.filter((m) => m.src !== target.src));
        setEditingMedia(null);
        showToast('Resource updated successfully');
      } else {
        showToast(res.error || 'Failed to update resource');
      }
    });
  }

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick() {
      setMenuOpenId(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpenId(null);
      }
    }
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpenId]);

  const confirmRequirement = 'DELETE';

  const filteredMedia = mediaList.filter((m) => {
    const q = search.toLowerCase();
    const itemTags = (Array.isArray(m.tags) ? m.tags : m.tag ? [m.tag] : [])
      .map((t) => t.toLowerCase())
      .filter((t) => t !== 'atmosphere' && t !== 'profile');

    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.alt.toLowerCase().includes(q) ||
      itemTags.some((t) => t.includes(q));

    const matchTag =
      activeTag === 'all' || itemTags.includes(activeTag.toLowerCase());

    return matchSearch && matchTag;
  });

  const visibleMedia = showOrphanedOnly
    ? orphanedList.filter((m) => {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.alt.toLowerCase().includes(q) ||
          m.src.toLowerCase().includes(q)
        );
      })
    : filteredMedia;

  useEffect(() => {
    if (!activePhoto) return;
    const currentPhoto = activePhoto;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      } else if (e.key === 'ArrowLeft') {
        const idx = visibleMedia.findIndex((m) => m.id === currentPhoto.id);
        if (idx > 0) setActivePhoto(visibleMedia[idx - 1]);
        else if (visibleMedia.length > 0) setActivePhoto(visibleMedia[visibleMedia.length - 1]);
      } else if (e.key === 'ArrowRight') {
        const idx = visibleMedia.findIndex((m) => m.id === currentPhoto.id);
        if (idx < visibleMedia.length - 1) setActivePhoto(visibleMedia[idx + 1]);
        else if (visibleMedia.length > 0) setActivePhoto(visibleMedia[0]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhoto, visibleMedia]);

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* Hidden Device File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* ── Mobile Phone Gallery View (md:hidden) ── */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Search & Upload Header */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search photos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-tinted/20 bg-night-soft px-4 py-2 text-xs text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add resource"
            title="Add resource"
            className="flex h-9 shrink-0 items-center justify-center rounded-full bg-accent px-3 text-xs font-semibold text-paper shadow-xs hover:bg-accent-hover active:scale-95 transition-all"
          >
            + Resource
          </button>
        </div>

        {/* Mobile Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTag('all');
              setShowOrphanedOnly(false);
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all ${
              activeTag === 'all' && !showOrphanedOnly
                ? 'bg-accent text-paper shadow-xs'
                : 'bg-night-soft text-gray-mid border border-tinted/20'
            }`}
          >
            All
          </button>
          {allTags.map((tagItem) => (
            <button
              key={`mob-filter-${tagItem}`}
              type="button"
              onClick={() => {
                setActiveTag(tagItem);
                setShowOrphanedOnly(false);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider shrink-0 transition-all ${
                activeTag === tagItem && !showOrphanedOnly
                  ? 'bg-accent text-paper shadow-xs'
                  : 'bg-night-soft text-gray-mid border border-tinted/20'
              }`}
            >
              #{tagItem}
            </button>
          ))}

          {orphanedSrcs.size > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowOrphanedOnly((v) => !v);
                setActiveTag('all');
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all ${
                showOrphanedOnly
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
              }`}
            >
              {orphanedSrcs.size} orphaned
            </button>
          )}
        </div>

        {/* 3-Column Square Gallery Grid */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {visibleMedia.map((media) => {
            const isOrphaned = orphanedSrcs.has(media.src);
            return (
              <button
                key={`mob-photo-${media.id}`}
                type="button"
                onClick={() => setActivePhoto(media)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg bg-night focus:outline-none active:scale-95 transition-transform"
              >
                {isOrphaned ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-amber-950/30 p-1 text-center">
                    <svg
                      className="h-5 w-5 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                    <span className="mt-0.5 text-[8px] font-bold uppercase text-amber-400">
                      Orphan
                    </span>
                  </div>
                ) : (
                  <Image
                    src={media.src}
                    alt={media.alt}
                    fill
                    sizes="33vw"
                    className="object-cover"
                    unoptimized
                  />
                )}
                {media.tags && media.tags.length > 0 && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[8px] font-mono text-paper/90 backdrop-blur-xs">
                    #{media.tags[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {visibleMedia.length === 0 && (
          <div className="rounded-2xl border border-tinted/20 bg-post-card p-6 text-center">
            <p className="font-serif text-base text-paper">No photos found</p>
            <p className="mt-1 text-xs text-gray-mid">No media items match your search or filter.</p>
          </div>
        )}
      </div>

      {/* ── Fullscreen Gallery Lightbox Modal ── */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo viewer for ${activePhoto.name}`}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between border-b border-tinted/20 pb-3 sm:pb-4">
            <div className="min-w-0 flex-1 pr-4">
              <h4 className="truncate font-mono text-xs sm:text-sm md:text-base font-semibold text-paper">
                {activePhoto.name}
              </h4>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-mid">
                {activePhoto.tags && activePhoto.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {activePhoto.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-night px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono text-gray-mid border border-tinted/20"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <span>{activePhoto.dimensions || 'Image'}</span>
                <span>·</span>
                <span>{activePhoto.size}</span>
                {activePhoto.uploadedAt && (
                  <>
                    <span>·</span>
                    <span>Uploaded {formatDisplayDateTime(activePhoto.uploadedAt)}</span>
                  </>
                )}
                {activePhoto.alt && activePhoto.alt !== activePhoto.name && (
                  <>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline italic text-gray-mid/80 truncate max-w-md">
                      &ldquo;{activePhoto.alt}&rdquo;
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = activePhoto;
                  setActivePhoto(null);
                  handleOpenEditDetails(target);
                }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-night-soft text-paper hover:bg-post-card transition-colors shrink-0"
                aria-label="Edit details"
                title="Edit details"
              >
                <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = activePhoto;
                  setActivePhoto(null);
                  requestDelete([target]);
                }}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-night-soft text-red-400 hover:bg-post-card transition-colors shrink-0"
                aria-label="Delete photo"
                title="Delete photo"
              >
                <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-night-soft text-paper hover:bg-post-card transition-colors shrink-0"
                aria-label="Close photo preview"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage with Previous & Next controls */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden py-3 sm:py-6 cursor-zoom-out"
            onClick={(e) => {
              if (e.target === e.currentTarget) setActivePhoto(null);
            }}
          >
            <div className="relative h-full w-full max-h-[70vh] sm:max-h-[78vh] max-w-5xl cursor-default">
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt || activePhoto.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Nav Controls */}
            {visibleMedia.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = visibleMedia.findIndex((m) => m.id === activePhoto.id);
                    if (idx > 0) setActivePhoto(visibleMedia[idx - 1]);
                    else setActivePhoto(visibleMedia[visibleMedia.length - 1]);
                  }}
                  className="absolute left-2 sm:left-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-paper text-xl sm:text-2xl backdrop-blur-xs hover:bg-black/80 active:scale-95 transition-all"
                  aria-label="Previous photo"
                  title="Previous (Left arrow)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = visibleMedia.findIndex((m) => m.id === activePhoto.id);
                    if (idx < visibleMedia.length - 1) setActivePhoto(visibleMedia[idx + 1]);
                    else setActivePhoto(visibleMedia[0]);
                  }}
                  className="absolute right-2 sm:right-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 text-paper text-xl sm:text-2xl backdrop-blur-xs hover:bg-black/80 active:scale-95 transition-all"
                  aria-label="Next photo"
                  title="Next (Right arrow)"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Action Bar */}
          <div className="border-t border-tinted/20 pt-3 sm:pt-4">
            <div className="mx-auto flex max-w-md items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleCopy(`url-${activePhoto.id}`, activePhoto.src)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-night-soft border border-tinted/20 py-2.5 text-xs font-medium text-paper transition-all hover:bg-night hover:border-tinted/40 active:scale-95"
              >
                {copiedId === `url-${activePhoto.id}` ? (
                  <span className="text-emerald-400">✓ Copied URL</span>
                ) : (
                  <>
                    <LinkIcon className="h-3.5 w-3.5 text-gray-mid" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(`md-${activePhoto.id}`, `![${activePhoto.alt}](${activePhoto.src})`)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-night-soft border border-tinted/20 py-2.5 text-xs font-medium text-paper transition-all hover:bg-night hover:border-tinted/40 active:scale-95"
              >
                {copiedId === `md-${activePhoto.id}` ? (
                  <span className="text-emerald-400">✓ Copied MD</span>
                ) : (
                  <>
                    <CodeIcon className="h-3.5 w-3.5 text-gray-mid" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            </div>

            {orphanedSrcs.has(activePhoto.src) && (
              <div className="mt-2.5 mx-auto max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    const target = activePhoto;
                    setActivePhoto(null);
                    requestDelete([target]);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-950/50 border border-red-800/40 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/60 transition-colors"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Delete from bucket</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Desktop View (hidden md:block) ── */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
              Resources
            </h2>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-paper shadow-xs transition-all hover:bg-accent-hover active:scale-95"
          >
            + Resource
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTag('all');
                setShowOrphanedOnly(false);
              }}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTag === 'all' && !showOrphanedOnly
                  ? 'bg-accent text-paper shadow-xs'
                  : 'bg-night-soft text-gray-mid border border-tinted/20 hover:text-paper'
              }`}
            >
              All
            </button>

            {allTags.map((tagItem) => (
              <button
                key={`desk-filter-${tagItem}`}
                type="button"
                onClick={() => {
                  setActiveTag(tagItem);
                  setShowOrphanedOnly(false);
                }}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold tracking-wider transition-all ${
                  activeTag === tagItem && !showOrphanedOnly
                    ? 'bg-accent text-paper shadow-xs'
                    : 'bg-night-soft text-gray-mid border border-tinted/20 hover:text-paper'
                }`}
              >
                #{tagItem}
              </button>
            ))}

            {orphanedSrcs.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowOrphanedOnly((v) => !v);
                  setActiveTag('all');
                }}
                title="Media assets in the storage bucket that are not used anywhere on the site"
                aria-pressed={showOrphanedOnly}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  showOrphanedOnly
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-950/40 text-amber-400 border border-amber-800/40 hover:bg-amber-950/60'
                }`}
              >
                {orphanedSrcs.size} orphaned
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="Search assets by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-full border border-tinted/20 bg-night-soft px-4 py-1.5 text-xs text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
          />
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleMedia.map((media) => {
            const markdownSnippet = `![${media.alt}](${media.src})`;
            const isOrphaned = orphanedSrcs.has(media.src);
            const isSelected = selectedOrphanedIds.has(media.id);
            const isMenuOpen = menuOpenId === media.id;
            return (
              <div
                key={media.id}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-post-card shadow-sm transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-400'
                    : 'border-tinted/20 hover:border-accent/40'
                }`}
              >
                {/* Photo Preview */}
                <div
                  className="relative aspect-4/3 w-full overflow-hidden bg-night cursor-pointer"
                  onClick={() => setActivePhoto(media)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View full picture of ${media.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActivePhoto(media);
                    }
                  }}
                >
                  {isOrphaned ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-amber-950/20">
                      <svg
                        className="h-8 w-8 text-amber-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                        In bucket · unreferenced
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={media.src}
                      alt={media.alt || 'Resource photo'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  )}

                  {/* Top-Left: Status / Checkbox + Dimensions & Size Pill */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                    {isOrphaned && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrphanedSelection(media.id);
                        }}
                        aria-label={
                          isSelected
                            ? `Deselect ${media.name}`
                            : `Select ${media.name}`
                        }
                        aria-pressed={isSelected}
                        className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 transition-colors ${
                          isSelected
                            ? 'bg-amber-600 text-white ring-amber-600'
                            : 'bg-night text-transparent ring-tinted/40 hover:ring-amber-500'
                        }`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </button>
                    )}

                    {(media.dimensions || media.size) && (
                      <span className="pointer-events-none select-none rounded-full bg-night/80 backdrop-blur-xs px-2 py-1 text-[10px] font-mono text-gray-mid border border-tinted/20">
                        {media.dimensions ? `${media.dimensions} · ` : ''}{media.size}
                      </span>
                    )}
                  </div>

                  {/* Top-Right: Quick Actions (Copy URL, Copy MD, Three-Dot Menu) */}
                  <div
                    className={`absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 transition-opacity duration-200 ${
                      isMenuOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto'
                    }`}
                  >
                    {/* Copy URL Button */}
                    <button
                      type="button"
                      aria-label="Copy URL"
                      title="Copy URL"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(`url-${media.id}`, media.src);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-night/80 text-paper/90 backdrop-blur-xs border border-tinted/20 transition-all hover:bg-night hover:text-paper hover:border-tinted/40 focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
                    >
                      {copiedId === `url-${media.id}` ? (
                        <span className="text-[11px] font-bold text-emerald-400">✓</span>
                      ) : (
                        <LinkIcon className="h-3.5 w-3.5 text-gray-mid hover:text-paper" />
                      )}
                    </button>

                    {/* Copy MD Button */}
                    <button
                      type="button"
                      aria-label="Copy Markdown"
                      title="Copy Markdown"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(`md-${media.id}`, markdownSnippet);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-night/80 text-paper/90 backdrop-blur-xs border border-tinted/20 transition-all hover:bg-night hover:text-paper hover:border-tinted/40 focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
                    >
                      {copiedId === `md-${media.id}` ? (
                        <span className="text-[11px] font-bold text-emerald-400">✓</span>
                      ) : (
                        <CodeIcon className="h-3.5 w-3.5 text-gray-mid hover:text-paper" />
                      )}
                    </button>

                    {/* Three-Dot Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        aria-label={`Actions for ${media.name}`}
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(isMenuOpen ? null : media.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-night/80 text-paper/90 backdrop-blur-xs border border-tinted/20 transition-all hover:bg-night hover:text-paper hover:border-tinted/40 focus:outline-none focus:ring-1 focus:ring-accent active:scale-95"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4 text-gray-mid hover:text-paper" />
                      </button>

                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1.5 z-40 w-36 rounded-xl border border-tinted/20 bg-night-soft p-1 shadow-xl animate-in fade-in zoom-in-95 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditDetails(media)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-night"
                          >
                            <PencilIcon className="h-3.5 w-3.5 text-gray-mid" />
                            <span>Edit details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              requestDelete([media]);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40 hover:text-red-300"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Image Overlay: Tags (shown on hover) */}
                  {media.tags && media.tags.length > 0 && (
                    <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex flex-wrap items-center gap-1 overflow-hidden opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                      {media.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTag(t);
                            setShowOrphanedOnly(false);
                          }}
                          title={`Filter by #${t}`}
                          className="rounded-md bg-black/75 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-mono text-paper/90 border border-white/10 hover:border-accent hover:text-accent transition-colors"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {visibleMedia.length === 0 && (
            <div className="col-span-full">
              {mediaList.length === 0 ? (
                <NoMediaState onUpload={() => fileInputRef.current?.click()} />
              ) : (
                <NoSearchResults
                  query={search || undefined}
                  onReset={
                    search || activeTag !== 'all'
                      ? () => {
                          setSearch('');
                          setActiveTag('all');
                        }
                      : undefined
                  }
                  resetLabel="Reset filters"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar for selected orphaned assets */}
      {showOrphanedOnly && selectedOrphanedIds.size > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-tinted/20 bg-night-soft px-5 py-2.5 shadow-xl">
          <span className="text-xs font-semibold text-paper">
            {selectedOrphanedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrphanedIds(new Set())}
              className="rounded-full px-3 py-1 text-xs font-semibold text-gray-mid hover:text-paper"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() =>
                requestDelete(
                  orphanedList.filter((m) => selectedOrphanedIds.has(m.id)),
                )
              }
              className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs" aria-hidden="true">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${confirmDelete.items.length > 1 ? `${confirmDelete.items.length} assets` : confirmDelete.items[0].name}`}
            className="w-full max-w-md rounded-3xl border border-tinted/20 bg-night-soft p-6 shadow-2xl animate-in zoom-in-95"
            tabIndex={-1}
          >
            <h3 className="font-serif text-xl font-normal text-paper">
              Delete {confirmDelete.items.length > 1 ? `${confirmDelete.items.length} assets` : 'image'}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-mid">
              {confirmDelete.items.length === 1 ? (
                <>
                  Are you sure you want to delete{' '}
                  <b className="text-paper">{confirmDelete.items[0].name}</b>?
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete{' '}
                  <b className="text-paper">
                    {confirmDelete.items.length} assets
                  </b>
                  ? This action cannot be undone.
                </>
              )}
              <span className="mt-3 block">
                Type <b className="text-paper">DELETE</b> to confirm:
              </span>
            </p>
            <input
              type="text"
              autoFocus
              placeholder="Type DELETE to confirm"
              aria-label="Type DELETE to confirm deletion"
              value={confirmTypedText}
              onChange={(e) => setConfirmTypedText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmTypedText === 'DELETE') {
                  handleConfirmDelete();
                }
              }}
              className="mt-3 w-full rounded-xl border border-tinted/20 bg-night px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-gray-mid hover:text-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isPending || confirmTypedText !== confirmRequirement
                }
                onClick={handleConfirmDelete}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-details-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-tinted/20 bg-night-soft p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
              <h3 id="edit-details-title" className="font-serif text-xl font-normal text-paper">
                Edit Resource Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingMedia(null)}
                className="rounded-full p-1.5 text-gray-mid hover:bg-night hover:text-paper transition-colors"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="mt-4 space-y-4">
              {/* Image Preview Thumbnail */}
              <div className="flex items-center gap-3 rounded-2xl border border-tinted/20 bg-night p-2.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-night-soft">
                  <Image
                    src={editingMedia.src}
                    alt={editingMedia.alt || 'Preview'}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-semibold text-paper">
                    {editingMedia.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-mid">
                    {editingMedia.dimensions || '—'} · {editingMedia.size || '—'}
                    {editingMedia.uploadedAt && ` · Uploaded ${formatDisplayDateTime(editingMedia.uploadedAt)}`}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="caption-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-mid"
                >
                  Caption / Alt Text
                </label>
                <input
                  id="caption-input"
                  type="text"
                  autoFocus
                  placeholder="Enter a descriptive caption"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-mid">
                  Used as the alt text when inserting this image into essays and notes.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="edit-tags-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-mid"
                  >
                    Tags
                  </label>
                  <span className="text-[11px] text-gray-mid/60">Comma separated</span>
                </div>
                <input
                  id="edit-tags-input"
                  type="text"
                  placeholder="e.g. essay, cover, workspace"
                  value={editTagsInput}
                  onChange={(e) => setEditTagsInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
                {editTagsInput.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editTagsInput
                      .split(',')
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean)
                      .map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md bg-night-soft px-2 py-0.5 text-[11px] font-mono text-gray-mid border border-tinted/20"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-tinted/20">
                <button
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-gray-mid hover:text-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Media Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative my-8 w-full max-w-lg rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-paper">
                  Add Resource
                </h3>
                <p className="mt-0.5 text-xs text-gray-mid">
                  Review details and add to your media library.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploading(false);
                  setFileSrc('');
                }}
                className="rounded-full p-2 text-gray-mid hover:bg-night-soft hover:text-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="mt-6 space-y-4">
              {/* Preview Thumbnail */}
              {fileSrc && (
                <div className="overflow-hidden rounded-2xl border border-tinted/20 bg-night-soft flex items-center justify-center max-h-56 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileSrc}
                    alt={altText || fileName}
                    className="max-h-52 w-auto object-contain rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                  File Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. res-20260920-a8f3b1c2.jpg"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 font-mono text-xs text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Alt Text
                  </label>
                  <span className="text-[11px] text-gray-mid/60">Optional</span>
                </div>
                <input
                  type="text"
                  placeholder="Leave empty or enter accessible description..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="upload-tags-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-gray-mid"
                  >
                    Tags
                  </label>
                  <span className="text-[11px] text-gray-mid/60">Comma separated (optional)</span>
                </div>
                <input
                  id="upload-tags-input"
                  type="text"
                  placeholder="e.g. essay, cover, workspace"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
                {tagsInput.trim() && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tagsInput
                      .split(',')
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean)
                      .map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-md bg-night px-2 py-0.5 text-[11px] font-mono text-gray-mid border border-tinted/20"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted/20">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploading(false);
                    setFileSrc('');
                  }}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid hover:text-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-6 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Uploading...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
