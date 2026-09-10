'use client';

import { useState, useRef, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';
import {
  addMediaAction,
  deleteMediaAction,
  deleteOrphanedMediaAction,
} from '@/app/admin/actions';
import { TrashIcon, UploadIcon } from '@/components/icons';
import { NoMediaState, NoSearchResults } from '@/components/ui/states';

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
  const [tag, setTag] = useState<MediaItem['tag']>('atmosphere');
  const [fileSize, setFileSize] = useState('250 KB');
  const [dimensions, setDimensions] = useState('1200 × 800');

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFileSrc(dataUrl);
      const cleanName = file.name.replace(/\.[^.]+$/, '');
      setFileName(file.name);
      setAltText(cleanName);
      setFileSize(`${Math.max(1, Math.round(file.size / 1024))} KB`);
      setTag(activeTag !== 'all' ? (activeTag as MediaItem['tag']) : 'atmosphere');

      // Attempt to inspect native image dimensions
      const img = new window.Image();
      img.onload = () => {
        setDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
      };
      img.src = dataUrl;

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

    const newMedia: MediaItem = {
      id: `media-${Date.now()}`,
      name: fileName.trim(),
      src: fileSrc,
      alt: altText.trim() || fileName.trim(),
      size: fileSize,
      dimensions,
      uploadedAt: new Date().toISOString().split('T')[0],
      tag,
    };

    startTransition(async () => {
      const res = await addMediaAction(newMedia);
      if (res.success && res.media) {
        setMediaList((prev) => [res.media!, ...prev]);
        setIsUploading(false);
        setFileName('');
        setFileSrc('');
        setAltText('');
        showToast(`Asset "${fileName}" uploaded to library!`);
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

  function requestDeleteItem(media: MediaItem) {
    setConfirmTypedText('');
    setConfirmDelete({ items: [media] });
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

  const confirmRequirement = 'DELETE';

  const filteredMedia = mediaList.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.alt.toLowerCase().includes(q) ||
      m.tag.toLowerCase().includes(q);
    const matchTag = activeTag === 'all' || m.tag === activeTag;
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
            aria-label="Upload photo"
            title="Upload photo"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-paper shadow-sm hover:bg-accent-hover active:scale-95 transition-all"
          >
            <UploadIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'profile', 'atmosphere', 'post', 'book'].map((t) => (
            <button
              key={`mob-filter-${t}`}
              type="button"
              onClick={() => {
                setActiveTag(t);
                setShowOrphanedOnly(false);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shrink-0 transition-all ${
                activeTag === t
                  ? 'bg-accent text-paper shadow-xs'
                  : 'bg-night-soft text-gray-mid border border-tinted/20'
              }`}
            >
              {t}
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
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    unoptimized
                  />
                )}
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[8px] font-semibold uppercase text-paper/90 backdrop-blur-xs">
                  {media.tag}
                </span>
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

      {/* ── Fullscreen Phone Gallery Lightbox Modal ── */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200 md:hidden">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between border-b border-tinted/20 pb-3">
            <div className="min-w-0 flex-1 pr-3">
              <h4 className="truncate font-mono text-xs font-semibold text-paper">
                {activePhoto.name}
              </h4>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-mid">
                <span className="rounded bg-night px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gray-mid border border-tinted/20">
                  {activePhoto.tag}
                </span>
                <span>{activePhoto.dimensions || 'Image'}</span>
                <span>·</span>
                <span>{activePhoto.size}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-night-soft text-paper hover:bg-post-card shrink-0"
              aria-label="Close photo preview"
            >
              ✕
            </button>
          </div>

          {/* Lightbox Image Stage with Previous & Next controls */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden py-4">
            <div className="relative h-full w-full max-h-[65vh] max-w-full">
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
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
                  onClick={() => {
                    const idx = visibleMedia.findIndex((m) => m.id === activePhoto.id);
                    if (idx > 0) setActivePhoto(visibleMedia[idx - 1]);
                    else setActivePhoto(visibleMedia[visibleMedia.length - 1]);
                  }}
                  className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-paper text-xl backdrop-blur-xs hover:bg-black/80 active:scale-95"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = visibleMedia.findIndex((m) => m.id === activePhoto.id);
                    if (idx < visibleMedia.length - 1) setActivePhoto(visibleMedia[idx + 1]);
                    else setActivePhoto(visibleMedia[0]);
                  }}
                  className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-paper text-xl backdrop-blur-xs hover:bg-black/80 active:scale-95"
                  aria-label="Next photo"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Action Bar */}
          <div className="border-t border-tinted/20 pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopy(`url-${activePhoto.id}`, activePhoto.src)}
                className="flex items-center justify-center rounded-xl bg-night-soft border border-tinted/20 py-2.5 text-xs font-medium text-paper active:scale-95 transition-all"
              >
                {copiedId === `url-${activePhoto.id}` ? '✓ Copied URL' : 'Copy URL'}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(`md-${activePhoto.id}`, `![${activePhoto.alt}](${activePhoto.src})`)}
                className="flex items-center justify-center rounded-xl bg-night-soft border border-tinted/20 py-2.5 text-xs font-medium text-paper active:scale-95 transition-all"
              >
                {copiedId === `md-${activePhoto.id}` ? '✓ Copied MD' : 'Copy Markdown'}
              </button>
            </div>

            {orphanedSrcs.has(activePhoto.src) && (
              <button
                type="button"
                onClick={() => {
                  const target = activePhoto;
                  setActivePhoto(null);
                  requestDelete([target]);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-950/50 border border-red-800/40 py-2 text-xs font-semibold text-red-400"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Delete from bucket</span>
              </button>
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
              Media & Asset Resources
            </h2>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover active:scale-95"
          >
            <UploadIcon className="h-4 w-4" />
            <span>+ Add Media Asset</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'profile', 'atmosphere', 'post', 'book'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTag(t);
                  setShowOrphanedOnly(false);
                }}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTag === t
                    ? 'bg-accent text-paper shadow-xs'
                    : 'bg-night-soft text-gray-mid border border-tinted/20 hover:text-paper'
                }`}
              >
                {t}
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
            return (
              <div
                key={media.id}
                className={`group flex flex-col overflow-hidden rounded-2xl border bg-post-card shadow-sm transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-400'
                    : 'border-tinted/20 hover:border-accent/40'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative">
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-night">
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
                        alt={media.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    )}

                    {isOrphaned && (
                      <button
                        type="button"
                        onClick={() => toggleOrphanedSelection(media.id)}
                        aria-label={
                          isSelected
                            ? `Deselect ${media.name}`
                            : `Select ${media.name}`
                        }
                        aria-pressed={isSelected}
                        className={`absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full ring-1 transition-colors ${
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

                    <span className="absolute bottom-2 right-2 rounded bg-night/80 border border-tinted/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-paper uppercase backdrop-blur-xs">
                      {media.tag}
                    </span>
                  </div>

                  {/* Three-dot overflow menu */}
                  <div className="absolute top-2 right-2 z-40">
                    <button
                      type="button"
                      onClick={() =>
                        setMenuOpenId(menuOpenId === media.id ? null : media.id)
                      }
                      aria-label={`More actions for ${media.name}`}
                      aria-expanded={menuOpenId === media.id}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-night/80 border border-tinted/20 text-paper/90 backdrop-blur-xs hover:bg-night hover:text-paper transition-colors"
                    >
                      <span className="text-sm leading-none">···</span>
                    </button>
                    {menuOpenId === media.id && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-30 cursor-default"
                          aria-label="Close menu"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-9 z-40 w-40 rounded-lg border border-tinted/20 bg-night-soft p-1 shadow-xl animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null);
                              requestDeleteItem(media);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete image
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h4 className="truncate font-mono text-xs font-semibold text-paper">
                      {media.name}
                    </h4>
                    <p className="mt-1 truncate text-xs text-gray-mid">
                      {media.alt}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-mid/80">
                      <span>{media.dimensions || 'Image'}</span>
                      <span>{media.size}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-tinted/20">
                    {isOrphaned && (
                      <button
                        type="button"
                        onClick={() => requestDelete([media])}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-red-950/40 py-1.5 text-[11px] font-semibold text-red-400 border border-red-800/40 transition-colors hover:bg-red-900/60"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete from bucket
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(`url-${media.id}`, media.src)}
                        className="rounded-lg bg-night-soft border border-tinted/20 py-1.5 text-[11px] font-medium text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
                      >
                        {copiedId === `url-${media.id}` ? '✓ Copied' : 'Copy URL'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(`md-${media.id}`, markdownSnippet)}
                        className="rounded-lg bg-night-soft border border-tinted/20 py-1.5 text-[11px] font-medium text-gray-mid transition-colors hover:bg-post-card hover:text-paper"
                      >
                        {copiedId === `md-${media.id}` ? '✓ Copied' : 'Copy MD'}
                      </button>
                    </div>
                  </div>
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

      {/* Add Media Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative my-8 w-full max-w-lg rounded-3xl border border-tinted/20 bg-night p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted/20 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-paper">
                  Upload Media Asset
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
                  placeholder="e.g. project-diagram.jpeg"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                  Alt Text
                </label>
                <input
                  type="text"
                  placeholder="Accessible description of the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                  Category
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as MediaItem['tag'])}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper focus:border-tinted/40 focus:outline-none"
                >
                  <option value="atmosphere" className="bg-night text-paper">Atmosphere</option>
                  <option value="profile" className="bg-night text-paper">Profile</option>
                  <option value="post" className="bg-night text-paper">Post Asset</option>
                  <option value="book" className="bg-night text-paper">Book Cover</option>
                </select>
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
                  {isPending ? 'Uploading...' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
