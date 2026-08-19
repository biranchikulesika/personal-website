'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/lib/types';

interface MediaInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onSelect: (markdown: string) => void;
}

export function MediaInsertModal({
  isOpen,
  onClose,
  mediaItems,
  onSelect,
}: MediaInsertModalProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = mediaItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.alt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="relative my-8 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-tinted bg-paper shadow-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tinted px-6 py-4">
          <div>
            <h3 className="font-serif text-xl font-normal text-ink">
              Insert Media Asset
            </h3>
            <p className="mt-0.5 text-xs text-ink-soft">
              Select an image from your resources library to insert markdown image markup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-cream hover:text-ink"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-tinted bg-cream/50 px-6 py-3">
          <input
            type="text"
            placeholder="Search assets by name or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-full border border-tinted bg-paper px-4 py-1.5 text-xs text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
          />
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(`![${item.alt || item.name}](${item.src})`);
                  onClose();
                }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-tinted bg-cream text-left shadow-2xs transition-all hover:border-ink hover:shadow-md focus:outline-none"
              >
                <div className="relative h-32 w-full bg-paper overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <div className="truncate text-xs font-medium text-ink group-hover:text-accent">
                    {item.name}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-ink-soft">
                    <span>{item.size}</span>
                    <span className="font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      Insert ↵
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-ink-soft">
              No media resources found matching &quot;{search}&quot;.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-tinted px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
