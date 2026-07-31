'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Library, ImageIcon, Mail, RefreshCw
} from 'lucide-react';
import { AdminDashboardSkeleton } from '@/components/ui/skeletons';
import { getPosts } from '@/app/admin/actions/posts.actions';
import { getQuestions } from '@/app/admin/actions/questions.actions';
import { getNewsletterIssues } from '@/app/admin/actions/newsletterIssues.actions';

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [issuesCount, setIssuesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dataRes, qData, iData] = await Promise.all([
        getPosts(),
        getQuestions(),
        getNewsletterIssues()
      ]);
      const data = dataRes.success ? dataRes.data : [];
      setPosts(data || []);
      setQuestionsCount((qData || []).length);
      setIssuesCount((iData || []).filter(i => !i.publishedAt).length); // draft issues
    } catch (e) {
      console.error('Error fetching dashboard feeds: ', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const drafts = posts.filter(p => p.status === 'draft' || p.status === 'draft');
  
  // Sort posts by date for Recent Activity feed
  const sortedActivities = [...posts].sort((a, b) => {
    const d1 = new Date(b.updatedAt || b.publishedAt || b.createdAt || b.date || 0).getTime();
    const d2 = new Date(a.updatedAt || a.publishedAt || a.createdAt || a.date || 0).getTime();
    return d1 - d2;
  }).slice(0, 5);

  const [now, setNow] = useState<number>(() => { try { return Date.now(); } catch { return 0; } });
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const formatDistanceToNow = (dateStr: string) => {
    if (!dateStr || !now) return 'Recently';
    const date = new Date(dateStr);
    const msMs = now - date.getTime();
    if (msMs < 60000) return 'Just now';
    if (msMs < 3600000) return `${Math.floor(msMs / 60000)} min ago`;
    if (msMs < 86400000) return `${Math.floor(msMs / 3600000)} hours ago`;
    if (msMs < 172800000) return 'Yesterday';
    return `${Math.floor(msMs / 86400000)} days ago`;
  };

  const [todayStr, setTodayStr] = useState('');
  useEffect(() => {
    setTodayStr(new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()));
  }, []);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 text-neutral-300">
      
      {/* Header */}
      <div className="flex flex-col items-start gap-1 pb-6 mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100 font-sans tracking-tight">Workspace Home</h1>
        <p className="text-sm text-neutral-500">{todayStr}</p>
      </div>

      {/* Control Navigation Line */}
      <div className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-[#222]">
        <Link 
          href="/admin/compose?new=true"
          className="bg-[#222] hover:bg-[#ff7700] hover:text-black hover:border-[#ff7700] text-neutral-200 border border-[#333] px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">New Article</span>
        </Link>
        <Link href="/admin/library" className="bg-[#111] hover:bg-[#222] text-neutral-300 border border-[#222] px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5">
          <Library className="w-4 h-4 text-neutral-500 shrink-0" /> <span className="whitespace-nowrap">Content Library</span>
        </Link>
        <Link href="/admin/assets/media" className="bg-[#111] hover:bg-[#222] text-neutral-300 border border-[#222] px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-neutral-500 shrink-0" /> <span className="whitespace-nowrap">Media</span>
        </Link>
        <Link href="/admin/newsletter" className="bg-[#111] hover:bg-[#222] text-neutral-300 border border-[#222] px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-neutral-500 shrink-0" /> <span className="whitespace-nowrap">Newsletter</span>
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        
        {/* Continue Working */}
        <section>
          <h2 className="text-[10px] uppercase font-mono tracking-widest text-[#ff7700] font-semibold mb-3">Continue Working</h2>
          
          {drafts.length > 0 ? (
            <div className="space-y-1">
              {drafts.slice(0, 3).map((draft, idx) => (
                <Link 
                  href={`/admin/compose?id=${draft.id || draft.slug}`}
                  key={idx} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 px-4 rounded bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-[#ff7700]/50 transition-colors group py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff7700] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-neutral-100 truncate block">
                        {draft.title || 'Untitled Draft'}
                      </span>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        <span className="capitalize">{draft.persona || 'none'}</span> &bull; Edited {formatDistanceToNow(draft.updatedAt || draft.createdAt || draft.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono font-medium text-neutral-500 group-hover:text-[#ff7700] shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    [ Resume Draft ]
                  </div>
                </Link>
              ))}
              {drafts.length > 3 && (
                <div className="mt-2 text-left">
                  <Link href="/admin/library?status=draft" className="text-[11px] font-mono text-[#ff7700] hover:underline">
                    [ View All Drafts ]
                  </Link>
                </div>
              )}
            </div>
          ) : (
             <div className="text-sm text-neutral-500 font-mono bg-[#111] p-4 rounded border border-[#222]">
                <p className="mb-2">No Active Drafts</p>
                <div className="text-[11px] text-neutral-500 mb-2">Start writing something new.</div>
                <Link href="/admin/compose?new=true" className="text-[#ff7700] hover:text-white transition-colors">[ Create Article ]</Link>
              </div>
          )}
        </section>

        {/* Quick Create & Attention Center Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <section>
            <h2 className="text-[10px] uppercase font-mono tracking-widest text-[#ff7700] font-semibold mb-3">Attention Center</h2>
            <div className="bg-[#111] border border-[#222] rounded p-4 space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-neutral-400">Total Questions</span>
                 <span className="font-mono text-neutral-200">{questionsCount}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-neutral-400">Newsletter Drafts</span>
                 <span className="font-mono text-neutral-200">{issuesCount}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-neutral-400">Media Awaiting Org</span>
                 <span className="font-mono text-neutral-200">0</span>
               </div>
               <div className="border-t border-[#222] pt-3 mt-1 text-[11px] font-mono text-neutral-500">
                  Inbox Zero. System nominal.
               </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase font-mono tracking-widest text-[#ff7700] font-semibold mb-3">Quick Create</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/compose?new=true&persona=forge" className="bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-[#ff7700] p-3 rounded transition-colors text-[13px] font-medium text-neutral-300 hover:text-white flex items-center gap-2 group">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#ff7700] transition-transform group-hover:scale-110" /> Forge 
              </Link>
              <Link href="/admin/compose?new=true&persona=signal" className="bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-emerald-500 p-3 rounded transition-colors text-[13px] font-medium text-neutral-300 hover:text-white flex items-center gap-2 group">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 transition-transform group-hover:scale-110" /> Signal
              </Link>
              <Link href="/admin/compose?new=true&persona=inside-the-head" className="bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-purple-500 p-3 rounded transition-colors text-[13px] font-medium text-neutral-300 hover:text-white flex items-center gap-2 group">
                 <span className="w-1.5 h-1.5 rounded-full bg-purple-500 transition-transform group-hover:scale-110" /> Inside Head
              </Link>
              <Link href="/admin/compose?new=true&persona=scribble" className="bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-sky-500 p-3 rounded transition-colors text-[13px] font-medium text-neutral-300 hover:text-white flex items-center gap-2 group">
                 <span className="w-1.5 h-1.5 rounded-full bg-sky-500 transition-transform group-hover:scale-110" /> Scribble
              </Link>
            </div>
            <div className="mt-3 text-[11px] text-neutral-500 font-mono">
              Press <span className="px-1.5 py-0.5 bg-[#222] border border-[#333] rounded mx-1 text-neutral-300">Ctrl/Cmd + K</span> for palette
            </div>
          </section>
        </div>

        {/* Recent Activity */}
        <section>
          <h2 className="text-[10px] uppercase font-mono tracking-widest text-[#ff7700] font-semibold mb-3 border-b border-[#222] pb-2">Recent Activity Feed</h2>
          {sortedActivities.length > 0 ? (
            <div className="space-y-4 pt-1">
              {sortedActivities.map((activity, idx) => {
                const isDraft = activity.status === 'draft';
                const actionText = isDraft ? 'Updated:' : 'Published:';
                
                return (
                  <div key={idx} className="flex gap-4 items-start group">
                    <div className={`mt-0.5 text-[10px] font-mono uppercase w-17.5 shrink-0 text-neutral-500`}>
                      {actionText}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/compose?id=${activity.id || activity.slug}`} className="text-[13px] font-medium text-neutral-200 hover:text-white block hover:underline truncate">
                        {activity.title || 'Untitled'}
                      </Link>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        <span className="capitalize">{activity.persona || 'none'}</span> &bull; {formatDistanceToNow(activity.updatedAt || activity.publishedAt || activity.createdAt || activity.date)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[13px] text-neutral-500 bg-[#111] border border-[#222] rounded p-4">No recent activity found.</div>
          )}
        </section>

      </div>
    </div>
  );
}
