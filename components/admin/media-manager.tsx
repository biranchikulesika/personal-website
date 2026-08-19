'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';
import { addMediaAction, deleteMediaAction } from '@/app/admin/actions';

interface MediaManagerProps {
  initialMedia: MediaItem[];
}

export function MediaManager({ initialMedia }: MediaManagerProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  function handleDeleteMedia(id: string) {
    startTransition(async () => {
      const res = await deleteMediaAction(id);
      if (res.success) {
        setMediaList((prev) => prev.filter((m) => m.id !== id));
        showToast('Media asset removed');
      } else {
        showToast(res.error || 'Failed to delete asset');
      }
    });
  }

  const filteredMedia = mediaList.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.alt.toLowerCase().includes(q) ||
      m.tag.toLowerCase().includes(q);
    const matchTag = activeTag === 'all' || m.tag === activeTag;
    return matchSearch && matchTag;
  });

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
          <p className="mt-1 text-sm text-ink-soft">
            Manage photos, portraits, book covers, and essay graphics ({mediaList.length} total).
          </p>
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
              onClick={() => setActiveTag(t)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTag === t
                  ? 'bg-ink text-cream shadow-xs'
                  : 'bg-paper text-ink-soft ring-1 ring-tinted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
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
        {filteredMedia.map((media) => {
          const markdownSnippet = `![${media.alt}](${media.src})`;
          return (
            <div
              key={media.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-tinted bg-cream shadow-sm transition-all hover:border-ink/30 hover:shadow-md"
            >
              {/* Thumbnail Preview */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-paper">
                <Image
                  src={media.src}
                  alt={media.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-2 left-2 rounded bg-ink/80 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cream uppercase backdrop-blur-xs">
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
                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(media.id)}
                    className="w-full rounded-lg py-1 text-center text-[11px] font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Delete Resource
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMedia.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-ink-soft">
            No media assets match your query.
          </div>
        )}
      </div>

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
