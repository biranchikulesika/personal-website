'use client';

import { useState } from 'react';
import type { BlogPost, BookItem } from '@/lib/types';
import { setFeaturedPostsAction, setFeaturedBooksAction } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { ToastView } from '@/components/ui/toast-view';
import { NoContentState } from '@/components/ui/states';

interface FeaturedManagerProps {
  posts: BlogPost[];
  books: BookItem[];
  initialFeaturedPostSlugs: string[];
  initialFeaturedBookSlugs: string[];
}

export function FeaturedManager({
  posts,
  books,
  initialFeaturedPostSlugs,
  initialFeaturedBookSlugs,
}: FeaturedManagerProps) {
  const [selectedPosts, setSelectedPosts] = useState<string[]>(initialFeaturedPostSlugs);
  const [selectedBooks, setSelectedBooks] = useState<string[]>(initialFeaturedBookSlugs);
  const [savingPosts, setSavingPosts] = useState(false);
  const [savingBooks, setSavingBooks] = useState(false);
  const { message: toastMessage, showToast } = useToast();

  function togglePost(slug: string) {
    setSelectedPosts((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, slug];
    });
  }

  function toggleBook(slug: string) {
    setSelectedBooks((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, slug];
    });
  }

  async function savePosts() {
    setSavingPosts(true);
    const result = await setFeaturedPostsAction(selectedPosts);
    setSavingPosts(false);
    if (result.success) {
      showToast('Featured posts updated');
    } else {
      showToast(result.error || 'Failed to save');
    }
  }

  async function saveBooks() {
    setSavingBooks(true);
    const result = await setFeaturedBooksAction(selectedBooks);
    setSavingBooks(false);
    if (result.success) {
      showToast('Featured books updated');
    } else {
      showToast(result.error || 'Failed to save');
    }
  }

  return (
    <div className="space-y-8">
      <ToastView message={toastMessage} />

      <div>
        <h2 className="font-serif text-2xl font-normal text-paper md:text-3xl">
          Featured Items
        </h2>
        <p className="mt-2 text-sm text-gray-mid">
          Select up to 4 posts and 4 books to feature on the homepage.
        </p>
      </div>

      {/* Featured Posts */}
      <section>
        <div className="flex items-center justify-between border-b border-tinted/20 pb-3">
          <h3 className="font-serif text-base font-normal text-paper">
            Featured Posts
            <span className="ml-2 text-xs text-gray-mid">({selectedPosts.length}/4)</span>
          </h3>
          <button
            type="button"
            onClick={savePosts}
            disabled={savingPosts}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {savingPosts ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {posts.length === 0 && (
            <NoContentState
              compact
              title="No posts yet"
              description="Create posts in the Content tab to feature them."
            />
          )}
          {posts.map((post) => {
            const isSelected = selectedPosts.includes(post.slug);
            const position = isSelected ? selectedPosts.indexOf(post.slug) + 1 : null;
            return (
              <button
                key={post.slug}
                type="button"
                onClick={() => togglePost(post.slug)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-tinted/20 bg-post-card hover:border-tinted/40'
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isSelected
                    ? 'border-accent bg-accent text-paper'
                    : 'border-tinted/30 text-gray-mid'
                }`}>
                  {position ?? ''}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-paper">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-mid">
                    {post.publishedAt || 'Unpublished'}
                    {post.persona && <span className="ml-2 capitalize">· {post.persona}</span>}
                  </p>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-[10px] font-semibold text-accent">
                    #{position}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Books */}
      <section>
        <div className="flex items-center justify-between border-b border-tinted/20 pb-3">
          <h3 className="font-serif text-base font-normal text-paper">
            Featured Books
            <span className="ml-2 text-xs text-gray-mid">({selectedBooks.length}/4)</span>
          </h3>
          <button
            type="button"
            onClick={saveBooks}
            disabled={savingBooks}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {savingBooks ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {books.length === 0 && (
            <NoContentState
              compact
              title="No books yet"
              description="Add books in the Content tab to feature them."
            />
          )}
          {books.map((book) => {
            const isSelected = selectedBooks.includes(book.slug);
            const position = isSelected ? selectedBooks.indexOf(book.slug) + 1 : null;
            return (
              <button
                key={book.slug}
                type="button"
                onClick={() => toggleBook(book.slug)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-tinted/20 bg-post-card hover:border-tinted/40'
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isSelected
                    ? 'border-accent bg-accent text-paper'
                    : 'border-tinted/30 text-gray-mid'
                }`}>
                  {position ?? ''}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-paper">
                    {book.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-mid">
                    by {book.author}
                  </p>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-[10px] font-semibold text-accent">
                    #{position}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
