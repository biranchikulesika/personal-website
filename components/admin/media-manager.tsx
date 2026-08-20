'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';
import {
  addMediaAction,
  deleteOrphanedMediaAction,
} from '@/app/admin/actions';
import { TrashIcon } from '@/components/icons';

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const orphanedSrcs = new Set(orphanedList.map((m) => m.src));

  // New Media Form State
  const [fileName, setFileName] = useState('');
  const [fileSrc, setFileSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [tag, setTag] = useState<MediaItem['tag']>('atmosphere');
  const [fileSize, setFileSize] = useState('250 KB');
  const [dimensions, setDimensions] = useState('1200 × 800');

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-cream shadow-xl ring-1 ring-tinted animate-in fade-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-normal text-ink md:text-3xl">
            Media & Asset Resources
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsUploading(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition-colors hover:bg-accent"
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
                  ? 'bg-ink text-cream shadow-xs'
                  : 'bg-paper text-ink-soft ring-1 ring-tinted hover:text-ink'
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
                  ? 'bg-amber-600 text-cream shadow-xs'
                  : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100'
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
          className="w-full max-w-xs rounded-full border border-tinted bg-cream px-4 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
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
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-cream shadow-sm transition-all hover:shadow-md ${
                isSelected
                  ? 'border-amber-500 ring-1 ring-amber-400'
                  : 'border-tinted hover:border-ink/30'
              }`}
            >
              {/* Thumbnail Preview */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-paper">
                {isOrphaned ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-amber-50">
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
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
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
                        ? 'bg-amber-600 text-cream ring-amber-600'
                        : 'bg-cream text-transparent ring-tinted hover:ring-amber-500'
                    }`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </button>
                )}

                <span className="absolute top-2 right-2 rounded bg-ink/80 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cream uppercase backdrop-blur-xs">
                  {media.tag}
                </span>
              </div>

              {/* Metadata & Actions */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h4 className="truncate font-mono text-xs font-semibold text-ink">
                    {media.name}
                  </h4>
                  <p className="mt-1 truncate text-xs text-ink-soft">
                    {media.alt}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft/80">
                    <span>{media.dimensions || 'Image'}</span>
                    <span>{media.size}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-tinted">
                  {isOrphaned && (
                    <button
                      type="button"
                      onClick={() => requestDelete([media])}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 py-1.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete from bucket
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(`url-${media.id}`, media.src)}
                      className="rounded-lg bg-paper py-1.5 text-[11px] font-medium text-ink-soft ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
                    >
                      {copiedId === `url-${media.id}` ? '✓ Copied' : 'Copy URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(`md-${media.id}`, markdownSnippet)}
                      className="rounded-lg bg-paper py-1.5 text-[11px] font-medium text-ink-soft ring-1 ring-tinted transition-colors hover:bg-ink hover:text-cream"
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
          <div className="col-span-full py-16 text-center text-sm text-ink-soft">
            {showOrphanedOnly
              ? 'No orphaned assets. Everything in the bucket is registered or referenced somewhere.'
              : 'No media assets match your query.'}
          </div>
        )}
      </div>

      {/* Bulk action bar for selected orphaned assets */}
      {showOrphanedOnly && selectedOrphanedIds.size > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-tinted bg-ink px-5 py-2.5 shadow-xl">
          <span className="text-xs font-semibold text-cream">
            {selectedOrphanedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrphanedIds(new Set())}
              className="rounded-full px-3 py-1 text-xs font-semibold text-cream/70 hover:text-cream"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-tinted bg-paper p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-serif text-xl font-normal text-ink">
              Delete orphaned asset{confirmDelete.items.length > 1 ? 's' : ''}?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {confirmDelete.items.length === 1 ? (
                <>
                  Are you sure you want to delete{' '}
                  <b className="text-ink">{confirmDelete.items[0].name}</b> from
                  the storage bucket? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete{' '}
                  <b className="text-ink">
                    {confirmDelete.items.length} assets
                  </b>{' '}
                  from the storage bucket? This action cannot be undone.
                </>
              )}
              <span className="mt-3 block">
                Type <b className="text-ink">DELETE</b> to confirm:
              </span>
            </p>
            <input
              type="text"
              autoFocus
              placeholder="Type DELETE to confirm"
              value={confirmTypedText}
              onChange={(e) => setConfirmTypedText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmTypedText === 'DELETE') {
                  handleConfirmDelete();
                }
              }}
              className="mt-3 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-ink-soft hover:text-ink"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative my-8 w-full max-w-lg rounded-3xl border border-tinted bg-paper p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-tinted pb-4">
              <div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  Register Media Asset
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Add an image reference to the asset library.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploading(false)}
                className="rounded-full p-2 text-ink-soft hover:bg-cream hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Filename
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. project-diagram.jpeg"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Source Path or URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="/biranchi.jpeg or https://..."
                  value={fileSrc}
                  onChange={(e) => setFileSrc(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 font-mono text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Alt Text Description
                </label>
                <input
                  type="text"
                  placeholder="Accessible description of the image"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Category Tag
                  </label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as MediaItem['tag'])}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="profile">Profile</option>
                    <option value="atmosphere">Atmosphere</option>
                    <option value="post">Post Asset</option>
                    <option value="book">Book Cover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    File Size Estimate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 240 KB"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-tinted bg-cream px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-tinted">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="rounded-full px-5 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-ink px-6 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-accent disabled:opacity-50"
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
