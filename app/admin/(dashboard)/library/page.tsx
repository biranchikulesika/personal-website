'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search, Filter, SlidersHorizontal, ArrowUpDown, Edit2, Trash2, Plus, ExternalLink,
  HelpCircle, Check, Play, BookOpen, AlertCircle, Layers, Sparkles, Brain, CheckCircle
} from 'lucide-react';
import { getPosts, deletePost } from '@/app/admin/actions/posts.actions';
import { getFieldNotes, deleteFieldNote, updateFieldNote } from '@/app/admin/actions/fieldNotes.actions';
import { getThoughtFragments, deleteThoughtFragment, updateThoughtFragment } from '@/app/admin/actions/thoughtFragments.actions';
import { getFragments, deleteFragment, updateFragment } from '@/app/admin/actions/fragments.actions';
import { getQuestions, deleteQuestion, updateQuestion } from '@/app/admin/actions/questions.actions';
import { getJournalMoments, deleteJournalMoment, updateJournalMoment } from '@/app/admin/actions/journalMoments.actions';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeletons';

interface UnifiedItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  contentType: 'Article' | 'Field Note' | 'Fragment' | 'Question' | 'Journal Entry';
  persona: 'Forge' | 'Signal' | 'Inside the Head' | 'Scribble';
  status: 'Draft' | 'Published' | 'Scheduled';
  updatedAt?: string;
  publishedAt?: string;
  createdAt: string;
  featured?: boolean;
  hidden?: boolean;
  rawItem: any;
}

export default function ContentLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Filters
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated'); // updated, published, created

  // Edit Modal State (for non-article items)
  const [editingItem, setEditingItem] = useState<UnifiedItem | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Load All content, join them into standard schema feed
  const loadLibrary = async (query: string = '') => {
    setLoading(true);
    try {
      const [
        postsRes, fieldNotes, thoughtFragments, fragments, questions, journalMoments
      ] = await Promise.all([
        getPosts(query),
        getFieldNotes(),
        getThoughtFragments(),
        getFragments(),
        getQuestions(),
        getJournalMoments()
      ]);

      const unified: UnifiedItem[] = [];

      const posts = postsRes.success ? postsRes.data : [];

      // 1. Articles (Posts)
      (posts || []).forEach(post => {
        let mappedPersona: 'Forge' | 'Signal' | 'Inside the Head' | 'Scribble' = 'Forge';
        if (post.persona === 'operator') mappedPersona = 'Signal';
        else if (post.persona === 'thinker') mappedPersona = 'Inside the Head';
        else if (post.persona === 'wanderer') mappedPersona = 'Scribble';

        let status: 'Draft' | 'Published' | 'Scheduled' = 'Published';
        if (post.status === 'draft') status = 'Draft';
        else if (post.publishedAt && new Date(post.publishedAt) > new Date()) status = 'Scheduled';

        unified.push({
          id: post.id || post.slug,
          title: post.title || 'Untitled Article',
          subtitle: post.subtitle || post.excerpt || '',
          content: post.content || '',
          contentType: 'Article',
          persona: mappedPersona,
          status,
          updatedAt: post.updatedAt || post.publishedAt || post.createdAt || new Date().toISOString(),
          publishedAt: post.publishedAt,
          createdAt: post.createdAt || new Date().toISOString(),
          featured: post.featured,
          hidden: post.hidden,
          rawItem: post
        });
      });

      // 2. Field Notes
      (fieldNotes || []).forEach(fn => {
        unified.push({
          id: fn.id,
          title: fn.title || 'Untitled Field Note',
          subtitle: fn.excerpt || '',
          content: fn.content || '',
          contentType: 'Field Note',
          persona: 'Forge', // Field notes map to Forge
          status: fn.draft ? 'Draft' : 'Published',
          updatedAt: fn.updatedAt || fn.publishedAt || fn.createdAt || new Date().toISOString(),
          publishedAt: fn.publishedAt,
          createdAt: fn.createdAt || new Date().toISOString(),
          featured: fn.featured,
          hidden: fn.hidden,
          rawItem: fn
        });
      });

      // 3. Thought Fragments
      (thoughtFragments || []).forEach(tf => {
        unified.push({
          id: tf.id,
          title: tf.title || tf.content?.substring(0, 50) || 'Thought Fragment',
          subtitle: '',
          content: tf.content || '',
          contentType: 'Fragment',
          persona: 'Inside the Head',
          status: 'Published',
          updatedAt: tf.updatedAt || tf.createdAt || new Date().toISOString(),
          createdAt: tf.createdAt || new Date().toISOString(),
          hidden: tf.hidden,
          rawItem: tf
        });
      });

      // 4. Fragments (General quotes or small phrases)
      (fragments || []).forEach(fr => {
        unified.push({
          id: fr.id,
          title: fr.title || fr.body?.substring(0, 50) || 'Brief Fragment',
          subtitle: '',
          content: fr.body || '',
          contentType: 'Fragment',
          persona: 'Inside the Head',
          status: 'Published',
          updatedAt: fr.updatedAt || fr.createdAt || new Date().toISOString(),
          createdAt: fr.createdAt || new Date().toISOString(),
          hidden: fr.hidden,
          rawItem: fr
        });
      });

      // 5. Questions
      (questions || []).forEach(q => {
        unified.push({
          id: q.id,
          title: q.text || q.question || 'Untitled Question',
          subtitle: q.context || '',
          content: q.text || q.question || '',
          contentType: 'Question',
          persona: 'Inside the Head',
          status: 'Published',
          updatedAt: q.createdAt || new Date().toISOString(),
          createdAt: q.createdAt || new Date().toISOString(),
          hidden: q.hidden,
          rawItem: q
        });
      });

      // 6. Journal Moments (Scribble)
      (journalMoments || []).forEach(jm => {
        unified.push({
          id: jm.id,
          title: jm.title || jm.body?.substring(0, 50) || 'Journal Moment',
          subtitle: jm.timeLabel || '',
          content: jm.body || '',
          contentType: 'Journal Entry',
          persona: 'Scribble',
          status: jm.hidden ? 'Draft' : 'Published', // Hidden state maps nicely
          updatedAt: jm.createdAt || new Date().toISOString(),
          createdAt: jm.createdAt || new Date().toISOString(),
          hidden: jm.hidden,
          rawItem: jm
        });
      });

      setItems(unified);
    } catch (error) {
      console.error('Error fetching Content Library records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary(searchParams?.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const currentQ = searchParams?.get('q') || '';
    if (debouncedSearchQuery !== currentQ) {
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
      else params.delete('q');

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }
  }, [debouncedSearchQuery, pathname, router, searchParams]);

  // Filter & Search Logic
  const filteredItems = items.filter(item => {
    // 1. Search Query Match (still done client-side for non-post types, and as fallback)
    const q = searchQuery.toLowerCase();
    const matchesSearch = q === '' ||
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.content.toLowerCase().includes(q) ||
      item.contentType.toLowerCase().includes(q);

    // 2. Persona Match
    const matchesPersona = selectedPersona === 'all' || item.persona === selectedPersona;

    // 3. Content Type Match
    const matchesType = selectedContentType === 'all' || item.contentType === selectedContentType;

    // 4. Status Match
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesPersona && matchesType && matchesStatus;
  }).sort((a, b) => {
    // Sort
    if (sortBy === 'published') {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    } else if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Default: Updated At
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    }
  });

  const handleEditItem = (item: UnifiedItem) => {
    if (item.contentType === 'Article') {
      // Route directly to standard Compose workflow containing post ID config
      router.push(`/admin/compose?id=${item.rawItem.id || item.rawItem.slug}`);
    } else {
      // Open quick modal inline editing workflow for secondary systems
      setEditingItem(item);
      setEditFormData({ ...item.rawItem });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    try {
      const type = editingItem.contentType;
      const id = editingItem.id;

      if (type === 'Field Note') {
        await updateFieldNote(id, editFormData);
      } else if (type === 'Fragment') {
        // Find if thought fragment or snippet
        if (editingItem.rawItem.body !== undefined) {
          await updateFragment(id, editFormData);
        } else {
          await updateThoughtFragment(id, editFormData);
        }
      } else if (type === 'Question') {
        await updateQuestion(id, editFormData);
      } else if (type === 'Journal Entry') {
        await updateJournalMoment(id, editFormData);
      }

      setEditingItem(null);
      await loadLibrary();
    } catch (e) {
      console.error('Error saving edited libraries: ', e);
      alert('Save Error. Please verify fields.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async (item: UnifiedItem) => {
    const isConfirm = window.confirm(`Permanently remove this ${item.contentType}?`);
    if (!isConfirm) return;

    try {
      const type = item.contentType;
      if (type === 'Article') {
        const res = await deletePost(item.rawItem.id || item.rawItem.slug);
          if (!res.success) throw new Error("error" in res ? res.error : "Error");
      } else if (type === 'Field Note') {
        await deleteFieldNote(item.id);
      } else if (type === 'Fragment') {
        if (item.rawItem.body !== undefined) {
          await deleteFragment(item.id);
        } else {
          await deleteThoughtFragment(item.id);
        }
      } else if (type === 'Question') {
        await deleteQuestion(item.id);
      } else if (type === 'Journal Entry') {
        await deleteJournalMoment(item.id);
      }

      await loadLibrary();
    } catch (e) {
      console.error('Error deleting library entry: ', e);
      alert('Error deleting post.');
    }
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12 text-neutral-300">

      {/* Header and Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-[0.25em] text-[#ff7700] uppercase font-mono font-bold">Studio Archive</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2 font-sans">Content Library</h1>
        </div>

        <Link
          href="/admin/compose?new=true"
          className="bg-neutral-100 text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 w-fit select-none font-sans"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Link>
      </div>

      {/* Control Bar (Search & Filter Matrices) */}
      <div className="bg-[#111111] border border-[#1a1a1a] p-5 rounded-lg mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search content by title, subtitle, or raw snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-[#222] rounded-md pl-10 pr-4 py-2.5 text-sm outline-none focus:border-neutral-500 text-neutral-200 transition-colors"
            />
          </div>

          {/* Filtering Matrix Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto">

            {/* Persona filter */}
            <div className="flex flex-col gap-1.5 min-w-32.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Persona</label>
              <select
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value)}
                className="bg-[#161616] border border-[#222] hover:border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-300 outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Personas</option>
                <option value="Forge">Forge</option>
                <option value="Signal">Signal</option>
                <option value="Inside the Head">Inside the Head</option>
                <option value="Scribble">Scribble</option>
              </select>
            </div>

            {/* Content Type filter */}
            <div className="flex flex-col gap-1.5 min-w-32.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Type</label>
              <select
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                className="bg-[#161616] border border-[#222] hover:border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-300 outline-none cursor-pointer transition-colors"
              >
                <option value="all">All Types</option>
                <option value="Article">Article (Post)</option>
                <option value="Field Note">Field Note</option>
                <option value="Fragment">Fragment</option>
                <option value="Question">Question</option>
                <option value="Journal Entry">Journal Entry</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5 min-w-25">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#161616] border border-[#222] hover:border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-300 outline-none cursor-pointer transition-colors"
              >
                <option value="all">Any Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex flex-col gap-1.5 min-w-31.25">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-semibold mb-0.5">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#161616] border border-[#222] hover:border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-300 outline-none cursor-pointer transition-colors"
              >
                <option value="updated">Recently Updated</option>
                <option value="published">Publish Date</option>
                <option value="created">Created Date</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {loading ? (
        <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-225">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[40%]">Content Title</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Channel / Type</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Identity Context</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Release Timeline</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Perform Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="hover:bg-[#161616] group transition-all duration-150">
                    <td className="px-6 py-4.5 align-top">
                      <div className="flex flex-col gap-2 max-w-100">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </td>
                    <td className="px-6 py-4.5 align-top">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4.5 align-top">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </td>
                    <td className="px-6 py-4.5 align-top">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </td>
                    <td className="px-6 py-4.5 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-225">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[40%]">Content Title</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Channel / Type</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Identity Context</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Release Timeline</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Perform Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filteredItems.map((item, idx) => {
                  const safeId = item.id || `idx_${idx}`;

                  // Color codes for different personas
                  const colorMap = {
                    'Forge': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
                    'Signal': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                    'Inside the Head': 'text-purple-550 bg-purple-500/10 border-purple-550/20',
                    'Scribble': 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                  };

                  const typeIconMap = {
                    'Article': <BookOpen className="w-3.5 h-3.5" />,
                    'Field Note': <Layers className="w-3.5 h-3.5" />,
                    'Fragment': <Sparkles className="w-3.5 h-3.5" />,
                    'Question': <HelpCircle className="w-3.5 h-3.5" />,
                    'Journal Entry': <Brain className="w-3.5 h-3.5" />
                  };

                  return (
                    <tr key={safeId} className="hover:bg-[#161616] group transition-all duration-150">

                      {/* Name / Subtitle */}
                      <td className="px-6 py-4.5 align-top">
                        <div className="flex flex-col gap-1.5 max-w-100">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="font-medium text-neutral-200 text-sm text-left hover:text-white hover:underline transition-colors leading-snug line-clamp-2"
                          >
                            {item.title}
                          </button>
                          {item.subtitle && (
                            <p className="text-neutral-500 text-xs line-clamp-1 italic font-light">{item.subtitle}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {item.featured && (
                              <span className="text-[9px] border bg-[#ff7700]/5 border-[#ff7700]/20 text-[#ff7700] uppercase font-mono px-1.5 py-px rounded">
                                Featured
                              </span>
                            )}
                            {item.hidden && (
                              <span className="text-[9px] border bg-neutral-800 border-neutral-700 text-neutral-400 uppercase font-mono px-1.5 py-px rounded">
                                Hidden
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Content Type */}
                      <td className="px-6 py-4.5 align-top text-neutral-300">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-neutral-500">{typeIconMap[item.contentType] || <BookOpen className="w-3.5 h-3.5" />}</span>
                          <span className="font-medium">{item.contentType}</span>
                        </div>
                      </td>

                      {/* Persona */}
                      <td className="px-6 py-4.5 align-top">
                        <span className={`inline-flex items-center text-[10px] font-mono uppercase tracking-wider font-semibold border px-2 py-0.5 rounded-full ${colorMap[item.persona] || 'text-neutral-400 border-neutral-800'}`}>
                          {item.persona}
                        </span>
                      </td>

                      {/* Timeline status */}
                      <td className="px-6 py-4.5 align-top text-xs text-neutral-400 font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {item.status === 'Published' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                            {item.status === 'Scheduled' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            )}
                            {item.status === 'Draft' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                            )}
                            <span className="text-[11px] text-neutral-400 font-light">{item.status}</span>
                          </div>
                          <span className="text-[10px] text-neutral-600">
                            {new Date(item.createdAt || item.updatedAt || '').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1 px-1">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-neutral-500 hover:text-white hover:bg-[#1f1f1f] rounded-md transition-all duration-150"
                            title={`Edit ${item.contentType}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all duration-150"
                            title={`Delete ${item.contentType}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-neutral-500">
                      <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                        <AlertCircle className="w-5 h-5 text-neutral-600" />
                        <p className="font-medium text-neutral-400">Zero search results matched filtering matrices.</p>
                        <p className="text-neutral-600 text-xs leading-relaxed">
                          Try searching for keywords instead of specific models, or reset active dropdown scopes.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK DRAWER / INLINE MODAL FOR DECOUPLED CONTENT ENTITIES */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl h-full bg-[#0d0d0d] border-l border-[#1a1a1a] flex flex-col shadow-2xl p-6 overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#161616] pb-4 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-[#ff7700] uppercase font-bold">{editingItem.contentType} Studio</span>
                <h3 className="text-lg font-medium text-neutral-150">Quick Edit record</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 px-2 hover:bg-[#1a1a1a] text-neutral-400 hover:text-white rounded text-sm font-mono"
              >
                esc Close
              </button>
            </div>

            {/* Modal Form inputs based on type */}
            <div className="flex-1 space-y-6">

              {/* Common Title/Text Field */}
              {editingItem.contentType === 'Field Note' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Note Title</label>
                    <input
                      type="text"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full bg-[#141414] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-300 outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Excerpt</label>
                    <textarea
                      value={editFormData.excerpt || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, excerpt: e.target.value })}
                      className="w-full h-20 bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-sm text-neutral-300 outline-none focus:border-neutral-500 resize-none font-light"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Note Prose / Body</label>
                    <textarea
                      value={editFormData.content || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                      className="w-full h-64 bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-neutral-300 outline-none focus:border-neutral-500 font-mono text-xs leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Category tag</label>
                      <input
                        type="text"
                        value={editFormData.category || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-sm text-neutral-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Release Slug</label>
                      <input
                        type="text"
                        value={editFormData.slug || ''}
                        className="w-full bg-[#141414]/50 border border-[#222]/50 rounded-md px-4 py-2 text-sm text-neutral-500 outline-none cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>
                </>
              )}

              {editingItem.contentType === 'Fragment' && (
                <>
                  {editFormData.title !== undefined && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Fragment Label</label>
                      <input
                        type="text"
                        value={editFormData.title || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full bg-[#141414] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-300 outline-none focus:border-neutral-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Scribbled Fragment</label>
                    <textarea
                      value={editFormData.content !== undefined ? editFormData.content : (editFormData.body || '')}
                      onChange={(e) => {
                        if (editFormData.content !== undefined) {
                          setEditFormData({ ...editFormData, content: e.target.value });
                        } else {
                          setEditFormData({ ...editFormData, body: e.target.value });
                        }
                      }}
                      className="w-full h-48 bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-neutral-300 outline-none focus:border-neutral-500 resize-none font-mono text-xs leading-relaxed"
                    />
                  </div>
                </>
              )}

              {editingItem.contentType === 'Question' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Inquiry / Question Text</label>
                    <textarea
                      value={editFormData.text !== undefined ? editFormData.text : (editFormData.question || '')}
                      onChange={(e) => {
                        if (editFormData.text !== undefined) {
                          setEditFormData({ ...editFormData, text: e.target.value });
                        } else {
                          setEditFormData({ ...editFormData, question: e.target.value });
                        }
                      }}
                      className="w-full h-32 bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-neutral-300 outline-none focus:border-neutral-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Cognitive Context</label>
                    <textarea
                      value={editFormData.context || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, context: e.target.value })}
                      className="w-full h-24 bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-neutral-300 outline-none focus:border-neutral-500 font-serif italic text-xs"
                    />
                  </div>
                </>
              )}

              {editingItem.contentType === 'Journal Entry' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Moment Header</label>
                    <input
                      type="text"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full bg-[#141414] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-300 outline-none focus:border-neutral-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Chronology Timestamp Label</label>
                    <input
                      type="text"
                      value={editFormData.timeLabel || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, timeLabel: e.target.value })}
                      className="w-full bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-sm text-neutral-300 outline-none focus:border-neutral-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mb-2">Passage prose</label>
                    <textarea
                      value={editFormData.body || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, body: e.target.value })}
                      className="w-full h-64 bg-[#141414] border border-[#222] rounded-md px-4 py-2 text-sm text-neutral-300 outline-none focus:border-neutral-500 font-serif italic"
                    />
                  </div>
                </>
              )}

              {/* Flags inside quick editor */}
              <div className="flex items-center gap-6 border-t border-[#161616] pt-6">
                {editFormData.featured !== undefined && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs uppercase font-mono tracking-wider text-neutral-400 select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.featured === true}
                      onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                      className="form-checkbox bg-[#161616] border-[#222] rounded text-[#ff7700] focus:ring-0 cursor-pointer"
                    />
                    Featured
                  </label>
                )}
                {editFormData.hidden !== undefined && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs uppercase font-mono tracking-wider text-neutral-400 select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.hidden === true}
                      onChange={(e) => setEditFormData({ ...editFormData, hidden: e.target.checked })}
                      className="form-checkbox bg-[#161616] border-[#222] rounded text-[#ff7700] focus:ring-0 cursor-pointer"
                    />
                    Hidden
                  </label>
                )}
              </div>

            </div>

            {/* Modal Action Controls */}
            <div className="border-t border-[#161616] pt-4 mt-8 flex justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded text-xs uppercase font-mono bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 rounded text-xs uppercase font-mono bg-white text-black hover:bg-neutral-200 transition-colors font-semibold flex items-center gap-2"
              >
                {savingEdit ? 'Writing...' : 'Save Draft Segment'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
