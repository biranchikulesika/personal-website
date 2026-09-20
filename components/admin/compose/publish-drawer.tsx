'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { MediaItem, Persona } from '@/lib/types';
import { SITE_DOMAIN } from '@/lib/constants';
import { addMediaAction } from '@/app/admin/actions';
import { MediaInsertModal } from '../mdx-editor/media-insert-modal';

interface PublishDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  slug: string;
  onSlugChange: (newSlug: string) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  persona: Persona;
  onPersonaChange: (p: Persona) => void;
  status: 'published' | 'unpublished';
  onStatusChange: (s: 'published' | 'unpublished') => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  coverImage?: string;
  onCoverImageChange: (url: string) => void;
  content: string;
  wordCount: number;
  readingTime: number;
  mediaItems?: MediaItem[];
  onSave: (statusToSet: 'published' | 'unpublished') => Promise<void>;
  isSaving: boolean;
  docType: 'post' | 'note' | 'now';
  location?: string;
  onLocationChange?: (location: string) => void;
  hasUnpublishedChanges?: boolean;
  onDiscard?: () => void;
}

export function PublishDrawer({
  isOpen,
  onClose,
  title,
  slug,
  onSlugChange,
  description,
  onDescriptionChange,
  persona,
  onPersonaChange,
  tags,
  onTagsChange,
  coverImage,
  onCoverImageChange,
  wordCount,
  readingTime,
  mediaItems = [],
  onSave,
  isSaving,
  docType,
  status,
  location,
  onLocationChange,
  hasUnpublishedChanges = false,
  onDiscard,
}: PublishDrawerProps) {
  const [tagInput, setTagInput] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'card' | 'og' | 'google'>('card');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync input from parent tags on open
  const prevIsOpen = useRef(isOpen);
  if (isOpen && !prevIsOpen.current) {
    setTagInput(tags.join(', '));
  }
  prevIsOpen.current = isOpen;

  if (!isOpen) return null;

  const isPost = docType === 'post';
  const isNow = docType === 'now';
  const hasCoverImage = Boolean(coverImage && coverImage.trim());

  function syncTagsFromInput(val: string) {
    const parsed = val
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    const unique = Array.from(new Set(parsed));
    onTagsChange(unique);
  }

  function handleRemoveTag(tagToRemove: string) {
    const remaining = tags.filter((t) => t !== tagToRemove);
    onTagsChange(remaining);
    setTagInput(remaining.join(', '));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const mediaItem: MediaItem = {
          id: `media-${Date.now()}`,
          name: file.name,
          src: dataUrl,
          alt: file.name.replace(/\.[^.]+$/, ''),
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          uploadedAt: new Date().toISOString(),
          tags: isPost ? ['post', 'cover'] : ['note', 'cover'],
        };
        const res = await addMediaAction(mediaItem);
        const imgUrl = res.success && res.media ? res.media.src : dataUrl;
        onCoverImageChange(imgUrl);
      } catch {
        onCoverImageChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const liveUrlPrefix = isPost ? '/p/' : '/n/';
  const typeLabel = docType === 'post' ? 'Essay' : 'Note';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="relative w-full max-w-xl bg-ink border-l border-tinted/20 text-paper/90 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-tinted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-paper">Publish</h3>
            <span className="text-[10px] font-mono text-ink-soft">
              {isNow ? 'now entry' : isPost ? 'essay' : 'note'} • {wordCount}w • {readingTime}m
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isNow && (
              <div className="relative">
                <select
                  value={persona}
                  onChange={(e) => onPersonaChange(e.target.value as Persona)}
                  className="appearance-none rounded-md border border-tinted/20 bg-night-soft px-2.5 py-1 text-[10px] font-medium capitalize text-paper/80 focus:border-tinted/40 focus:outline-none cursor-pointer pr-5"
                >
                  <option value="builder" className="bg-ink text-paper">Builder</option>
                  <option value="operator" className="bg-ink text-paper">Operator</option>
                  <option value="thinker" className="bg-ink text-paper">Thinker</option>
                  <option value="wanderer" className="bg-ink text-paper">Wanderer</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-ink-soft text-[8px]">
                  ▼
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-ink-soft hover:bg-tinted/10 hover:text-paper transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Cover Image */}
          {isPost && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-soft">Cover</span>
                {hasCoverImage && (
                  <button
                    type="button"
                    onClick={() => onCoverImageChange('')}
                    className="text-[10px] text-ink-soft hover:text-accent transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {hasCoverImage ? (
                <div className="group relative h-44 w-full overflow-hidden rounded-lg border border-tinted/20 bg-night-soft">
                  <Image
                    src={coverImage!}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    unoptimized={coverImage!.startsWith('blob:') || coverImage!.startsWith('http')}
                  />
                  <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="rounded-md bg-night-soft hover:bg-post-card text-paper border border-tinted/20 px-3 py-1 text-[11px] font-semibold shadow-xs"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => onCoverImageChange('')}
                      className="rounded-md bg-accent-hover hover:bg-accent text-paper px-3 py-1 text-[11px] font-semibold shadow-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              )}

              {!hasCoverImage && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-tinted/30 bg-night-soft py-6 hover:border-tinted/60 transition-colors"
                  >
                    <span className="text-lg opacity-50">📤</span>
                    <span className="text-[11px] text-ink-soft">Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-tinted/30 bg-night-soft py-6 hover:border-tinted/60 transition-colors"
                  >
                    <span className="text-lg opacity-50">📁</span>
                    <span className="text-[11px] text-accent">Media Library</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* URL Slug / Now Details */}
          {isNow ? (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-medium text-ink-soft">Location</span>
              <input
                type="text"
                value={location || ''}
                onChange={(e) => onLocationChange?.(e.target.value)}
                placeholder="e.g. Bhubaneswar, Odisha, India"
                maxLength={200}
                className="w-full rounded-lg border border-tinted/20 bg-night-soft px-3 py-2 text-xs text-paper focus:border-tinted/40 focus:outline-none"
              />
              <p className="text-[10px] text-ink-soft">
                Place shown near the posted date on the Now page.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-soft">Permalink</span>
                <span className="text-[10px] font-mono text-ink-soft/70 truncate max-w-[60%]">
                  {liveUrlPrefix}{slug || '…'}
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-tinted/20 bg-night-soft px-3 py-2 text-xs font-mono focus-within:border-tinted/40">
                <span className="text-ink-soft select-none shrink-0">{liveUrlPrefix}</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  className="w-full bg-transparent focus:outline-none ml-1 text-paper"
                  placeholder="slug-name"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {!isNow && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-ink-soft">Tags</span>
              <input
                type="text"
                placeholder="craft, software, tools…"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  syncTagsFromInput(e.target.value);
                }}
                className="w-full rounded-lg border border-tinted/20 bg-night-soft px-2.5 py-1.5 text-[11px] text-paper focus:border-tinted/40 focus:outline-none"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-0.5 rounded bg-night-soft border border-tinted/20 px-1.5 py-0.5 text-[10px] text-ink-soft"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-ink-soft/60 hover:text-accent ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previews + Footer */}
        <div className="border-t border-tinted/20 bg-ink shrink-0">
          {/* Preview Tabs */}
          {!isNow && (
            <div className="px-5 pt-3 space-y-2">
              <div className="flex items-center gap-0 border-b border-tinted/20">
                <button
                  type="button"
                  onClick={() => setPreviewTab('card')}
                  className={`px-3 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${previewTab === 'card' ? 'border-accent text-paper' : 'border-transparent text-ink-soft hover:text-paper'}`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('og')}
                  className={`px-3 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${previewTab === 'og' ? 'border-accent text-paper' : 'border-transparent text-ink-soft hover:text-paper'}`}
                >
                  Social
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('google')}
                  className={`px-3 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${previewTab === 'google' ? 'border-accent text-paper' : 'border-transparent text-ink-soft hover:text-paper'}`}
                >
                  Google
                </button>
              </div>

              {/* Card Preview */}
              {previewTab === 'card' && (
                <div className="rounded-xl border border-tinted/20 bg-post-card overflow-hidden">
                  {hasCoverImage ? (
                    <div className="relative min-h-35 overflow-hidden">
                      <Image
                        src={coverImage || ''}
                        alt="Card cover preview"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-35 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(250,249,245,0.08)_15%,transparent_75%)]">
                      <span className="font-serif text-4xl italic text-paper/40">
                        {(title || 'P').charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="px-4 pt-3 pb-4">
                    <h3 className="font-serif text-[15px] font-normal leading-snug text-paper line-clamp-2">
                      {title || 'Page Title'}
                    </h3>
                    {description && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft line-clamp-2">
                        {description}
                      </p>
                    )}
                    <div className="mt-3 text-[10px] text-ink-soft">
                      <span>{typeLabel}{persona ? ` · ${persona}` : ''}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Social / OG Preview */}
              {previewTab === 'og' && (
                <div className="rounded-lg border border-tinted/20 bg-[#141413] overflow-hidden" style={{ aspectRatio: '1200 / 630' }}>
                  <div className="flex h-full w-full flex-row relative">
                    <div className="flex flex-col" style={{ flex: hasCoverImage ? '0 0 60%' : '1 1 100%' }}>
                      {(docType === 'post' || docType === 'note') && (
                        <div className="flex items-center gap-1.5 px-5 pt-4 text-[9px] font-sans uppercase tracking-[0.15em] font-semibold text-[#D97757]">
                          <span>{typeLabel}</span>
                          {persona && (
                            <>
                              <span className="text-[#4a4a45]">✦</span>
                              <span className="capitalize">{persona}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col justify-center px-5">
                        <h3 className="font-serif text-[28px] font-normal leading-[1.05] tracking-tight text-[#FAF9F5] line-clamp-3">
                          {title || 'Page Title'}
                        </h3>
                        {description && (
                          <p className="mt-2 font-sans text-[11px] leading-[1.4] text-[#B0AEA5] line-clamp-2">
                            {description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center px-5 pb-4">
                        <span className="font-sans text-[10px] font-semibold text-[#FAF9F5]">
                          {SITE_DOMAIN}
                        </span>
                      </div>
                    </div>
                    {hasCoverImage && (
                      <div className="relative flex flex-1 items-center justify-center p-2">
                        <Image
                          src={coverImage || ''}
                          alt="OG artwork preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Google SRP Preview */}
              {previewTab === 'google' && (
                <div className="rounded bg-night-soft border border-tinted/20">
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-0.5">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-paper">
                      B
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[12px] leading-tight text-paper">
                        {SITE_DOMAIN}
                      </span>
                      <span className="text-[12px] leading-tight text-gray-mid">
                        {liveUrlPrefix}{slug || 'slug-name'}
                      </span>
                    </div>
                  </div>
                  <h3 className="px-4 pt-0.5 pb-1 text-[20px] leading-[1.3] text-accent line-clamp-1">
                    {title || `Page Title · ${SITE_DOMAIN}`}
                  </h3>
                  <p className="px-4 pb-3 text-[14px] leading-[1.58] text-gray-mid line-clamp-2">
                    {description || 'No description set for this page. Google will auto-generate a snippet from your page content.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-5 py-3 flex items-center gap-2">
            {hasUnpublishedChanges && onDiscard && (
              <button
                type="button"
                disabled={isSaving}
                onClick={onDiscard}
                className="rounded-lg border border-rose-800/40 bg-rose-950/30 text-rose-300 hover:bg-rose-950/60 px-3.5 py-2 text-[11px] font-medium transition-colors shrink-0"
                title="Discard unpublished changes"
              >
                Discard Edits
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave('unpublished')}
              className="rounded-lg border border-tinted/20 bg-night-soft hover:bg-tinted/10 text-paper/80 px-4 py-2 text-[11px] font-medium transition-colors"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave('published')}
              className="flex-1 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all bg-accent hover:bg-accent-hover text-paper disabled:bg-night-soft disabled:text-ink-soft disabled:cursor-not-allowed"
            >
              {isSaving
                ? 'Saving…'
                : isNow
                ? 'Add to Timeline'
                : status === 'published'
                ? 'Update'
                : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaInsertModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems}
        onSelect={(imgMd) => {
          const match = imgMd.match(/!\[.*?\]\((.*?)\)/);
          if (match && match[1]) {
            onCoverImageChange(match[1]);
          }
          setIsMediaModalOpen(false);
        }}
      />
    </div>
  );
}
