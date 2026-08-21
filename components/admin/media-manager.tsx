'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';
import {
  addMediaAction,
  deleteOrphanedMediaAction,
} from '@/app/admin/actions';
import { TrashIcon } from '@/components/icons';
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
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const { message: toastMessage, showToast } = useToast(3000);

  const orphanedSrcs = new Set(orphanedList.map((m) => m.src));

  // New Media Form State
  const [fileName, setFileName] = useState('');
  const [fileSrc, setFileSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [tag, setTag] = useState<MediaItem['tag']>('atmosphere');
  const [fileSize, setFileSize] = useState('250 KB');
  const [dimensions, setDimensions] = useState('1200 × 800');



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
      name: fileName,
      src: fileSrc.startsWith('/') ? fileSrc : `/${fileSrc}`,
      alt: altText || fileName,
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
        showToast(`Asset "${fileName}" added to library!`);
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
    const srcs = confirmDelete.items.map((m) => m.src);
    startTransition(async () => {
      const res = await deleteOrphanedMediaAction(srcs);
      if (res.success) {
        const removed = new Set(srcs);
        setOrphanedList((prev) => prev.filter((m) => !removed.has(m.src)));
        setSelectedOrphanedIds(new Set());
        setConfirmDelete(null);
        setConfirmTypedText('');
        showToast(
          `Deleted ${srcs.length} orphaned asset${srcs.length > 1 ? 's' : ''}`,
        );
      } else {
        showToast(res.error || 'Failed to delete assets');
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
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastView message={toastMessage} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
            Media & Asset Resources
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsUploading(true)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
        >
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

                <span className="absolute top-2 right-2 rounded bg-night/80 border border-tinted/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-paper uppercase backdrop-blur-xs">
                  {media.tag}
                </span>
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
              <NoMediaState onUpload={() => setIsUploading(true)} />
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
              Delete orphaned asset{confirmDelete.items.length > 1 ? 's' : ''}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-mid">
              {confirmDelete.items.length === 1 ? (
                <>
                  Are you sure you want to delete{' '}
                  <b className="text-paper">{confirmDelete.items[0].name}</b> from
                  the storage bucket? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete{' '}
                  <b className="text-paper">
                    {confirmDelete.items.length} assets
                  </b>{' '}
                  from the storage bucket? This action cannot be undone.
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
                  Register Media Asset
                </h3>
                <p className="mt-0.5 text-xs text-gray-mid">
                  Add an image reference to the asset library.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploading(false)}
                className="rounded-full p-2 text-gray-mid hover:bg-night-soft hover:text-paper"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                  Filename
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
                  Source Path or URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="/biranchi.jpeg or https://..."
                  value={fileSrc}
                  onChange={(e) => setFileSrc(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 font-mono text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                  Alt Text Description
                </label>
                <input
                  type="text"
                  placeholder="Accessible description of the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    Category Tag
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as MediaItem['tag'])}
                    className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper focus:border-tinted/40 focus:outline-none"
                  >
                    <option value="profile" className="bg-night text-paper">Profile</option>
                    <option value="atmosphere" className="bg-night text-paper">Atmosphere</option>
                    <option value="post" className="bg-night text-paper">Post Asset</option>
                    <option value="book" className="bg-night text-paper">Book Cover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-mid">
                    File Size Estimate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 240 KB"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2 text-sm text-paper placeholder:text-gray-mid/50 focus:border-tinted/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted/20">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-gray-mid hover:text-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-accent px-6 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
