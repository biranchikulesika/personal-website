import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Send, X, RefreshCw, Loader2, Sparkles, Globe, Share2, RotateCcw, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { uploadImage } from '@/lib/supabase/storage';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { optimizePostMetadataAction } from '@/app/admin/actions/posts.actions';
import type { CompletePostMetadata } from '@/lib/ai/post-metadata';

interface PublishDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  richTextContent?: string;
  personaInfoMap: Record<string, { label: string; system: string; color: string; bg: string }>;
  saving: boolean;
  isCustomizingUrl: boolean;
  setIsCustomizingUrl: (val: boolean) => void;
  customUrlVal: string;
  setCustomUrlVal: (val: string) => void;
  urlValidationError: string | null;
  setUrlValidationError: (val: string | null) => void;
  pasteTagsText: string;
  setPasteTagsText: (val: string) => void;
  getExcerptFromContent: () => string;
  getWordCount: () => number;
  getReadingTime: () => number;
  handleApplyCustomUrl: () => void;
  validateCustomSlug: (slug: string, postId: string | null, persona: string) => Promise<{ valid: boolean; cleanSlug?: string; error?: string }>;
  handleSavePost: (isNewDraftState: boolean) => Promise<void>;
  currentPostId: string | null;
  wasPublished: boolean;
  isEditingExcerpt: boolean;
  setIsEditingExcerpt: (val: boolean) => void;
}

export default function PublishDrawer({
  isOpen,
  onClose,
  formData,
  setFormData,
  richTextContent = '',
  personaInfoMap,
  saving,
  isCustomizingUrl,
  setIsCustomizingUrl,
  customUrlVal,
  setCustomUrlVal,
  urlValidationError,
  setUrlValidationError,
  pasteTagsText,
  setPasteTagsText,
  getExcerptFromContent,
  getWordCount,
  getReadingTime,
  handleApplyCustomUrl,
  validateCustomSlug,
  handleSavePost,
  currentPostId,
  wasPublished,
  isEditingExcerpt,
  setIsEditingExcerpt
}: PublishDrawerProps) {
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [previewTab, setPreviewTab] = useState<'search' | 'social'>('search');
  const [showAdvancedSeo, setShowAdvancedSeo] = useState(false);

  const manualOverrides: string[] = useMemo(
    () => (Array.isArray(formData.manualOverrides) ? formData.manualOverrides : []),
    [formData.manualOverrides]
  );

  const handleFieldChange = (field: string, value: any) => {
    const updatedOverrides = manualOverrides.includes(field)
      ? manualOverrides
      : [...manualOverrides, field];
    
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
      manualOverrides: updatedOverrides,
    }));
  };

  const resetFieldToAI = async (field: string) => {
    const nextOverrides = manualOverrides.filter(f => f !== field);
    setFormData((prev: any) => ({
      ...prev,
      manualOverrides: nextOverrides,
    }));
    await handleGenerateAI(true, nextOverrides);
  };

  const handleGenerateAI = useCallback(async (force = false, currentOverrides?: string[]) => {
    if (isGeneratingAI) return;
    if (formData.autoOptimize === false && !force) return;

    setIsGeneratingAI(true);
    try {
      const overridesToUse = currentOverrides ?? manualOverrides;
      const res = await optimizePostMetadataAction({
        id: currentPostId || undefined,
        title: formData.title || '',
        content: richTextContent || '',
        persona: formData.persona || 'builder',
        coverImageUrl: formData.coverImageUrl || '',
        manualOverrides: overridesToUse,
        existingData: {
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          excerpt: formData.excerpt,
          suggestedSlug: formData.slug,
          ogTitle: formData.ogTitle,
          ogDescription: formData.ogDescription,
          twitterTitle: formData.twitterTitle,
          twitterDescription: formData.twitterDescription,
          tags: formData.tags,
          keywords: formData.keywords,
          coverImageAlt: formData.coverImageAlt,
        },
        currentHash: formData.aiMetadataContentHash,
        force,
      });

      if (res.success && res.data) {
        const data: CompletePostMetadata = res.data;
        setFormData((prev: any) => {
          const updated = { ...prev };
          const overrideSet = new Set(overridesToUse);

          if (!overrideSet.has('excerpt')) updated.excerpt = data.excerpt;
          if (!overrideSet.has('seoTitle')) updated.seoTitle = data.seoTitle;
          if (!overrideSet.has('seoDescription')) updated.seoDescription = data.seoDescription;
          if (!overrideSet.has('ogTitle')) updated.ogTitle = data.ogTitle;
          if (!overrideSet.has('ogDescription')) updated.ogDescription = data.ogDescription;
          if (!overrideSet.has('twitterTitle')) updated.twitterTitle = data.twitterTitle;
          if (!overrideSet.has('twitterDescription')) updated.twitterDescription = data.twitterDescription;
          if (!overrideSet.has('keywords')) updated.keywords = data.keywords;
          if (!overrideSet.has('coverImageAlt') && data.coverImageAlt) updated.coverImageAlt = data.coverImageAlt;
          if (!overrideSet.has('tags')) {
            updated.tags = data.tags;
            setPasteTagsText(data.tags.join(', '));
          }
          if (!overrideSet.has('slug') && (!prev.slug || prev.slug.trim() === '' || prev.slug === 'untitled-post')) {
            updated.slug = data.suggestedSlug;
          }

          updated.aiMetadataStatus = 'completed';
          updated.aiMetadataContentHash = data.contentHash;
          updated.aiMetadataLastGeneratedAt = new Date().toISOString();
          updated.aiMetadataError = null;
          return updated;
        });
      }
    } catch (e: any) {
      console.error('AI metadata optimization error:', e);
      setFormData((prev: any) => ({
        ...prev,
        aiMetadataStatus: 'failed',
        aiMetadataError: e.message || 'Generation failed',
      }));
    } finally {
      setIsGeneratingAI(false);
    }
  }, [
    formData.title, formData.persona, formData.coverImageUrl, formData.autoOptimize,
    formData.aiMetadataContentHash, formData.seoTitle, formData.seoDescription,
    formData.excerpt, formData.slug, formData.ogTitle, formData.ogDescription,
    formData.twitterTitle, formData.twitterDescription, formData.tags,
    formData.keywords, formData.coverImageAlt, richTextContent, manualOverrides,
    currentPostId, isGeneratingAI, setFormData, setPasteTagsText
  ]);

  // Automatically trigger AI optimization on open if ungenerated or empty
  useEffect(() => {
    if (isOpen && formData.autoOptimize !== false && (!formData.seoTitle || !formData.excerpt || !pasteTagsText) && (richTextContent?.trim() || formData.title?.trim())) {
      handleGenerateAI(false);
    }
  }, [isOpen, formData.autoOptimize, formData.seoTitle, formData.excerpt, pasteTagsText, richTextContent, formData.title, handleGenerateAI]);

  // Focus trap
  const { containerRef: drawerRef } = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  const setDrawerRef = (el: HTMLDivElement | null) => {
    drawerRef.current = el;
  };

  const effectiveTitle = formData.seoTitle || formData.title || 'Untitled Post';
  const effectiveDescription = formData.seoDescription || formData.excerpt || getExcerptFromContent() || 'Explore insights, technical essays, and architecture notes by Biranchi Kulesika.';
  const effectiveSlug = formData.slug || 'untitled';
  const effectiveOgTitle = formData.ogTitle || effectiveTitle;
  const effectiveOgDesc = formData.ogDescription || effectiveDescription;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-end p-0 z-50 animate-in fade-in duration-200">
      <div 
        ref={setDrawerRef}
        className="bg-[#0c0c0c] border-l border-[#1c1c1c] max-w-xl w-full h-full p-6 md:p-8 flex flex-col justify-between text-neutral-300 relative shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        id="publishing-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Publish settings"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1c1c1c]">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-[#ff7700]" />
              <h2 className="text-base font-bold font-sans text-white tracking-widest uppercase">
                Publishing & SEO Hub
              </h2>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-[#1a1a1a] rounded text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Contents */}
          <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-6">

            {/* AI Optimization Master Switch */}
            <div className="p-3.5 bg-[#121212] border border-[#222] rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${formData.autoOptimize !== false ? 'bg-[#ff7700]/15 text-[#ff7700]' : 'bg-neutral-800 text-neutral-500'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                      <span>Generate by AI</span>
                      {formData.autoOptimize !== false ? (
                        <span className="text-[9px] bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                          ON (Background)
                        </span>
                      ) : (
                        <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                          OFF (Manual)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {formData.autoOptimize !== false 
                        ? 'Analyzes content in background to generate SEO title, description, social cards & tags.'
                        : 'Automatic generation stopped for this post. Manually entered metadata is preserved.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {formData.autoOptimize !== false && (
                    <button
                      type="button"
                      onClick={() => handleGenerateAI(true)}
                      disabled={isGeneratingAI}
                      className="text-[10px] text-[#ff7700] hover:text-[#ff9933] font-mono uppercase px-2 py-1 bg-neutral-900 border border-[#333] hover:border-[#ff7700] rounded flex items-center gap-1 disabled:opacity-50 transition-colors"
                      title="Re-run background optimization"
                    >
                      <RotateCcw className={`w-3 h-3 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                      {isGeneratingAI ? 'Optimizing...' : 'Regenerate'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const next = formData.autoOptimize === false ? true : false;
                      setFormData((prev: any) => ({ ...prev, autoOptimize: next }));
                      if (next) {
                        handleGenerateAI(true);
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${formData.autoOptimize !== false ? 'bg-[#ff7700]' : 'bg-neutral-800'}`}
                    role="switch"
                    aria-checked={formData.autoOptimize !== false}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.autoOptimize !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Search & Social Preview Box */}
            <div className="border border-[#222] bg-[#0f0f0f] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-[#161616] border-b border-[#222]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-semibold">
                  Live Preview
                </span>
                <div className="flex items-center gap-1 bg-[#0a0a0a] p-0.5 rounded border border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('search')}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded transition-colors ${
                      previewTab === 'search' ? 'bg-[#222] text-white' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Globe className="w-2.5 h-2.5" />
                    Google Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('social')}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded transition-colors ${
                      previewTab === 'social' ? 'bg-[#222] text-white' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Share2 className="w-2.5 h-2.5" />
                    Social Card
                  </button>
                </div>
              </div>

              <div className="p-3.5">
                {previewTab === 'search' ? (
                  <div className="space-y-1 font-sans">
                    <div className="text-[11px] text-neutral-400 font-mono truncate flex items-center gap-1">
                      <span className="text-emerald-500">https://biranchikulesika.com</span>
                      <span className="text-neutral-500">› p › {effectiveSlug}</span>
                    </div>
                    <div className="text-sm text-[#8ab4f8] hover:underline cursor-pointer font-medium line-clamp-1">
                      {effectiveTitle} | Biranchi Kulesika
                    </div>
                    <div className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {effectiveDescription}
                    </div>
                  </div>
                ) : (
                  <div className="border border-[#2a2a2a] bg-[#141414] rounded-md overflow-hidden max-w-sm mx-auto">
                    {formData.coverImageUrl ? (
                      <div className="relative h-28 w-full bg-[#1e1e1e]">
                        <Image 
                          src={formData.coverImageUrl} 
                          alt={formData.coverImageAlt || effectiveTitle} 
                          fill 
                          className="object-cover" 
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="h-20 bg-gradient-to-br from-neutral-900 to-[#181818] flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase">
                        Dynamic OG Preview
                      </div>
                    )}
                    <div className="p-2.5 space-y-1">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
                        biranchikulesika.com
                      </span>
                      <h4 className="text-xs font-semibold text-neutral-200 line-clamp-1">
                        {effectiveOgTitle}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-tight">
                        {effectiveOgDesc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Persona Channel Selector */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500 mb-1.5">Compose persona channel</label>
              <div className="grid grid-cols-2 gap-2">
                {(['builder', 'operator', 'thinker', 'wanderer'] as const).map((persona) => {
                  const info = personaInfoMap[persona];
                  const isSelected = formData.persona === persona;
                  return (
                    <button
                      key={persona}
                      type="button"
                      onClick={() => setFormData((prev: any) => ({ ...prev, persona }))}
                      className={`flex flex-col items-start p-3 border rounded text-left transition-all ${
                        isSelected 
                          ? `border-[#ff7700] bg-[#1a1a1a] ${info.color}` 
                          : 'border-[#222] bg-[#0d0d0d] text-neutral-400 hover:border-[#444]'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{info.label}</span>
                      <span className="text-[9px] opacity-70 mt-1 uppercase font-mono tracking-widest">{info.system}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary / Excerpt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500">Summary / Excerpt</label>
                  {manualOverrides.includes('excerpt') ? (
                    <span className="text-[9px] bg-neutral-800 text-amber-400 border border-amber-900/40 px-1.5 py-0.2 rounded font-mono uppercase">
                      Custom Override
                    </span>
                  ) : (
                    <span className="text-[9px] bg-neutral-800 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.2 rounded font-mono uppercase">
                      AI Generated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {manualOverrides.includes('excerpt') && (
                    <button 
                      type="button"
                      onClick={() => resetFieldToAI('excerpt')}
                      className="text-[9px] text-[#ff7700] hover:text-[#ff9933] font-mono uppercase flex items-center gap-1"
                    >
                      [Reset to AI]
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setIsEditingExcerpt(!isEditingExcerpt)}
                    className="text-[9px] text-neutral-400 hover:text-neutral-200 font-mono tracking-widest uppercase"
                  >
                    {isEditingExcerpt ? '[Cancel]' : '[Edit]'}
                  </button>
                </div>
              </div>
              
              {isEditingExcerpt ? (
                <div className="space-y-2">
                  <textarea 
                    value={formData.excerpt || ''}
                    onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                    placeholder="Enter excerpt details..."
                    className="w-full h-20 bg-[#141414] border border-[#222] rounded px-3 py-2 text-xs text-neutral-300 outline-none focus:border-[#ff7700] resize-none font-sans"
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsEditingExcerpt(false)}
                    className="text-[9px] text-neutral-400 hover:text-neutral-200 font-mono bg-neutral-950 border border-[#222] px-2.5 py-1 rounded"
                  >
                    [ Done ]
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 font-sans italic bg-[#141414] border border-[#222] rounded p-2.5 whitespace-pre-wrap">
                  {formData.excerpt || (isGeneratingAI ? 'Generating summary with AI...' : getExcerptFromContent() || '(Auto summary generated with AI on publish)')}
                </p>
              )}
            </div>

            {/* Suggested Tags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500">Tags</label>
                  {manualOverrides.includes('tags') ? (
                    <span className="text-[9px] bg-neutral-800 text-amber-400 border border-amber-900/40 px-1.5 py-0.2 rounded font-mono uppercase">
                      Custom Override
                    </span>
                  ) : (
                    <span className="text-[9px] bg-neutral-800 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.2 rounded font-mono uppercase">
                      AI Generated
                    </span>
                  )}
                </div>
                {manualOverrides.includes('tags') && (
                  <button 
                    type="button"
                    onClick={() => resetFieldToAI('tags')}
                    className="text-[9px] text-[#ff7700] hover:text-[#ff9933] font-mono uppercase flex items-center gap-1"
                  >
                    [Reset to AI]
                  </button>
                )}
              </div>
              <input 
                type="text" 
                value={pasteTagsText}
                onChange={(e) => {
                  setPasteTagsText(e.target.value);
                  handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean));
                }}
                placeholder="tech, architecture, philosophy"
                className="w-full bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-3 py-2 text-xs font-mono text-neutral-300 outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">Separate tags with commas.</p>
            </div>

            {/* URL Slash Segment */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500 mb-1.5">URL Slash Segment</label>
              <div className="flex flex-col gap-1.5 bg-[#141414] border border-[#222] rounded p-2.5">
                <div className="text-xs font-mono text-neutral-400 select-all overflow-x-auto whitespace-nowrap">
                  /p/{formData.slug || 'untitled'}
                </div>
                
                {isCustomizingUrl ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="text"
                      value={customUrlVal}
                      onChange={(e) => {
                        setCustomUrlVal(e.target.value);
                        setUrlValidationError(null);
                      }}
                      placeholder="slug-path-segment"
                      className="w-full bg-[#0d0d0d] border border-[#222] focus:border-[#ff7700] rounded px-3 py-1.5 text-xs font-mono text-neutral-200 outline-none"
                    />
                    {urlValidationError && (
                      <p className="text-[10px] text-red-500 font-mono italic">
                        {urlValidationError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="px-2.5 py-1 bg-[#ff7700] hover:bg-[#ff881a] text-black text-[10px] font-mono uppercase font-bold rounded transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomizingUrl(false);
                          setUrlValidationError(null);
                        }}
                        className="px-2.5 py-1 bg-[#222] hover:bg-[#333] text-neutral-400 text-[10px] font-mono uppercase rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrlVal(formData.slug || '');
                      setIsCustomizingUrl(true);
                      setUrlValidationError(null);
                    }}
                    className="self-start text-[10px] text-[#ff7700] hover:text-[#ff881a] font-mono block hover:underline transition-all mt-1 font-semibold"
                  >
                    [ Customize ]
                  </button>
                )}
              </div>
            </div>

            {/* Advanced SEO & Social Overrides (Collapsible) */}
            <div className="border border-[#222] rounded-lg bg-[#0e0e0e] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedSeo(!showAdvancedSeo)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[#141414] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-300">Advanced SEO & Social Metadata</span>
                  {manualOverrides.some(f => ['seoTitle', 'seoDescription', 'ogTitle', 'ogDescription', 'twitterTitle', 'twitterDescription', 'keywords'].includes(f)) && (
                    <span className="text-[9px] bg-amber-950/60 border border-amber-800/40 text-amber-400 px-1.5 py-0.2 rounded font-mono">
                      Overrides Active
                    </span>
                  )}
                </div>
                {showAdvancedSeo ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>

              {showAdvancedSeo && (
                <div className="p-3.5 border-t border-[#222] space-y-4 text-xs font-mono">
                  {/* SEO Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase text-neutral-500 font-semibold">SEO Title</span>
                      <span className="text-[10px] text-neutral-500">{(formData.seoTitle || formData.title || '').length}/60</span>
                    </div>
                    <input
                      type="text"
                      value={formData.seoTitle ?? ''}
                      onChange={(e) => handleFieldChange('seoTitle', e.target.value)}
                      placeholder={formData.title || 'SEO Title'}
                      className="w-full bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase text-neutral-500 font-semibold">Meta Description</span>
                      <span className="text-[10px] text-neutral-500">{(formData.seoDescription ?? formData.excerpt ?? '').length}/160</span>
                    </div>
                    <textarea
                      value={formData.seoDescription ?? ''}
                      onChange={(e) => handleFieldChange('seoDescription', e.target.value)}
                      placeholder={formData.excerpt || 'Search engine snippet'}
                      className="w-full h-16 bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none resize-none font-sans"
                    />
                  </div>

                  {/* OpenGraph Title & Twitter Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 font-semibold block mb-1">OG Title</span>
                      <input
                        type="text"
                        value={formData.ogTitle ?? ''}
                        onChange={(e) => handleFieldChange('ogTitle', e.target.value)}
                        placeholder={formData.seoTitle || formData.title || 'OG Title'}
                        className="w-full bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-500 font-semibold block mb-1">Twitter Title</span>
                      <input
                        type="text"
                        value={formData.twitterTitle ?? ''}
                        onChange={(e) => handleFieldChange('twitterTitle', e.target.value)}
                        placeholder={formData.seoTitle || formData.title || 'Twitter Title'}
                        className="w-full bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 font-semibold block mb-1">Search Keywords</span>
                    <input
                      type="text"
                      value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : ''}
                      onChange={(e) => handleFieldChange('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                      placeholder="distributed-systems, consensus, database"
                      className="w-full bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Display Cover Graphic */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500 mb-1.5 flex items-center justify-between w-full">
                <span>Display Cover Graphic</span>
                <div className="flex items-center gap-1.5 select-none text-[9px] lowercase bg-[#0d0d0d] px-1.5 py-0.5 rounded border border-[#1c1c1c]">
                  <input 
                    type="checkbox" 
                    id="auto-cover"
                    checked={formData.autoCoverImage} 
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, autoCoverImage: e.target.checked }))}
                    className="accent-[#ff7700] w-2.5 h-2.5"
                  />
                  <label htmlFor="auto-cover" className="cursor-pointer text-neutral-400">Auto-extract from post</label>
                </div>
              </label>
              
              {!formData.autoCoverImage && (
                formData.coverImageUrl ? (
                  <div className="relative rounded overflow-hidden group h-32">
                    <Image 
                      src={formData.coverImageUrl} 
                      alt="Cover Preview"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, coverImageUrl: '' }))}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-medium"
                      >
                        Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#333] hover:border-[#ff7700] rounded-lg p-6 bg-[#0a0a0a] transition-all relative flex flex-col items-center justify-center h-32">
                    {isUploadingCover ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-5 h-5 text-[#ff7700] animate-spin" />
                        <span className="text-xs text-neutral-500 font-mono">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingCover(true);
                            try {
                              const { publicUrl } = await uploadImage({ bucket: 'post-images', file });
                              if (publicUrl) {
                                setFormData((prev: any) => ({ ...prev, coverImageUrl: publicUrl }));
                              }
                            } catch (err) {
                              console.error("Cover upload fail:", err);
                            } finally {
                              setIsUploadingCover(false);
                            }
                          }}
                        />
                        <span className="text-xs text-neutral-500 font-mono">Drag or click to attach cover</span>
                      </>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Calculated Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#1c1c1c] text-xs font-mono text-neutral-400">
              <div className="flex flex-col bg-[#141414] border border-[#222] p-2.5 rounded">
                <span className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Word Count</span>
                <span className="text-neutral-200 font-semibold mt-0.5">{getWordCount()} words</span>
              </div>
              <div className="flex flex-col bg-[#141414] border border-[#222] p-2.5 rounded">
                <span className="text-neutral-500 text-[10px] uppercase font-mono tracking-wider">Reading Time</span>
                <span className="text-neutral-200 font-semibold mt-0.5">~ {getReadingTime()} min read</span>
              </div>
            </div>

          </div>

          {/* Slideover actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1c1c1c]">
            {wasPublished && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Are you sure you want to unpublish this post? It will revert to draft status.')) {
                    await handleSavePost(true);
                  }
                }}
                disabled={saving}
                className="px-4 py-2 border border-red-900/50 hover:bg-red-950/30 text-red-500 text-xs font-sans uppercase rounded transition-colors mr-auto"
              >
                Unpublish
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#222] hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-sans uppercase rounded transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={async () => {
                if (formData.persona === 'unassigned' || !formData.persona) {
                  alert("Please assign a persona (builder, operator, thinker, wanderer) before publishing.");
                  return;
                }
                if (!formData.title?.trim() || getWordCount() === 0) {
                  alert("Cannot publish an empty post. Both title and content are required.");
                  return;
                }
                
                if (isCustomizingUrl) {
                  setUrlValidationError(null);
                  const result = await validateCustomSlug(customUrlVal, currentPostId, formData.persona);
                  if (!result.valid) {
                    setUrlValidationError(result.error || "Invalid slug.");
                    return;
                  }
                  setFormData((prev: any) => ({ ...prev, slug: result.cleanSlug }));
                }
                
                await handleSavePost(false);
              }}
              disabled={saving || formData.persona === 'unassigned'}
              className={`px-5 py-2 font-bold text-xs font-sans uppercase rounded flex items-center gap-1.5 transition-colors ${formData.persona === 'unassigned' ? 'bg-[#555] text-[#999] cursor-not-allowed' : 'bg-[#ff7700] hover:bg-[#ff881a] text-black'}`}
              id="drawer-confirm-publish-btn"
              title={formData.persona === 'unassigned' ? "Select a persona before publishing" : ""}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{wasPublished ? 'Updating...' : 'Publishing...'}</span>
                </>
              ) : (
                <span>{wasPublished ? 'Update Post' : 'Publish'}</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
