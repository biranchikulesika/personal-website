import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Send, X, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { uploadImage } from '@/lib/supabase/storage';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { generatePostMetadataAction } from '@/app/admin/actions/posts.actions';

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

  const handleGenerateAI = useCallback(async (override = false) => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const res = await generatePostMetadataAction({
        title: formData.title || '',
        content: richTextContent || '',
        persona: formData.persona || 'builder',
      });
      if (res.success && res.data) {
        if (override || !formData.excerpt || formData.excerpt.trim() === '') {
          setFormData((prev: any) => ({ ...prev, excerpt: res.data.excerpt }));
        }
        if (override || !pasteTagsText || pasteTagsText.trim() === '') {
          setPasteTagsText(res.data.tags.join(', '));
          setFormData((prev: any) => ({ ...prev, tags: res.data.tags }));
        }
      }
    } catch (e) {
      console.error('AI metadata generation error:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [formData.title, formData.persona, formData.excerpt, richTextContent, pasteTagsText, isGeneratingAI, setFormData, setPasteTagsText]);

  // Auto-generate on drawer open if summary or tags are empty and content exists
  useEffect(() => {
    if (isOpen && (!formData.excerpt?.trim() || !pasteTagsText?.trim()) && (richTextContent?.trim() || formData.title?.trim())) {
      handleGenerateAI(false);
    }
  }, [isOpen, formData.excerpt, pasteTagsText, richTextContent, formData.title, handleGenerateAI]);

  // Focus trap
  const { containerRef: drawerRef } = useFocusTrap<HTMLDivElement>({
    active: isOpen,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  // Merge refs: attach focus trap ref alongside the existing setup
  const setDrawerRef = (el: HTMLDivElement | null) => {
    drawerRef.current = el;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-end p-0 z-50 animate-in fade-in duration-200">
      <div 
        ref={setDrawerRef}
        className="bg-[#0c0c0c] border-l border-[#1c1c1c] max-w-lg w-full h-full p-6 md:p-8 flex flex-col justify-between text-neutral-300 relative shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        id="publishing-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Publish settings"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#1c1c1c]">
            <h2 className="text-xl font-bold font-sans text-white tracking-widest flex items-center gap-2.5">
              <Send className="w-4 h-4" />
              <span>PUBLISH ARTICLE</span>
            </h2>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-[#1a1a1a] rounded text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Contents representing Publish Options */}
          <div className="flex-1 overflow-y-auto py-6 pr-2 space-y-6">
            
            {/* Persona Selector */}
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

            {/* Manual Cover Upload for Display Only (if desired over smart extract) */}
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

            {/* Custom Excerpt Summary Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500">Summary / Excerpt</label>
                  {isGeneratingAI && (
                    <span className="flex items-center gap-1 text-[9px] text-[#ff7700] font-mono animate-pulse">
                      <Sparkles className="w-2.5 h-2.5 animate-spin" />
                      AI Generating...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleGenerateAI(true)}
                    disabled={isGeneratingAI}
                    className="text-[9px] text-[#ff7700] hover:text-[#ff9933] font-mono tracking-wider uppercase flex items-center gap-1 disabled:opacity-50 transition-colors"
                    title="Auto-generate summary with AI"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    [AI Generate]
                  </button>
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
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
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

            {/* Tags Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] uppercase font-mono tracking-widest font-semibold text-neutral-500">Suggested Tags</label>
                <button 
                  type="button"
                  onClick={() => handleGenerateAI(true)}
                  disabled={isGeneratingAI}
                  className="text-[9px] text-[#ff7700] hover:text-[#ff9933] font-mono tracking-wider uppercase flex items-center gap-1 disabled:opacity-50 transition-colors"
                  title="Auto-generate tags with AI"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  [AI Tags]
                </button>
              </div>
              <input 
                type="text" 
                value={pasteTagsText}
                onChange={(e) => setPasteTagsText(e.target.value)}
                placeholder="tech, architecture, philosophy"
                className="w-full bg-[#141414] border border-[#222] focus:border-[#ff7700] rounded px-3 py-2 text-xs font-mono text-neutral-300 outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">Separate tags with commas.</p>
            </div>

            {/* URL Customizable slugs */}
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
