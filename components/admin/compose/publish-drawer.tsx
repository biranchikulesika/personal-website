'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { MediaItem, Persona } from '@/lib/types';
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
  docType: 'post' | 'note';
}

export function PublishDrawer({
  isOpen,
  onClose,
  title,
  slug,
  onSlugChange,
  description,
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
}: PublishDrawerProps) {
  const [tagInput, setTagInput] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'google' | 'og'>('google');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync input from parent tags on open
  const prevIsOpen = useRef(isOpen);
  if (isOpen && !prevIsOpen.current) {
    setTagInput(tags.join(', '));
  }
  prevIsOpen.current = isOpen;

  if (!isOpen) return null;

  const isPost = docType === 'post';
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
    const objectUrl = URL.createObjectURL(file);
    onCoverImageChange(objectUrl);
  }

  const liveUrlPrefix = isPost ? '/p/' : '/n/';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="relative w-full max-w-xl bg-[#111111] border-l border-[#222] text-neutral-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#202020] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Publish</h3>
            <span className="text-[10px] font-mono text-neutral-500">
              {isPost ? 'essay' : 'note'} • {wordCount}w • {readingTime}m
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={persona}
                onChange={(e) => onPersonaChange(e.target.value as Persona)}
                className="appearance-none rounded-md border border-[#262626] bg-[#161616] px-2.5 py-1 text-[10px] font-medium capitalize text-neutral-300 focus:border-[#ff7700] focus:outline-none cursor-pointer pr-5"
              >
                <option value="builder" className="bg-[#1a1a1a]">Builder</option>
                <option value="operator" className="bg-[#1a1a1a]">Operator</option>
                <option value="thinker" className="bg-[#1a1a1a]">Thinker</option>
                <option value="wanderer" className="bg-[#1a1a1a]">Wanderer</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-neutral-600 text-[8px]">
                ▼
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-neutral-500 hover:bg-[#222] hover:text-white transition-colors text-xs"
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
                <span className="text-[11px] font-medium text-neutral-400">Cover</span>
                {hasCoverImage && (
                  <button
                    type="button"
                    onClick={() => onCoverImageChange('')}
                    className="text-[10px] text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {hasCoverImage ? (
                <div className="group relative h-44 w-full overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#181818]">
                  <Image
                    src={coverImage!}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    unoptimized={coverImage!.startsWith('blob:') || coverImage!.startsWith('http')}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="rounded-md bg-white/90 hover:bg-white text-black px-3 py-1 text-[11px] font-semibold shadow-xs"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => onCoverImageChange('')}
                      className="rounded-md bg-red-600/90 hover:bg-red-600 text-white px-3 py-1 text-[11px] font-semibold shadow-xs"
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
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#2a2a2a] bg-[#141414] py-6 hover:border-[#444] transition-colors"
                  >
                    <span className="text-lg opacity-50">📤</span>
                    <span className="text-[11px] text-neutral-400">Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#2a2a2a] bg-[#141414] py-6 hover:border-[#ff7700]/40 transition-colors"
                  >
                    <span className="text-lg opacity-50">📁</span>
                    <span className="text-[11px] text-[#ff7700]">Media Library</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* URL Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-neutral-400">Permalink</span>
              <span className="text-[10px] font-mono text-neutral-600 truncate max-w-[60%]">
                {liveUrlPrefix}{slug || '…'}
              </span>
            </div>
            <div className="flex items-center rounded-lg border border-[#262626] bg-[#161616] px-3 py-2 text-xs font-mono focus-within:border-[#ff7700]">
              <span className="text-neutral-500 select-none shrink-0">{liveUrlPrefix}</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                className="w-full bg-transparent focus:outline-none ml-1 text-neutral-100"
                placeholder="slug-name"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-neutral-400">Tags</span>
            <input
              type="text"
              placeholder="craft, software, tools…"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                syncTagsFromInput(e.target.value);
              }}
              className="w-full rounded-lg border border-[#262626] bg-[#161616] px-2.5 py-1.5 text-[11px] text-white focus:border-[#ff7700] focus:outline-none"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-0.5 rounded bg-[#1c1c1c] border border-[#2a2a2a] px-1.5 py-0.5 text-[10px] text-neutral-400"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-neutral-600 hover:text-red-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Previews + Footer */}
        <div className="border-t border-[#202020] bg-[#111111] shrink-0">
          {/* Preview Tabs */}
          <div className="px-5 pt-3 space-y-2">
            <div className="flex items-center gap-0 border-b border-[#222]">
              <button
                type="button"
                onClick={() => setPreviewTab('google')}
                className={`px-3 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${
                  previewTab === 'google'
                    ? 'border-[#ff7700] text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('og')}
                className={`px-3 py-1.5 text-[10px] font-medium transition-colors border-b-2 -mb-px ${
                  previewTab === 'og'
                    ? 'border-[#ff7700] text-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Social / OG
              </button>
            </div>

            {previewTab === 'google' ? (
              <div className="rounded bg-white px-0 py-0">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 px-4 pt-3 pb-0.5">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[9px] font-bold text-[#5f6368]">
                    B
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[12px] leading-tight text-[#202124]">
                      biranchi.xyz
                    </span>
                    <span className="text-[12px] leading-tight text-[#5f6368]">
                      {liveUrlPrefix}{slug || 'slug-name'}
                    </span>
                  </div>
                </div>
                {/* Title */}
                <h3 className="px-4 pt-0.5 pb-1 text-[20px] leading-[1.3] text-[#1a0dab] decoration-none line-clamp-1">
                  {title || 'Page Title — biranchi.xyz'}
                </h3>
                {/* Description */}
                <p className="px-4 pb-3 text-[14px] leading-[1.58] text-[#4d5156] line-clamp-2">
                  {description || 'No description set for this page. Google will auto-generate a snippet from your page content.'}
                </p>
              </div>
            ) : (
              /* Facebook / Open Graph share card — pixel-accurate */
              <div className="rounded-lg border border-[#dadde1] bg-white overflow-hidden">
                {/* OG Image — 1.91:1 ratio (1200×630) */}
                <div className="relative w-full bg-[#f0f2f5]" style={{ aspectRatio: '1200 / 630' }}>
                  {hasCoverImage ? (
                    <Image
                      src={coverImage!}
                      alt="OG preview"
                      fill
                      className="object-cover"
                      unoptimized={coverImage!.startsWith('blob:') || coverImage!.startsWith('http')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-[13px] text-[#8c93a1]">No image</span>
                    </div>
                  )}
                </div>
                {/* Text */}
                <div className="px-3.5 py-2.5">
                  <p className="text-[12px] uppercase tracking-[0.2px] text-[#65676b] leading-tight">
                    biranchi.xyz
                  </p>
                  <p className="mt-0.5 text-[16px] font-bold text-[#000000] leading-[1.3] line-clamp-2">
                    {title || 'Page Title'}
                  </p>
                  <p className="mt-0.5 text-[14px] text-[#65676b] leading-[1.33] line-clamp-2">
                    {description || 'No description set for this page.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave('unpublished')}
              className="rounded-lg border border-[#333] bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 px-4 py-2 text-[11px] font-medium transition-colors"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave('published')}
              className="flex-1 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all bg-[#ff7700] hover:bg-[#e66a00] text-black disabled:bg-[#252525] disabled:text-neutral-600 disabled:cursor-not-allowed"
            >
              {isSaving
                ? 'Saving…'
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
