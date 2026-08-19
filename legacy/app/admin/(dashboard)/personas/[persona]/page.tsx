'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, Component, Terminal, ShieldAlert, Sparkles, Brain, BookOpen, Map, Mail, Settings,
  Activity, ArrowUp, ArrowDown, Plus, Trash2, Edit, Save, X, RefreshCw, Layers, HelpCircle,
  BookOpen as BookOpenIcon, ExternalLink, Play, ArrowLeft, Star, Eye, EyeOff
} from 'lucide-react';
import { getPosts, deletePost } from '@/app/admin/actions/posts.actions';
import { getBuildLogs, createBuildLog, updateBuildLog, deleteBuildLog } from '@/app/admin/actions/buildLogs.actions';
import { getActiveSystems, createActiveSystem, updateActiveSystem, deleteActiveSystem, moveActiveSystemUp, moveActiveSystemDown } from '@/app/admin/actions/activeSystems.actions';
import { getBuilderStatuses, createBuilderStatus, updateBuilderStatus, deleteBuilderStatus } from '@/app/admin/actions/builderStatuses.actions';
import { getOperatorFocuses, createOperatorFocus, updateOperatorFocus, deleteOperatorFocus, moveOperatorFocusUp, moveOperatorFocusDown } from '@/app/admin/actions/operatorFocuses.actions';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, moveQuestionUp, moveQuestionDown } from '@/app/admin/actions/questions.actions';
import { getThoughtFragments, createThoughtFragment, updateThoughtFragment, deleteThoughtFragment, moveThoughtFragmentUp, moveThoughtFragmentDown } from '@/app/admin/actions/thoughtFragments.actions';
import { getFragments, createFragment, updateFragment, deleteFragment, moveFragmentUp, moveFragmentDown } from '@/app/admin/actions/fragments.actions';
import { getJournalMoments, createJournalMoment, updateJournalMoment, deleteJournalMoment } from '@/app/admin/actions/journalMoments.actions';
import { Skeleton } from '@/components/ui/skeletons';

export default function PersonaDashboardPage({ params }: { params: any }) {
  const router = useRouter();

  // Safe param extraction for all versions of Next.js
  const unwrappedParams = typeof params?.then === 'function' ? React.use(params) : params;
  const personaSlug = unwrappedParams?.persona || 'forge';

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Unified States for persona specific DB tables
  const [personaPosts, setPersonaPosts] = useState<any[]>([]);
  const [buildLogs, setBuildLogs] = useState<any[]>([]);
  const [activeSystems, setActiveSystems] = useState<any[]>([]);
  const [builderStatus, setBuilderStatus] = useState<any[]>([]);
  const [operatorFocus, setOperatorFocus] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [thoughtFragments, setThoughtFragments] = useState<any[]>([]);
  const [generalFragments, setGeneralFragments] = useState<any[]>([]);
  const [journalMoments, setJournalMoments] = useState<any[]>([]);

  // Sub-entity Form modal state
  const [isEditingEntity, setIsEditingEntity] = useState(false);
  const [entityType, setEntityType] = useState<string>(''); // 'buildLog' | 'system' | 'status' | 'focus' | 'question' | 'thought' | 'fragment' | 'journal'
  const [entityId, setEntityId] = useState<string | null>(null);
  const [entityFormData, setEntityFormData] = useState<any>({});

  // Map slug to database persona name
  const isForge = personaSlug === 'forge';
  const isSignal = personaSlug === 'signal';
  const isHead = personaSlug === 'inside-the-head';
  const isScribble = personaSlug === 'scribble';

  const dbPersonaName = isForge ? 'builder' : isSignal ? 'operator' : isHead ? 'thinker' : 'wanderer';
  const personaDisplayName = isForge ? 'Forge' : isSignal ? 'Signal' : isHead ? 'Inside the Head' : 'Scribble';
  const personaIdentitySystem = isForge ? 'BUILDER' : isSignal ? 'OPERATOR' : isHead ? 'SYNAPSE' : 'WANDERERText';

  const loadPersonaData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load active Posts and filter by targeted persona
      const postsRes = await getPosts();
      const posts = postsRes.success ? postsRes.data : [];
      const filteredPosts = (posts || []).filter((p: any) => p.persona === dbPersonaName);
      setPersonaPosts(filteredPosts);

      // 2. Load other dynamic persona elements
      if (isForge) {
        const [logs, sys, stats] = await Promise.all([
          getBuildLogs(),
          getActiveSystems(),
          getBuilderStatuses()
        ]);
        setBuildLogs(logs || []);
        setActiveSystems(sys || []);
        setBuilderStatus(stats || []);
      } else if (isSignal) {
        const focus = await getOperatorFocuses();
        setOperatorFocus(focus || []);
      } else if (isHead) {
        const [q, tf, gf] = await Promise.all([
          getQuestions(),
          getThoughtFragments(),
          getFragments()
        ]);
        setQuestions(q || []);
        setThoughtFragments(tf || []);
        setGeneralFragments(gf || []);
      } else if (isScribble) {
        const jm = await getJournalMoments();
        setJournalMoments(jm || []);
      }
    } catch (e) {
      console.error('Error loading persona dashboard streams: ', e);
    } finally {
      setLoading(false);
    }
  }, [dbPersonaName, isForge, isSignal, isHead, isScribble]);

  useEffect(() => {
    loadPersonaData();
    setActiveTab('overview');
  }, [personaSlug, loadPersonaData]);

  // Secondary Entity Actions
  const handleOpenNewEntityForm = (type: string) => {
    setEntityType(type);
    setEntityId(null);
    setEntityFormData({});
    setIsEditingEntity(true);
  };

  const handleOpenEditEntityForm = (type: string, item: any) => {
    setEntityType(type);
    setEntityId(item.id || item.persona || 'none');
    setEntityFormData({ ...item });
    setIsEditingEntity(true);
  };

  // The dialog only edits a handful of visible fields, but the Zod schemas and
  // repositories expect the full canonical shape. Normalize the dialog payload
  // into that shape, mapping legacy UI field names and filling defaults for any
  // fields the dialog doesn't collect. Safe for both create and edit (edit rows
  // already carry the canonical fields, so they pass through untouched).
  const normalizeEntityData = (type: string, raw: any): any => {
    const d = { ...raw };
    switch (type) {
      case 'buildLog': {
        if (d.description === undefined && d.excerpt !== undefined) d.description = d.excerpt;
        d.source = d.source ?? 'manual';
        d.aiGenerated = d.aiGenerated ?? false;
        d.relatedCommits = d.relatedCommits ?? [];
        d.relatedRepositories = d.relatedRepositories ?? [];
        d.hidden = d.hidden ?? false;
        if (!d.date) d.date = new Date().toISOString().slice(0, 10);
        return d;
      }
      case 'system': {
        if (d.title === undefined && d.name !== undefined) d.title = d.name;
        d.status = d.status ?? 'active';
        d.level = d.level ?? '';
        d.description = d.description ?? '';
        d.stack = d.stack ?? [];
        d.order = d.order ?? 0;
        d.hidden = d.hidden ?? false;
        return d;
      }
      case 'status': {
        if (d.operationalState === undefined && d.label !== undefined) d.operationalState = d.label;
        if (d.statusText === undefined && d.value !== undefined) d.statusText = d.value;
        d.currentFocus = d.currentFocus ?? d.statusText ?? '';
        return d;
      }
      case 'focus': {
        if (d.label === undefined && d.area !== undefined) d.label = d.area;
        d.value = d.value ?? '';
        d.description = d.description ?? '';
        d.order = d.order ?? 0;
        d.hidden = d.hidden ?? false;
        return d;
      }
      case 'question': {
        if (d.text === undefined && d.question !== undefined) d.text = d.question;
        d.text = d.text ?? '';
        if (d.question === undefined) d.question = d.text;
        d.context = d.context ?? '';
        d.order = d.order ?? 0;
        d.hidden = d.hidden ?? false;
        return d;
      }
      case 'thought': {
        if (d.text === undefined && d.content !== undefined) d.text = d.content;
        d.text = d.text ?? '';
        if (d.content === undefined) d.content = d.text;
        d.hidden = d.hidden ?? false;
        return d;
      }
      case 'fragment': {
        if (d.quote === undefined && d.body !== undefined) d.quote = d.body;
        d.quote = d.quote ?? '';
        d.source = d.source ?? 'manual';
        d.order = d.order ?? 0;
        d.hidden = d.hidden ?? false;
        return d;
      }
      case 'journal': {
        d.title = d.title ?? '';
        d.body = d.body ?? '';
        d.timeLabel = d.timeLabel ?? '';
        d.hidden = d.hidden ?? false;
        return d;
      }
      default:
        return d;
    }
  };

  const handleSaveEntity = async () => {
    try {
      const data = normalizeEntityData(entityType, entityFormData);

      if (entityType === 'buildLog') {
        if (entityId) await updateBuildLog(entityId, data);
        else await createBuildLog(data);
      } else if (entityType === 'system') {
        if (entityId) await updateActiveSystem(entityId, data);
        else await createActiveSystem(data);
      } else if (entityType === 'status') {
        if (entityId) await updateBuilderStatus(entityId, data);
        else await createBuilderStatus(data);
      } else if (entityType === 'focus') {
        if (entityId) await updateOperatorFocus(entityId, data);
        else await createOperatorFocus(data);
      } else if (entityType === 'question') {
        if (entityId) await updateQuestion(entityId, data);
        else await createQuestion(data);
      } else if (entityType === 'thought') {
        if (entityId) await updateThoughtFragment(entityId, data);
        else await createThoughtFragment(data);
      } else if (entityType === 'fragment') {
        if (entityId) await updateFragment(entityId, data);
        else await createFragment(data);
      } else if (entityType === 'journal') {
        if (entityId) await updateJournalMoment(entityId, data);
        else await createJournalMoment(data);
      }

      setIsEditingEntity(false);
      await loadPersonaData();
    } catch (e: any) {
      console.error('Save model failed: ', e);
      // Surface the actual validation/database error instead of a vague warning.
      const detail = e?.message || e?.toString?.() || 'Unknown error';
      alert(`Save failed: ${detail}`);
    }
  };

  const handleDeleteEntity = async (type: string, id: string) => {
    if (!window.confirm('Delete this list entry permanently from systems?')) return;
    try {
      if (type === 'buildLog') await deleteBuildLog(id);
      else if (type === 'system') await deleteActiveSystem(id);
      else if (type === 'status') await deleteBuilderStatus(id);
      else if (type === 'focus') await deleteOperatorFocus(id);
      else if (type === 'question') await deleteQuestion(id);
      else if (type === 'thought') await deleteThoughtFragment(id);
      else if (type === 'fragment') await deleteFragment(id);
      else if (type === 'journal') await deleteJournalMoment(id);

      await loadPersonaData();
    } catch (e) {
      console.error('Delete model failed: ', e);
    }
  };

  // Reorder Actions
  const handleReorder = async (type: string, id: string, direction: 'up' | 'down') => {
    try {
      if (type === 'system') {
        if (direction === 'up') await moveActiveSystemUp(id);
        else await moveActiveSystemDown(id);
      } else if (type === 'focus') {
        if (direction === 'up') await moveOperatorFocusUp(id);
        else await moveOperatorFocusDown(id);
      } else if (type === 'question') {
        if (direction === 'up') await moveQuestionUp(id);
        else await moveQuestionDown(id);
      } else if (type === 'thought') {
        if (direction === 'up') await moveThoughtFragmentUp(id);
        else await moveThoughtFragmentDown(id);
      } else if (type === 'fragment') {
        if (direction === 'up') await moveFragmentUp(id);
        else await moveFragmentDown(id);
      }
      await loadPersonaData();
    } catch (e) {
      console.error('Reorder error: ', e);
    }
  };

  // Persona visuals config mapping
  const colorScheme = isForge
    ? { primary: '#ff7700', text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hover: 'hover:bg-orange-500/5' }
    : isSignal
    ? { primary: '#10b981', text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hover: 'hover:bg-emerald-500/5' }
    : isHead
    ? { primary: '#a855f7', text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/25', hover: 'hover:bg-purple-500/5' }
    : { primary: '#38bdf8', text: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20', hover: 'hover:bg-sky-500/5' };

  if (loading) {
    return (
      <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-[#1a1a1a] rounded-lg p-6 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const publications = personaPosts.filter(p => p.status === 'published' && p.status !== 'draft');
  const drafts = personaPosts.filter(p => p.status === 'draft' || p.status === 'draft');

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12 text-neutral-300">

      {/* Persona Dashboard Header (Aesthetics & Clean Negative space) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded text-[10px] tracking-widest font-semibold border ${colorScheme.text} ${colorScheme.bg} ${colorScheme.border} font-mono`}>
              {personaIdentitySystem}
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-100 flex items-center gap-3 font-sans">
              {personaDisplayName} Studio
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Private workspace with isolated workloads, models, logs, and drafts targeting {personaDisplayName}.
            </p>
          </div>
        </div>

        {/* Quick Writing Link targeting selector */}
        <Link
          href={`/admin/compose?persona=${dbPersonaName}`}
          className="bg-neutral-100 text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 select-none"
        >
          <Plus className="w-4 h-4" />
          Compose for {personaDisplayName}
        </Link>
      </div>

      {/* Primary Tab Navigation */}
      <div className="border-b border-[#222] mb-8">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-xs font-mono uppercase tracking-wider transition-colors relative font-semibold ${activeTab === 'overview' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`pb-4 text-xs font-mono uppercase tracking-wider transition-colors relative font-semibold ${activeTab === 'articles' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Articles & Drafts ({personaPosts.length})
            {activeTab === 'articles' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
          </button>

          {/* Dynamic tabs based on Persona profile */}
          {isForge && (
            <>
              <button
                onClick={() => setActiveTab('build-logs')}
                className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'build-logs' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Build Logs ({buildLogs.length})
                {activeTab === 'build-logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
              </button>
              <button
                onClick={() => setActiveTab('systems')}
                className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'systems' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Active Systems ({activeSystems.length})
                {activeTab === 'systems' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
              </button>
              <button
                onClick={() => setActiveTab('statuses')}
                className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'statuses' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Status Updates ({builderStatus.length})
                {activeTab === 'statuses' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
              </button>
            </>
          )}

          {isSignal && (
            <button
              onClick={() => setActiveTab('focus')}
              className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'focus' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Operator Focus ({operatorFocus.length})
              {activeTab === 'focus' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
            </button>
          )}

          {isHead && (
            <>
              <button
                onClick={() => setActiveTab('questions')}
                className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'questions' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Questions ({questions.length})
                {activeTab === 'questions' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
              </button>
              <button
                onClick={() => setActiveTab('thoughts')}
                className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'thoughts' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Thoughts & Fragments ({thoughtFragments.length + generalFragments.length})
                {activeTab === 'thoughts' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
              </button>
            </>
          )}

          {isScribble && (
            <button
              onClick={() => setActiveTab('journal')}
              className={`pb-4 text-xs font-mono uppercase tracking-wider relative transition-colors font-semibold ${activeTab === 'journal' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Journal moments ({journalMoments.length})
              {activeTab === 'journal' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: colorScheme.primary }} />}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="space-y-10">

        {/* PANEL A: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Quick KPI grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-lg">
                <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-widest font-semibold block mb-2">Live Publications</span>
                <div className="text-3xl font-light text-neutral-100 font-mono">{publications.length}</div>
                <p className="text-neutral-600 text-xs mt-2 italic">Active entries indexed in public feed</p>
              </div>

              <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-lg">
                <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-widest font-semibold block mb-2">Editor Drafts</span>
                <div className="text-3xl font-light text-neutral-100 font-mono">{drafts.length}</div>
                <p className="text-neutral-600 text-xs mt-2 italic">Working models under active phrasing</p>
              </div>

              <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-lg">
                <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-widest font-semibold block mb-2">Persona Domain</span>
                <div className="text-lg font-mono font-semibold" style={{ color: colorScheme.primary }}>
                  {dbPersonaName.toUpperCase()}
                </div>
                <p className="text-neutral-600 text-xs mt-2 italic">Clean namespace segmentation</p>
              </div>

            </div>

            {/* Combined Section Previews */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

              {/* Drafts Summary Module */}
              <div className="border border-[#1a1a1a] rounded-lg p-5 bg-[#111111]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1f1f1f]">
                  <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-neutral-400">Recent Drafts</h3>
                  <button onClick={() => setActiveTab('articles')} className="text-xs text-neutral-500 hover:text-neutral-300">View All</button>
                </div>
                <div className="divide-y divide-[#171717] space-y-1">
                  {drafts.slice(0, 4).map((d, index) => (
                    <div key={index} className="py-2.5 flex justify-between items-center group">
                      <div className="truncate max-w-[80%]">
                        <Link
                          href={`/admin/compose?id=${d.id || d.slug}`}
                          className="text-sm font-medium hover:underline text-neutral-200 block truncate"
                        >
                          {d.title || 'Untitled Draft'}
                        </Link>
                        <span className="text-[10px] font-mono text-neutral-500">Edited {d.publishedAt || d.date || 'Recently'}</span>
                      </div>
                      <Link
                        href={`/admin/compose?id=${d.id || d.slug}`}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-[#1a1a1a] rounded transition-opacity"
                      >
                        <Edit className="w-3.5 h-3.5 text-neutral-400" />
                      </Link>
                    </div>
                  ))}
                  {drafts.length === 0 && (
                    <div className="py-8 text-center text-xs text-neutral-600 italic">No working drafts found for {personaDisplayName}.</div>
                  )}
                </div>
              </div>

              {/* Persona Specialized Quick View Card */}
              <div className="border border-[#1a1a1a] rounded-lg p-5 bg-[#111111] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm uppercase font-mono tracking-wider font-semibold text-neutral-400 mb-4 pb-2 border-b border-[#1f1f1f]">
                    Specialized Workflows
                  </h3>
                  <p className="text-neutral-500 text-xs leading-relaxed mb-4">
                    {isForge && "Manage build records, active tech integrations, and systems architectures."}
                    {isSignal && "Configure operational focus parameters, indicators, and telemetry targets."}
                    {isHead && "Compose cognitive inquiries, conceptual fragments, and reflective notes."}
                    {isScribble && "Maintain travel memories, monologue snippets, and geographic timeline milestones."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (isForge) setActiveTab('build-logs');
                    else if (isSignal) setActiveTab('focus');
                    else if (isHead) setActiveTab('questions');
                    else if (isScribble) setActiveTab('journal');
                  }}
                  className="w-full text-center py-2 bg-[#181818] hover:bg-[#202020] rounded border border-[#222] text-xs font-mono text-neutral-300 transition-colors"
                >
                  Enter Studio Tooling
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PANEL B: ARTICLES & DRAFTS */}
        {activeTab === 'articles' && (
          <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[60%]">Title</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Date</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {personaPosts.map((post, idx) => (
                  <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-1">
                        <Link
                          href={`/admin/compose?id=${post.id || post.slug}`}
                          className="font-medium text-neutral-200 text-sm hover:underline block"
                        >
                          {post.title}
                        </Link>
                        {post.subtitle && <p className="text-neutral-500 text-xs truncate italic">{post.subtitle}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-xs font-mono">
                      <div className="flex items-center gap-2">
                        {post.status === 'draft' || post.status === 'draft' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                            <span className="text-neutral-400 font-light">Draft</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-neutral-400 font-light">Published</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-xs font-mono text-neutral-500">
                      {post.publishedAt || post.createdAt || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/p/${post.slug}?preview=true`}
                          target="_blank"
                          className="p-1 px-2.5 bg-[#171717] border border-[#222] hover:bg-[#222] hover:text-white rounded text-xs text-neutral-400 font-mono transition-colors"
                        >
                          VIEW
                        </Link>
                        <Link
                          href={`/admin/compose?id=${post.id || post.slug}`}
                          className="p-1 px-2.5 bg-[#171717] border border-[#222] hover:bg-[#222] hover:text-white rounded text-xs text-neutral-400 font-mono transition-colors"
                        >
                          EDIT
                        </Link>
                        <button
                          onClick={() => handleDeleteEntity('article', post.id || post.slug)}
                          className="p-1 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-mono"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {personaPosts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500 italic">No posts found on this channel.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* FORGE TABS CONTAINER */}
        {isForge && activeTab === 'build-logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#ff7700] p-1 select-none font-bold">Build logs record</h3>
              <button onClick={() => handleOpenNewEntityForm('buildLog')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Log Entry
              </button>
            </div>

            <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Title / Date</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Payload / Progress</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {buildLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                      <td className="px-6 py-4 align-top max-w-75">
                        <div className="font-semibold text-neutral-200 text-sm">{log.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-1">{log.date || 'Today'}</div>
                      </td>
                      <td className="px-6 py-4 align-top text-xs leading-relaxed font-mono">
                        <p className="text-neutral-400 line-clamp-2 md:max-w-100">{log.excerpt || log.content || ''}</p>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenEditEntityForm('buildLog', log)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                          <button onClick={() => handleDeleteEntity('buildLog', log.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {buildLogs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No build records logged in DB registry.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isForge && activeTab === 'systems' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#ff7700] font-bold">Systems configuration matrix</h3>
              <button onClick={() => handleOpenNewEntityForm('system')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add System
              </button>
            </div>

            <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">System Parameters</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Active Level</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Reorder & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {activeSystems.map((sys, idx) => (
                    <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                      <td className="px-6 py-4 align-top max-w-100">
                        <div className="font-semibold text-neutral-200 text-sm">{sys.name}</div>
                        <p className="text-neutral-500 text-xs mt-1 leading-relaxed font-light">{sys.description || ''}</p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="font-mono text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{sys.level || '100%'}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleReorder('system', sys.id, 'up')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleReorder('system', sys.id, 'down')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => handleOpenEditEntityForm('system', sys)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                          <button onClick={() => handleDeleteEntity('system', sys.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeSystems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No registered systems in DB.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isForge && activeTab === 'statuses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#ff7700] font-bold">Status updates pipeline</h3>
              <button onClick={() => handleOpenNewEntityForm('status')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Status
              </button>
            </div>

            <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Label</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Value / Progress</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {builderStatus.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                      <td className="px-6 py-4 align-top max-w-75">
                        <div className="font-semibold text-neutral-200 text-sm">{stat.label}</div>
                      </td>
                      <td className="px-6 py-4 align-top font-mono text-xs">
                        <div className="text-neutral-400">{stat.value || 'Active'}</div>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenEditEntityForm('status', stat)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                          <button onClick={() => handleDeleteEntity('status', stat.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {builderStatus.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No builder status configurations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SIGNAL TAB CONTAINER */}
        {isSignal && activeTab === 'focus' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 font-bold">Operational focus criteria</h3>
              <button onClick={() => handleOpenNewEntityForm('focus')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Focus Spec
              </button>
            </div>

            <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Area / Metric</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Coefficient / Value</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Reorder & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {operatorFocus.map((f, idx) => (
                    <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                      <td className="px-6 py-4 align-top max-w-112.5">
                        <div className="font-semibold text-neutral-200 text-sm">{f.area}</div>
                        <p className="text-neutral-500 text-xs mt-1 leading-relaxed font-light">{f.description || ''}</p>
                      </td>
                      <td className="px-6 py-4 align-top text-xs font-mono">
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{f.value || '1.0'}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleReorder('focus', f.id, 'up')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleReorder('focus', f.id, 'down')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => handleOpenEditEntityForm('focus', f)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                          <button onClick={() => handleDeleteEntity('focus', f.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {operatorFocus.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No focus elements stored.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INSIDE THE HEAD TABS */}
        {isHead && activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-purple-500 font-bold">Cognitive inquiries pipeline</h3>
              <button onClick={() => handleOpenNewEntityForm('question')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[60%]">Question Formula</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono">Context Label</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Reorder & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {questions.map((q, idx) => {
                    const qText = q.text || q.question || '';
                    return (
                      <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                        <td className="px-6 py-4 align-top">
                          <div className="font-serif italic text-neutral-250 text-sm leading-relaxed max-w-125">&ldquo;{qText}&rdquo;</div>
                        </td>
                        <td className="px-6 py-4 align-top text-xs text-neutral-500 font-mono">
                          {q.context || 'Theoretical Frame'}
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleReorder('question', q.id, 'up')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReorder('question', q.id, 'down')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                            </div>
                            <button onClick={() => handleOpenEditEntityForm('question', q)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                            <button onClick={() => handleDeleteEntity('question', q.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {questions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No question tracks defined.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isHead && activeTab === 'thoughts' && (
          <div className="space-y-10">
            {/* Thought Fragments subsection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-purple-500 font-bold">Thought fragments stream</h3>
                <button onClick={() => handleOpenNewEntityForm('thought')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Thought
                </button>
              </div>

              <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[70%]">Thought Prose</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Reorder & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {thoughtFragments.map((tf, idx) => (
                      <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                        <td className="px-6 py-4 align-top leading-relaxed text-sm text-neutral-300 font-light">
                          {tf.content}
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleReorder('thought', tf.id, 'up')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReorder('thought', tf.id, 'down')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                            </div>
                            <button onClick={() => handleOpenEditEntityForm('thought', tf)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                            <button onClick={() => handleDeleteEntity('thought', tf.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {thoughtFragments.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No structured thoughts configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Fragments subsection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#a855f7]/70 font-semibold">General micro fragments (quotes / snippets)</h3>
                <button onClick={() => handleOpenNewEntityForm('fragment')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Snippet
                </button>
              </div>

              <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[70%]">Excerpt body</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Reorder & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {generalFragments.map((g, idx) => (
                      <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                        <td className="px-6 py-4 align-top leading-relaxed text-xs text-neutral-400 font-mono italic">
                          &ldquo;{g.body}&rdquo;
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleReorder('fragment', g.id, 'up')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReorder('fragment', g.id, 'down')} className="p-1 hover:bg-[#222] text-neutral-500 hover:text-white rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                            </div>
                            <button onClick={() => handleOpenEditEntityForm('fragment', g)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                            <button onClick={() => handleDeleteEntity('fragment', g.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {generalFragments.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No snippets stored.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SCRIBBLE TAB PANEL */}
        {isScribble && activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-sky-500 font-bold">Chronology journal passage streams</h3>
              <button onClick={() => handleOpenNewEntityForm('journal')} className="bg-[#1c1c1c] hover:bg-[#222] border border-[#2b2b2b] text-neutral-300 text-xs uppercase font-mono px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Log Journal Passage
              </button>
            </div>

            <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[25%]">Journal Moment</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[55%]">Passage Text</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {journalMoments.map((jm, idx) => (
                    <tr key={idx} className="hover:bg-[#161616] group transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-neutral-100 text-sm">{jm.title || 'Journal Entry'}</div>
                        <div className="text-[10px] text-sky-400 font-mono mt-1.5 tracking-wider">{jm.timeLabel || 'Recent'}</div>
                      </td>
                      <td className="px-6 py-4 align-top text-xs leading-relaxed font-serif text-neutral-400 italic">
                        <p className="line-clamp-3 max-w-125">{jm.body}</p>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenEditEntityForm('journal', jm)} className="p-1 px-2 border border-[#222] text-xs font-mono text-neutral-400 hover:text-white rounded">EDIT</button>
                          <button onClick={() => handleDeleteEntity('journal', jm.id)} className="p-1 px-2 bg-red-500/10 text-red-400 text-xs font-mono rounded">DEL</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {journalMoments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-neutral-500 italic">No logged memories or moments in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* QUICK FLOATING EDIT MODAL DIALOG */}
      {isEditingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0e0e0e] border border-[#1d1d1d] rounded-lg w-full max-w-xl p-6 shadow-2xl relative">
            <button onClick={() => setIsEditingEntity(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white font-mono text-xs">esc Close</button>

            <div className="mb-6">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#ff7700] block mb-1">Database item editor</span>
              <h4 className="text-md font-semibold text-neutral-150">
                {entityId ? 'Update' : 'Create'} {entityType.replace(/([A-Z])/g, ' $1').trim()} row record
              </h4>
            </div>

            {/* Dialog forms mapping by model type */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-6 pr-1">

              {entityType === 'buildLog' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Build Log ID/Title</label>
                    <input type="text" value={entityFormData.title || ''} onChange={(e) => setEntityFormData({ ...entityFormData, title: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Timestamp / Date</label>
                    <input type="text" value={entityFormData.date || ''} onChange={(e) => setEntityFormData({ ...entityFormData, date: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Log snippet / content</label>
                    <textarea value={entityFormData.excerpt || ''} onChange={(e) => setEntityFormData({ ...entityFormData, excerpt: e.target.value })} className="w-full h-32 bg-[#131313] border border-[#222] rounded px-3 py-2 text-neutral-300 resize-none font-mono text-xs" />
                  </div>
                </>
              )}

              {entityType === 'system' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">System parameter label</label>
                    <input type="text" value={entityFormData.name || ''} onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">System description / telemetry</label>
                    <textarea value={entityFormData.description || ''} onChange={(e) => setEntityFormData({ ...entityFormData, description: e.target.value })} className="w-full h-20 bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300 resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Output/Level index (e.g. 98%)</label>
                    <input type="text" value={entityFormData.level || ''} onChange={(e) => setEntityFormData({ ...entityFormData, level: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-xs font-mono text-neutral-300" />
                  </div>
                </>
              )}

              {entityType === 'status' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Status key</label>
                    <input type="text" value={entityFormData.label || ''} onChange={(e) => setEntityFormData({ ...entityFormData, label: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Value code expression</label>
                    <input type="text" value={entityFormData.value || ''} onChange={(e) => setEntityFormData({ ...entityFormData, value: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-xs font-mono text-neutral-300" />
                  </div>
                </>
              )}

              {entityType === 'focus' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Objective / Focus area</label>
                    <input type="text" value={entityFormData.area || ''} onChange={(e) => setEntityFormData({ ...entityFormData, area: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Brief details</label>
                    <textarea value={entityFormData.description || ''} onChange={(e) => setEntityFormData({ ...entityFormData, description: e.target.value })} className="w-full h-20 bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300 resize-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Metrics/Coefficient factor (e.g. 0.95)</label>
                    <input type="text" value={entityFormData.value || ''} onChange={(e) => setEntityFormData({ ...entityFormData, value: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-xs font-mono text-neutral-300" />
                  </div>
                </>
              )}

              {entityType === 'question' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Question text</label>
                    <textarea value={entityFormData.text !== undefined ? entityFormData.text : (entityFormData.question || '')} onChange={(e) => setEntityFormData({ ...entityFormData, text: e.target.value, question: e.target.value })} className="w-full h-24 bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-350 italic font-serif leading-relaxed" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Cognitive framework context</label>
                    <input type="text" value={entityFormData.context || ''} onChange={(e) => setEntityFormData({ ...entityFormData, context: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                </>
              )}

              {entityType === 'thought' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Thought content draft</label>
                  <textarea value={entityFormData.content || ''} onChange={(e) => setEntityFormData({ ...entityFormData, content: e.target.value })} className="w-full h-36 bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300 font-sans leading-relaxed" />
                </div>
              )}

              {entityType === 'fragment' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Snippet body text</label>
                  <textarea value={entityFormData.body || ''} onChange={(e) => setEntityFormData({ ...entityFormData, body: e.target.value })} className="w-full h-36 bg-[#131313] border border-[#222] rounded px-3 py-2 text-xs font-mono text-neutral-400" />
                </div>
              )}

              {entityType === 'journal' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Moment summary label</label>
                    <input type="text" value={entityFormData.title || ''} onChange={(e) => setEntityFormData({ ...entityFormData, title: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Chronology tag / time indicator</label>
                    <input type="text" value={entityFormData.timeLabel || ''} onChange={(e) => setEntityFormData({ ...entityFormData, timeLabel: e.target.value })} className="w-full bg-[#131313] border border-[#222] rounded px-3 py-2 text-xs font-mono text-neutral-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-mono mb-2">Journal passage text</label>
                    <textarea value={entityFormData.body || ''} onChange={(e) => setEntityFormData({ ...entityFormData, body: e.target.value })} className="w-full h-40 bg-[#131313] border border-[#222] rounded px-3 py-2 text-sm font-serif italic text-neutral-350 leading-relaxed" />
                  </div>
                </>
              )}

            </div>

            <div className="flex justify-end gap-3 border-t border-[#181818] pt-4">
              <button onClick={() => setIsEditingEntity(false)} className="px-4 py-2 bg-[#121212] font-mono text-xs uppercase text-neutral-400 hover:text-white rounded transition-colors">Cancel</button>
              <button onClick={handleSaveEntity} className="px-4 py-2 bg-white text-black font-semibold text-xs uppercase font-mono rounded hover:bg-neutral-200 transition-colors">Save record</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
