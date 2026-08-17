'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Star, ArrowUp, ArrowDown,
  Image as ImageIcon, LayoutTemplate, GripVertical, AlignLeft, AlignCenter,
  AlignRight, Maximize2, Check, RefreshCw, Loader2, Sparkles, FileText,
  Trash, ArrowUpCircle, ArrowDownCircle, Settings
} from 'lucide-react';
import Image from 'next/image';
import { MarkdownRenderer } from '@/components/mdx/MarkdownRenderer';
import { uploadImage, getRecentUploads } from '@/lib/supabase/storage';
import { UploadCloud, Clock } from 'lucide-react';
import { getPosts, createPost, updatePost, deletePost, hidePost, unhidePost, featurePost, unfeaturePost, revertPostToDraft, generatePostMetadataAction } from '@/app/admin/actions/posts.actions';
import { FormLabel, InlineError, ValidationSummary, parseDbError, InlineWarning } from '@/components/admin/validation';
import { parseToBlocks, compileFromBlocks } from '@/lib/block-serializer';

function formatToDatetimeLocal(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export default function PostPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [formData, setFormData] = useState<any>({"persona":"","title":"","subtitle":"","slug":"","excerpt":"","coverImageUrl":"","coverImageAlt":"","coverImageCaption":"","coverImageLocation":"","coverImageCredit":"","autoCoverImage":true,"content":"","tags":[],"publishedAt":"","featured":false,"hidden":false,"draft":false});

  const contentTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalData, setImageModalData] = useState({ src: '', alt: '', caption: '', location: '', credit: '', latitude: '', longitude: '' });

  // Custom navigation layout tabs
  const [activeTab, setActiveTab] = useState<'composer' | 'preview'>('composer');
  const previewMode = activeTab === 'preview';

  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAutoGenerateAI = async () => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const res = await generatePostMetadataAction({
        title: formData.title || '',
        content: formData.content || '',
        persona: formData.persona || 'builder',
      });
      if (res.success && res.data) {
        setFormData((prev: any) => ({
          ...prev,
          excerpt: res.data.excerpt,
          tags: res.data.tags,
        }));
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isDragOverTextarea, setIsDragOverTextarea] = useState(false);

  // Synchronized state for visual composer blocks
  const [composerBlocks, setComposerBlocks] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);


  const updateBlocksAndSync = (newBlocks: any[]) => {
    setComposerBlocks(newBlocks);
    const compiled = compileFromBlocks(newBlocks);
    setFormData(prev => ({ ...prev, content: compiled }));
  };

  const handleAddBlock = (type: 'text' | 'heading' | 'quote' | 'list' | 'image', initialContent = '', index?: number) => {
    const id = `blk_added_${Math.random().toString(36).substring(2, 6)}`;
    let newBlock: any;
    if (type === 'image') {
      newBlock = {
        id,
        type: 'image',
        src: '',
        alt: 'Image',
        caption: '',
        location: '',
        credit: '',
        align: 'center',
        isUploading: false,
        progress: 0,
      };
    } else if (type === 'heading') {
      newBlock = {
        id,
        type: 'heading',
        level: 2,
        content: initialContent || 'Heading Title',
      };
    } else if (type === 'quote') {
      newBlock = {
        id,
        type: 'quote',
        content: initialContent || 'A thoughtful quotation...',
      };
    } else if (type === 'list') {
      newBlock = {
        id,
        type: 'list',
        content: initialContent || '- List Item 1\\n- List Item 2',
      };
    } else {
      newBlock = {
        id,
        type: 'text',
        content: initialContent || 'Start typing paragraphs...',
      };
    }

    let updated = [...composerBlocks];
    if (typeof index === 'number') {
      updated.splice(index + 1, 0, newBlock);
    } else {
      updated.push(newBlock);
    }
    updateBlocksAndSync(updated);
    setSelectedBlockId(id);
  };

  const parseImageBlocks = (content: string) => {
    if (!content) return [];
    const regex = /<ImageBlock([\s\S]*?)\/>/g;
    const blocks: any[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const fullText = match[0];
      const index = match.index;
      const propsStr = match[1];

      const srcMatch = propsStr.match(/src="([^"]+)"/);
      const altMatch = propsStr.match(/alt="([^"]+)"/);
      const captionMatch = propsStr.match(/caption="([^"]+)"/);
      const locationMatch = propsStr.match(/location="([^"]+)"/);
      const alignMatch = propsStr.match(/align="([^"]+)"/);

      const src = srcMatch ? srcMatch[1] : '';
      const isUploading = src === 'uploading';
      const uploadIdMatch = propsStr.match(/uploadId="([^"]+)"/);
      const progressMatch = propsStr.match(/progress="([^"]+)"/);

      blocks.push({
        fullText,
        index,
        src,
        alt: altMatch ? altMatch[1] : (src ? src.split('/').pop() : 'inline image'),
        caption: captionMatch ? captionMatch[1] : '',
        location: locationMatch ? locationMatch[1] : '',
        align: alignMatch ? alignMatch[1] : 'center',
        isUploading,
        uploadId: uploadIdMatch ? uploadIdMatch[1] : '',
        progress: progressMatch ? Number(progressMatch[1]) : 0,
      });
    }
    return blocks;
  };

  const handleDragImageCardOverPostList = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
  };

  const handleDropImageCardOverPostList = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const originIdxStr = e.dataTransfer.getData('image-index');
    if (originIdxStr === '') return;
    const originIdx = parseInt(originIdxStr, 10);
    if (originIdx === targetIdx) return;

    const currentContent = formData.content || '';
    const blocks = parseImageBlocks(currentContent);
    if (originIdx >= blocks.length || targetIdx >= blocks.length) return;

    const originBlock = blocks[originIdx];
    const targetBlock = blocks[targetIdx];

    let newContent = currentContent;
    if (originBlock.index < targetBlock.index) {
      const beforeOrigin = currentContent.substring(0, originBlock.index);
      const betweenBlocks = currentContent.substring(originBlock.index + originBlock.fullText.length, targetBlock.index);
      const afterTarget = currentContent.substring(targetBlock.index + targetBlock.fullText.length);
      newContent = beforeOrigin + targetBlock.fullText + betweenBlocks + originBlock.fullText + afterTarget;
    } else {
      const beforeTarget = currentContent.substring(0, targetBlock.index);
      const betweenBlocks = currentContent.substring(targetBlock.index + targetBlock.fullText.length, originBlock.index);
      const afterOrigin = currentContent.substring(originBlock.index + originBlock.fullText.length);
      newContent = beforeTarget + originBlock.fullText + betweenBlocks + targetBlock.fullText + afterOrigin;
    }

    setFormData({ ...formData, content: newContent });
  };

  const handleMoveImageInText = (idx: number, direction: 'up' | 'down') => {
    const currentContent = formData.content || '';
    const blocks = parseImageBlocks(currentContent);
    if (idx < 0 || idx >= blocks.length) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const originBlock = blocks[idx];
    const targetBlock = blocks[targetIdx];

    let newContent = currentContent;
    if (idx < targetIdx) {
      const beforeOrigin = currentContent.substring(0, originBlock.index);
      const betweenBlocks = currentContent.substring(originBlock.index + originBlock.fullText.length, targetBlock.index);
      const afterTarget = currentContent.substring(targetBlock.index + targetBlock.fullText.length);
      newContent = beforeOrigin + targetBlock.fullText + betweenBlocks + originBlock.fullText + afterTarget;
    } else {
      const beforeTarget = currentContent.substring(0, targetBlock.index);
      const betweenBlocks = currentContent.substring(targetBlock.index + targetBlock.fullText.length, originBlock.index);
      const afterOrigin = currentContent.substring(originBlock.index + originBlock.fullText.length);
      newContent = beforeTarget + originBlock.fullText + betweenBlocks + targetBlock.fullText + afterOrigin;
    }

    setFormData({ ...formData, content: newContent });
  };

  const handleContentFilesUpload = async (files: FileList | File[], index?: number) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;

    // Create random target block ID
    const uploadId = 'upload_' + Math.random().toString(36).substr(2, 9);

    const newBlock = {
      id: uploadId,
      type: 'image',
      src: 'uploading',
      alt: file.name.split('.')[0] || 'Image',
      isUploading: true,
      progress: 0,
      align: 'center',
    };

    let updated = [...composerBlocks];
    const insertIdx = typeof index === 'number' ? index : updated.length - 1;
    if (insertIdx >= 0 && insertIdx < updated.length) {
      updated.splice(insertIdx + 1, 0, newBlock);
    } else {
      updated.push(newBlock);
    }
    setComposerBlocks(updated);
    setIsUploading(true);
    setUploadError('');

    // Periodic smooth progress update
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress > 94) {
        currentProgress = 94;
        clearInterval(progressInterval);
      }

      setComposerBlocks(prev =>
        prev.map(b => (b.id === uploadId ? { ...b, progress: currentProgress } : b))
      );
    }, 250);

    try {
      const { publicUrl } = await uploadImage({ bucket: 'post-images', file });
      clearInterval(progressInterval);

      setComposerBlocks(prev => {
        const next = prev.map(b => {
          if (b.id === uploadId) {
            return {
              ...b,
              src: publicUrl,
              isUploading: false,
              progress: 100,
            };
          }
          return b;
        });
        setFormData((fd: any) => ({ ...fd, content: compileFromBlocks(next) }));
        return next;
      });
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadError(err.message || String(err));

      setComposerBlocks(prev => {
        const next = prev.map(b => {
          if (b.id === uploadId) {
            return {
              ...b,
              isUploading: false,
              src: '',
              alt: `Upload failed: ${file.name}`,
            };
          }
          return b;
        });
        setFormData((fd: any) => ({ ...fd, content: compileFromBlocks(next) }));
        return next;
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDirectImageUploadClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleContentFilesUpload([file]);
      }
    };
    fileInput.click();
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    try {
        const { publicUrl } = await uploadImage({ bucket: 'post-images', file });
        setFormData({ ...formData, coverImageUrl: publicUrl });
    } catch (err: any) {
        setUploadError(err.message || String(err));
        alert('Upload Error: ' + err.message);
    } finally {
        setIsUploading(false);
    }
  };

  const handleUploadContentImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    try {
        const { publicUrl } = await uploadImage({ bucket: 'post-images', file });
        setImageModalData({ ...imageModalData, src: publicUrl });
    } catch (err: any) {
        setUploadError(err.message || String(err));
        alert('Upload Error: ' + err.message);
    } finally {
        setIsUploading(false);
    }
  };

  const insertImageBlock = () => {
    let text = '\\n<ImageBlock\\n  src="' + imageModalData.src + '"\\n  alt="' + imageModalData.alt + '"';
    if (imageModalData.caption) text += '\\n  caption="' + imageModalData.caption + '"';
    if (imageModalData.location) text += '\\n  location="' + imageModalData.location + '"';
    if (imageModalData.credit) text += '\\n  credit="' + imageModalData.credit + '"';
    if (imageModalData.latitude) text += '\\n  latitude="' + imageModalData.latitude + '"';
    if (imageModalData.longitude) text += '\\n  longitude="' + imageModalData.longitude + '"';
    text += '\\n/>\\n';

    if (contentTextareaRef.current) {
      const startPos = contentTextareaRef.current.selectionStart || 0;
      const endPos = contentTextareaRef.current.selectionEnd || 0;
      const currentContent = formData.content || '';
      const newContent = currentContent.substring(0, startPos) + text + currentContent.substring(endPos);
      setFormData({ ...formData, content: newContent });
    } else {
      setFormData({ ...formData, content: (formData.content || '') + text });
    }
    setShowImageModal(false);
    setImageModalData({ src: '', alt: '', caption: '', location: '', credit: '', latitude: '', longitude: '' });
  };

  // Drag states for Visual Composer
  const [draggingBlockIdx, setDraggingBlockIdx] = useState<number | null>(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState<number | null>(null);

  const handleAlignBlock = (blockId: string, align: 'left' | 'center' | 'right' | 'full') => {
    const updated = composerBlocks.map(b => {
      if (b.id === blockId) {
        return { ...b, align };
      }
      return b;
    });
    updateBlocksAndSync(updated);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updated = composerBlocks.filter(b => b.id !== blockId);
    updateBlocksAndSync(updated);
  };

  const handleUpdateBlockCaption = (blockId: string, caption: string) => {
    const updated = composerBlocks.map(b => {
      if (b.id === blockId) {
        return { ...b, caption };
      }
      return b;
    });
    updateBlocksAndSync(updated);
  };

  const handleUpdateBlockLocation = (blockId: string, location: string) => {
    const updated = composerBlocks.map(b => {
      if (b.id === blockId) {
        return { ...b, location };
      }
      return b;
    });
    updateBlocksAndSync(updated);
  };

  const handleUpdateBlockCredit = (blockId: string, credit: string) => {
    const updated = composerBlocks.map(b => {
      if (b.id === blockId) {
        return { ...b, credit };
      }
      return b;
    });
    updateBlocksAndSync(updated);
  };

  const handleBlockDrop = (targetIdx: number) => {
    if (draggingBlockIdx === null) return;
    const reordered = [...composerBlocks];
    const [dragged] = reordered.splice(draggingBlockIdx, 1);
    reordered.splice(targetIdx, 0, dragged);
    updateBlocksAndSync(reordered);
    setDraggingBlockIdx(null);
    setDragOverBlockIdx(null);
  };

  const loadData = async () => {
    const response = await getPosts();
    if (response.success) {
      setItems(response.data || []);
    } else {
      setDbError("error" in response ? response.error : "Error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setDbError(null);
    setFormData({"persona":"","title":"","subtitle":"","slug":"","excerpt":"","coverImageUrl":"","coverImageAlt":"","coverImageCaption":"","coverImageLocation":"","coverImageCredit":"","autoCoverImage":true,"content":"","tags":[],"publishedAt":"","featured":false,"hidden":false,"draft":false});
    setComposerBlocks([
      { id: 'first_para', type: 'text', content: '' }
    ]);
    setShowValidation(false);
    setIsEditing(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id || item.persona || 'none');
    setDbError(null);
    setFormData(item);
    setComposerBlocks(parseToBlocks(item.content || ''));
    setShowValidation(false);
    setIsEditing(true);
  };

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'unsaved'>('idle');
  const lastSavedData = React.useRef<any>(null);

  const extractCoverImage = (payload: any) => {
    if (payload.autoCoverImage && payload.content) {
      const match = payload.content.match(/<ImageBlock([^>]*)>/);
      if (match) {
        const propsStr = match[1];
        const src = propsStr.match(/src="([^"]+)"/);
        const alt = propsStr.match(/alt="([^"]+)"/);
        const caption = propsStr.match(/caption="([^"]+)"/);
        const location = propsStr.match(/location="([^"]+)"/);
        const credit = propsStr.match(/credit="([^"]+)"/);

        if (src && !payload.coverImageUrl) payload.coverImageUrl = src[1];
        if (alt && !payload.coverImageAlt) payload.coverImageAlt = alt[1];
        if (caption && !payload.coverImageCaption) payload.coverImageCaption = caption[1];
        if (location && !payload.coverImageLocation) payload.coverImageLocation = location[1];
        if (credit && !payload.coverImageCredit) payload.coverImageCredit = credit[1];
      }
    }
    return payload;
  };

  useEffect(() => {
    if (!isEditing) return;

    // Check if form changed
    const currentDataStr = JSON.stringify(formData);
    const lastSavedDataStr = JSON.stringify(lastSavedData.current);

    if (currentDataStr === lastSavedDataStr || !lastSavedData.current) return;

    setSaveState('unsaved');
    setDbError(null);
  }, [formData, isEditing]);

  const errors: Record<string, string> = {};
  if (!formData.persona?.trim()) {
    errors.persona = "Persona context is required (e.g. wanderer, builder).";
  }
  if (!formData.title?.trim()) {
    errors.title = "Post Title is required.";
  }
  if (!formData.slug?.trim()) {
    errors.slug = "Post Slug URL is required.";
  }
  if (!formData.content?.trim()) {
    errors.content = "Post Content body is required.";
  }

  const hasImagePattern = /<ImageBlock[\s\S]*?\/>/.test(formData.content || '');
  if (formData.content && hasImagePattern) {
    const srcMatch = formData.content.match(/src="([^"]+)"/);
    const altMatch = formData.content.match(/alt="([^"]+)"/);
    if (!srcMatch || !srcMatch[1]) {
      errors.content = 'Found ImageBlock tag in Content without src parameter.';
    } else if (!altMatch || !altMatch[1]) {
      errors.content = 'Found ImageBlock tag in Content without alt parameter.';
    }
  }

  const warnings: string[] = [];
  if (!formData.coverImageUrl?.trim()) {
    warnings.push("Post is missing a cover image location/URL. Adding one enhances search cards.");
  }
  if (!formData.excerpt?.trim()) {
    warnings.push("Post is missing an excerpt. Excerpts act as subtitles in feed displays.");
  }
  if (!formData.tags || formData.tags.length === 0 || (formData.tags.length === 1 && !formData.tags[0])) {
    warnings.push("No tags are listed. Tags aggregate search capabilities across subjects.");
  }

  const isValid = Object.keys(errors).length === 0;

  const handlePublish = async () => {
    setShowValidation(true);
    if (!isValid) return;
    setDbError(null);

    let payload = extractCoverImage({ ...formData, status: 'published', draft: false });
    if (!payload.publishedAt) {
      payload.publishedAt = new Date().toISOString();
    }

    try {
      setSaveState('saving');
      if (editingId && editingId !== 'none') {
        const res = await updatePost(editingId, payload);
        if (!res.success) throw new Error("error" in res ? res.error : "Error");
        lastSavedData.current = res.data;
      } else {
        const res = await createPost(payload);
        if (!res.success) throw new Error("error" in res ? res.error : "Error");
        lastSavedData.current = res.data;
      }
      setIsEditing(false);
      setSaveState('idle');
      loadData();
    } catch (err: any) {
      setSaveState('error');
      setDbError(parseDbError(err) || "Failed to publish");
    }
  };

  const handleSaveDraftManual = async () => {
    setDbError(null);
    let payload = extractCoverImage({ ...formData, draft: true });

    if (!payload.slug && payload.title) {
        payload.slug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    try {
      setSaveState('saving');
      if (editingId && editingId !== 'none') {
        const res = await updatePost(editingId, payload);
        if (!res.success) throw new Error("error" in res ? res.error : "Error");
        lastSavedData.current = res.data;
        setFormData(res.data);
      } else {
        const res = await createPost(payload);
        if (!res.success) throw new Error("error" in res ? res.error : "Error");
        if (res.data) {
          setEditingId(res.data.id);
          lastSavedData.current = res.data;
          setFormData(res.data);
        }
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      loadData();
    } catch (err: any) {
      setSaveState('error');
      setDbError(parseDbError(err) || "Failed to save draft");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deletePost(id);
      if (editingId === id) setIsEditing(false);
      loadData();
    }
  };

  const toggleVisibility = async (item: any) => {
    const isCurrentlyHidden = item.hidden === true;
    if (isCurrentlyHidden) {
      await unhidePost(item.id || item.persona);
    } else {
      await hidePost(item.id || item.persona);
    }
    loadData();
  };

  const toggleFeature = async (item: any) => {
    if (item.featured) {
      await unfeaturePost(item.id || item.persona);
    } else {
      await featurePost(item.id || item.persona);
    }
    loadData();
  };

  const handleRevertToDraft = async (item: any) => {
    if (confirm('Are you sure you want to revert this post to draft? It will no longer be visible to the public.')) {
      await revertPostToDraft(item.id || item.persona);
      loadData();
    }
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">Posts</h1>
          <p className="text-neutral-500 text-sm">Manage publications and articles for the site.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-neutral-100 text-black px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition-colors flex items-center justify-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Item
        </button>
      </div>

      <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0A0A0A]">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono w-[80%]">Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-500 font-semibold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-[#161616] group transition-colors">
                  <td className="px-6 py-4">

                    <div className="flex flex-col gap-1.5">
                      <p className="font-medium text-neutral-200 text-sm pr-4 line-clamp-1">{String(item['title'] || item['persona'] || 'Unnamed Item')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(item.hidden === true) && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-[#ff7700]/10 text-[#ff7700]">Hidden</span>}
                        {(item.hidden === false) && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-emerald-500/10 text-emerald-500">Visible</span>}
                        {item.featured && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-amber-400/10 text-amber-400">Featured</span>}
                        {item.status === 'draft' && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-neutral-500/10 text-neutral-400">Draft</span>}
                        {item.status === 'published' && <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold bg-blue-500/10 text-blue-400">Published</span>}
                      </div>
                    </div>

                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.status === 'published' && (
                        <button onClick={() => handleRevertToDraft(item)} className="p-1.5 text-neutral-500 hover:text-amber-500 hover:bg-[#222] rounded transition-colors" title="Revert to Draft">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => toggleFeature(item)} className={`p-1.5 rounded transition-colors ${item.featured ? 'text-amber-400 hover:bg-amber-400/10' : 'text-neutral-500 hover:text-white hover:bg-[#222]'}`} title="Toggle Feature"><Star className="w-4 h-4" /></button>
                      <button onClick={() => toggleVisibility(item)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Toggle Visibility">{item.hidden === true ? <EyeOff className="w-4 h-4 text-neutral-600" /> : <Eye className="w-4 h-4" />}</button>
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-[#222] rounded transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id || item.persona)} className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-[#222] rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && (
        <div className="mt-12 border-t border-[#1a1a1a] pt-12">
          {showValidation && Object.keys(errors).length > 0 && isEditing && (
            <ValidationSummary errors={errors} warnings={warnings} title="Invalid Post Entry" />
          )}

          {dbError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs rounded-md">
              ⚠️ {dbError}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium tracking-tight text-neutral-100 flex items-center gap-3">
              {editingId ? 'Edit Item' : 'New Item'}
              {isEditing && (
                <div className="flex items-center gap-2 text-xs font-mono ml-4">
                  {saveState === 'saving' && <span className="text-amber-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
                  {saveState === 'saved' && <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3"/> Saved automatically</span>}
                  {saveState === 'unsaved' && <span className="text-neutral-400 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Unsaved changes</span>}
                  {saveState === 'error' && <span className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3"/> Save failed</span>}
                </div>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#111111] text-neutral-300 hover:bg-[#1a1a1a] border border-[#222]"
              >
                Close
              </button>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraftManual}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#222] text-white hover:bg-[#333] cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handlePublish}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 bg-[#FF8E53] text-black hover:bg-[#FF8E53]/90 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Publish
                  </button>
                </div>
                {showValidation && !isValid && (
                  <span className="text-[10px] text-rose-400 font-mono">Complete required fields to publish.</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111111] p-6 rounded-lg border border-[#1a1a1a]">

              <div>
                <FormLabel label="Persona" required />
                <input
                  type="text"
                  value={formData.persona || ''}
                  onChange={(e) => setFormData({...formData, persona: e.target.value})}
                  placeholder="e.g. wanderer, builder, operator"
                  className={`w-full bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 ${
                    showValidation && !formData.persona?.trim() ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                />
                <InlineError message={showValidation && !formData.persona?.trim() ? 'Persona context is required.' : undefined} />
              </div>
              <div>
                <FormLabel label="Title" required />
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 ${
                    showValidation && !formData.title?.trim() ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                />
                <InlineError message={showValidation && !formData.title?.trim() ? 'Post Title is required.' : undefined} />
              </div>
              <div>
                <FormLabel label="Subtitle" />
                <input type="text" value={formData.subtitle || ''} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <FormLabel label="Slug" required />
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="e.g. my-first-entry"
                  className={`w-full bg-[#161616] border rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 ${
                    showValidation && !formData.slug?.trim() ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#222]'
                  }`}
                />
                <InlineError message={showValidation && !formData.slug?.trim() ? 'Post Slug is required.' : undefined} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel label="Excerpt" />
                  <button
                    type="button"
                    onClick={handleAutoGenerateAI}
                    disabled={isGeneratingAI}
                    className="text-[10px] text-[#ff7700] hover:text-[#ff9933] font-mono uppercase tracking-wider flex items-center gap-1 disabled:opacity-50 transition-colors"
                    title="Auto-generate summary and tags with AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGeneratingAI ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea value={formData.excerpt || ''} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} className="w-full h-32 bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 resize-none"></textarea>
                <InlineWarning message={!formData.excerpt?.trim() ? 'Excerpts are optional but recommended as summaries in lists.' : undefined} />
              </div>
              <div>
                <FormLabel label="Cover Image URL" />
                <div className="flex gap-2">
                  <input type="text" value={formData.coverImageUrl || ''} onChange={(e) => setFormData({...formData, coverImageUrl: e.target.value})} className="flex-1 w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
                  <label className="bg-[#222] hover:bg-[#333] transition-colors border border-[#333] cursor-pointer flex items-center justify-center px-4 rounded-md text-sm text-white" title="Upload cover image">
                    {isUploading ? <span className="animate-pulse">...</span> : <UploadCloud className="w-4 h-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadCover} disabled={isUploading} />
                  </label>
                </div>
                <InlineWarning message={!formData.coverImageUrl?.trim() ? 'Cover Image is missing. Enter a cover image URL for rich cards.' : undefined} />
              </div>
              <div>
                <FormLabel label="Cover Image Alt Text" />
                <input type="text" value={formData.coverImageAlt || ''} onChange={(e) => setFormData({...formData, coverImageAlt: e.target.value})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <FormLabel label="Cover Image Caption" />
                <input type="text" value={formData.coverImageCaption || ''} onChange={(e) => setFormData({...formData, coverImageCaption: e.target.value})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <FormLabel label="Cover Image Location" />
                <input type="text" value={formData.coverImageLocation || ''} onChange={(e) => setFormData({...formData, coverImageLocation: e.target.value})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <FormLabel label="Cover Image Credit" />
                <input type="text" value={formData.coverImageCredit || ''} onChange={(e) => setFormData({...formData, coverImageCredit: e.target.value})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <FormLabel label="Auto Cover Image" />
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.autoCoverImage || false} onChange={(e) => setFormData({...formData, autoCoverImage: e.target.checked})} className="bg-[#161616] border-[#222] rounded" /><span className="text-sm text-neutral-400">Generate cover image from first image in content</span></div>
              </div>
           <div className="col-span-1 md:col-span-2">
  {/* Modern simplified layout header */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 pt-4 border-t border-[#1d1d1d]">
    <FormLabel label="Post Content" required className="mb-0 text-neutral-300 font-medium" />
    <div className="flex items-center bg-[#111111] p-1 rounded-lg border border-[#222] self-stretch sm:self-auto gap-0.5">
      <button
        type="button"
        onClick={() => setActiveTab('composer')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
          activeTab === 'composer' ? 'bg-[#FF8E53]/10 text-[#FF8E53] border border-[#A66039]/35' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Editor
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('preview')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
          activeTab === 'preview' ? 'bg-[#1e1e1e] text-white border border-[#333]' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        Preview
      </button>
    </div>
  </div>

  <div className="grid grid-cols-1 gap-6">
    {/* Visual composer body */}
    {activeTab === 'composer' && (
      <div
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleContentFilesUpload(e.dataTransfer.files, composerBlocks.length - 1);
          }
        }}
        className="w-full min-h-150[#0c0c0c] border border-[#222] rounded-lg p-6 sm:p-8 space-y-6 overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#181818] mb-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-mono text-[#FF8E53] font-bold">Post Editor</h4>
            <p className="text-[10px] text-neutral-500 mt-1">Structure your story with paragraphs, headings, blockquotes, lists, and drag-and-drop media.</p>
          </div>
          <button
            type="button"
            onClick={handleDirectImageUploadClick}
            className="text-[11px] bg-[#FF8E53]/10 hover:bg-[#FF8E53]/20 text-[#FF8E53] px-3 py-2 rounded border border-[#A66039]/30 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Upload Image
          </button>
        </div>

        {composerBlocks.length === 0 && (
          <div className="h-75er border-dashed border-[#222] rounded-lg flex flex-col items-center justify-center text-center p-6 bg-[#0a0a0a]">
            <Sparkles className="w-8 h-8 text-neutral-700 animate-pulse mb-3" />
            <h5 className="text-xs font-semibold text-neutral-400">Post body is empty</h5>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">Click one of the buttons below to begin formatting your article.</p>
          </div>
        )}

        <div className="space-y-5 relative">
          {composerBlocks.map((block, idx) => {
            const isSelected = selectedBlockId === block.id;

            // Heading block
            if (block.type === 'heading') {
              return (
                <div
                  key={block.id}
                  className="relative group/block border border-transparent hover:border-neutral-800 rounded-lg p-4 pl-10 transition-colors bg-[#111] bg-opacity-40"
                >
                  <div className="absolute left-3 top-4 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col gap-1">
                    <GripVertical className="w-4 h-4 text-neutral-500" />
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase font-bold text-[#FF8E53] bg-[#FF8E53]/10 px-1.5 py-0.5 rounded">
                        Heading
                      </span>
                      <div className="flex gap-1 bg-black/40 p-0.5 rounded border border-neutral-800">
                        {[1, 2, 3].map((lv) => (
                          <button
                            type="button"
                            key={lv}
                            onClick={() => {
                              const newBlocks = [...composerBlocks];
                              newBlocks[idx] = { ...block, level: lv };
                              updateBlocksAndSync(newBlocks);
                            }}
                            className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer ${
                              block.level === lv ? 'bg-[#FF8E53] text-black font-bold' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            H{lv}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            setDraggingBlockIdx(idx);
                            handleBlockDrop(idx - 1);
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      >
                        ▲ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < composerBlocks.length - 1) {
                            setDraggingBlockIdx(idx);
                            handleBlockDrop(idx + 1);
                          }
                        }}
                        disabled={idx === composerBlocks.length - 1}
                        className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      >
                        ▼ Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-neutral-500 hover:text-rose-450 p-1 rounded hover:bg-neutral-900 transition-colors"
                        title="Delete Heading"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => {
                      const newBlocks = [...composerBlocks];
                      newBlocks[idx] = { ...block, content: e.target.value };
                      updateBlocksAndSync(newBlocks);
                    }}
                    placeholder="Heading Title..."
                    className={`w-full bg-transparent border-none text-white focus:outline-none focus:ring-0 p-0 font-sans tracking-tight font-semibold ${
                      block.level === 1 ? 'text-2xl' : block.level === 2 ? 'text-xl' : 'text-lg'
                    }`}
                  />
                </div>
              );
            }

            // Quote block
            if (block.type === 'quote') {
              return (
                <div
                  key={block.id}
                  className="relative group/block border border-transparent hover:border-neutral-800 rounded-lg p-4 pl-10 transition-colors bg-[#111] bg-opacity-40"
                >
                  <div className="absolute left-3 top-4 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col gap-1">
                    <GripVertical className="w-4 h-4 text-neutral-500" />
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono uppercase font-bold text-[#FF8E53] bg-[#FF8E53]/10 px-1.5 py-0.5 rounded">
                      Blockquote
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            setDraggingBlockIdx(idx);
                            handleBlockDrop(idx - 1);
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      >
                        ▲ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < composerBlocks.length - 1) {
                            setDraggingBlockIdx(idx);
                            handleBlockDrop(idx + 1);
                          }
                        }}
                        disabled={idx === composerBlocks.length - 1}
                        className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      >
                        ▼ Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-neutral-500 hover:text-rose-450 p-1 rounded hover:bg-neutral-900 transition-colors"
                        title="Delete Quote"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="border-l-3 border-[#FF8E53] pl-4 italic bg-black/20 py-2.5 pr-2 rounded-r-md">
                    <textarea
                      value={block.content}
                      onChange={(e) => {
                        const newBlocks = [...composerBlocks];
                        newBlocks[idx] = { ...block, content: e.target.value };
                        updateBlocksAndSync(newBlocks);
                      }}
                      placeholder="Insightful quote text..."
                      rows={2}
                      className="w-full bg-transparent border-none text-neutral-200 text-sm leading-relaxed resize-y focus:outline-none focus:ring-0 p-0 font-serif"
                    />
                  </div>
                </div>
              );
            }

            // List block
            if (block.type === 'list') {
              return (
                <div
                  key={block.id}
                  className="relative group/block border border-transparent hover:border-neutral-800 rounded-lg p-4 pl-10 transition-colors bg-[#111] bg-opacity-40"
                >
                  <div className="absolute left-3 top-4 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col gap-1">
                    <GripVertical className="w-4 h-4 text-neutral-500" />
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono uppercase font-bold text-[#FF8E53] bg-[#FF8E53]/10 px-1.5 py-0.5 rounded">
                      List Block
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            setDraggingBlockIdx(idx);
                            handleBlockDrop(idx - 1);
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      >
                        ▲ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < composerBlocks.length - 1) {
                            setDraggingBlockIdx(idx);
                            handleBlockDrop(idx + 1);
                          }
                        }}
                        disabled={idx === composerBlocks.length - 1}
                        className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      >
                        ▼ Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-neutral-500 hover:text-rose-450 p-1 rounded hover:bg-neutral-900 transition-colors"
                        title="Delete List"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={block.content}
                    onChange={(e) => {
                      const newBlocks = [...composerBlocks];
                      newBlocks[idx] = { ...block, content: e.target.value };
                      updateBlocksAndSync(newBlocks);
                    }}
                    placeholder="- List Item 1&#10;- List Item 2"
                    rows={Math.max(2, block.content.split('\\n').length)}
                    className="w-full bg-[#161616] border border-[#222] rounded px-3 py-2 text-neutral-300 text-xs leading-relaxed resize-y focus:outline-none focus:border-neutral-500 font-mono"
                  />
                </div>
              );
            }

            // Video/Image block code structure
            if (block.type === 'image') {
              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                  className={`group/img relative border rounded-lg p-4 transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-[#FF8E53] bg-[#1a1411]'
                      : dragOverBlockIdx === idx
                        ? 'border-[#FF8E53] bg-[#FF8E53]/5 scale-[1.01]'
                        : 'border-neutral-800 bg-[#0e0e0e] hover:border-neutral-700'
                  } ${
                    block.align === 'left' ? 'max-w-md mr-auto' :
                    block.align === 'right' ? 'max-w-md ml-auto' :
                    block.align === 'full' ? 'w-full' : 'max-w-xl mx-auto'
                  }`}
                >
                  <div className="absolute left-3 top-3 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-black/85 p-1 rounded backdrop-blur">
                    <GripVertical className="w-3.5 h-3.5 text-neutral-400 cursor-grab" />
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">Image Content</span>
                  </div>

                  <div className="absolute right-3 top-3 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx > 0) {
                          setDraggingBlockIdx(idx);
                          handleBlockDrop(idx - 1);
                        }
                      }}
                      disabled={idx === 0}
                      className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      title="Move up"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx < composerBlocks.length - 1) {
                          setDraggingBlockIdx(idx);
                          handleBlockDrop(idx + 1);
                        }
                      }}
                      disabled={idx === composerBlocks.length - 1}
                      className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                      title="Move down"
                    >
                      ▼ Down
                    </button>
                  </div>

                  {isSelected && (
                    <div
                      className="absolute -top-5 left-1/2 -track-x-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-[#161616] border border-[#2d2d2d] rounded-full shadow-2xl z-30 transition-all duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleAlignBlock(block.id, 'left')}
                        className={`p-1 rounded-full transition-colors ${block.align === 'left' ? 'bg-[#FF8E53] text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
                        title="Float Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignBlock(block.id, 'center')}
                        className={`p-1 rounded-full transition-colors ${block.align === 'center' ? 'bg-[#FF8E53] text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
                        title="Centered Align"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignBlock(block.id, 'right')}
                        className={`p-1 rounded-full transition-colors ${block.align === 'right' ? 'bg-[#FF8E53] text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
                        title="Float Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlignBlock(block.id, 'full')}
                        className={`p-1 rounded-full transition-colors ${block.align === 'full' ? 'bg-[#FF8E53] text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
                        title="Full Width Banner"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3.5 bg-neutral-800 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-1 rounded-full text-rose-450 hover:text-rose-300"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="relative w-full aspect-video rounded overflow-hidden bg-[#080808] border border-neutral-900 flex items-center justify-center">
                    {block.isUploading ? (
                      <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-[#0d0d0d]">
                        <Loader2 className="w-6 h-6 text-[#FF8E53] animate-spin mb-3" />
                        <div className="w-40 bg-[#161616] h-1 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-linear-to-r from-[#A66039] to-[#FF8E53] h-full transition-all duration-300"
                            style={{ width: `${block.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 animate-pulse">Uploading... {block.progress}%</span>
                      </div>
                    ) : (
                      <React.Fragment>
                        <Image
                          src={block.src || 'https://picsum.photos/seed/placeholder/800/450'}
                          alt={block.alt}
                          fill
                          className="object-cover pointer-events-none"
                          referrerPolicy="no-referrer"
                          unoptimized={!block.src}
                        />
                      </React.Fragment>
                    )}
                  </div>

                  {!block.isUploading && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Add caption..."
                        value={block.caption || ''}
                        onChange={(e) => handleUpdateBlockCaption(block.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-center bg-transparent border-none font-serif text-xs italic text-neutral-300 focus:outline-none focus:text-white py-0.5"
                      />
                      <div className="flex justify-center gap-3">
                        <input
                          type="text"
                          placeholder="📍 Add Location..."
                          value={block.location || ''}
                          onChange={(e) => handleUpdateBlockLocation(block.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-none text-[10px] text-center text-neutral-500 focus:text-neutral-400 focus:outline-none w-24"
                        />
                        <input
                          type="text"
                          placeholder="📷 Add Credit..."
                          value={block.credit || ''}
                          onChange={(e) => handleUpdateBlockCredit(block.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-none text-[10px] text-center text-neutral-500 focus:text-neutral-400 focus:outline-none w-24"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Paragraph block default
            return (
              <div
                key={block.id}
                className="relative group/block border border-transparent hover:border-neutral-800 rounded-lg p-4 pl-10 transition-colors bg-[#111] bg-opacity-40"
              >
                <div className="absolute left-3 top-5 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col gap-1">
                  <GripVertical className="w-4 h-4 text-neutral-500" />
                </div>

                <div className="flex items-center justify-between gap-3 mb-1.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
                  <span className="text-[9px] font-mono text-neutral-550 uppercase tracking-wider">Paragraph</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (idx > 0) {
                          setDraggingBlockIdx(idx);
                          handleBlockDrop(idx - 1);
                        }
                      }}
                      disabled={idx === 0}
                      className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx < composerBlocks.length - 1) {
                          setDraggingBlockIdx(idx);
                          handleBlockDrop(idx + 1);
                        }
                      }}
                      disabled={idx === composerBlocks.length - 1}
                      className="p-1 px-1.5 rounded bg-[#161616] hover:bg-[#222] border border-neutral-850 text-[9px] font-mono text-neutral-400 disabled:opacity-25"
                    >
                      ▼ Down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-neutral-500 hover:text-rose-450 p-1 rounded hover:bg-neutral-900 transition-colors"
                      title="Delete Paragraph"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={block.content}
                  onChange={(e) => {
                    const newBlocks = [...composerBlocks];
                    newBlocks[idx] = { ...block, content: e.target.value };
                    updateBlocksAndSync(newBlocks);
                  }}
                  placeholder="Tell your story. Start writing seamlessly here..."
                  rows={Math.max(2, block.content.split('\\n').length)}
                  className="w-full bg-transparent border-none text-neutral-200 text-sm leading-relaxed resize-none focus:outline-none focus:ring-0 p-0 font-sans"
                />
              </div>
            );
          })}
        </div>

        {/* Elegant addition toolbar at the bottom */}
        <div className="pt-8 border-t border-neutral-900 mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleAddBlock('text')}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#1a1a1a] text-xs font-semibold text-neutral-250 rounded-lg border border-[#222] hover:border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-400" /> Text Paragraph
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('heading')}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#1a1a1a] text-xs font-semibold text-neutral-250 rounded-lg border border-[#222] hover:border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-400" /> Heading Accent
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('quote')}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#1a1a1a] text-xs font-semibold text-neutral-250 rounded-lg border border-[#222] hover:border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-400" /> Blockquote
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('list')}
            className="px-4 py-2.5 bg-[#141414] hover:bg-[#1a1a1a] text-xs font-semibold text-neutral-250 rounded-lg border border-[#222] hover:border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-400" /> Bullet List
          </button>
          <button
            type="button"
            onClick={handleDirectImageUploadClick}
            className="px-4 py-2.5 bg-[#FF8E53]/10 hover:bg-[#FF8E53]/20 text-xs font-bold text-[#FF8E53] rounded-lg border border-[#FF8E53]/30 hover:border-[#FF8E53]/60 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Upload Image Block
          </button>
        </div>
      </div>
    )}

    {/* Live preview */}
    {activeTab === 'preview' && (
      <div className="w-full min-h-137.5 bg-[#0a0a0a] border border-[#222] rounded-lg p-6 sm:p-8 overflow-y-auto">
        <MarkdownRenderer content={compileFromBlocks(composerBlocks)} />
      </div>
    )}
  </div>

  <InlineError message={showValidation && !formData.content?.trim() ? 'Post Content body is required. Add at least one block.' : undefined} />
</div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FormLabel label="Tags (comma separated)" />
                  <button
                    type="button"
                    onClick={handleAutoGenerateAI}
                    disabled={isGeneratingAI}
                    className="text-[10px] text-[#ff7700] hover:text-[#ff9933] font-mono uppercase tracking-wider flex items-center gap-1 disabled:opacity-50 transition-colors"
                    title="Auto-generate tags and summary with AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isGeneratingAI ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <input type="text" value={(formData.tags || []).join(', ')} onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(s=>s.trim())})} className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" />
                <InlineWarning message={(!formData.tags || formData.tags.length === 0 || (formData.tags.length === 1 && !formData.tags[0])) ? "No tags are listed. Tags aggregate search capabilities across subjects." : undefined} />
              </div>
              <div>
                <FormLabel label="Featured" />
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.featured || false} onChange={(e) => setFormData({...formData, featured: e.target.checked})} className="bg-[#161616] border-[#222] rounded" /></div>
              </div>
              <div>
                <FormLabel label="Hidden" />
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.hidden || false} onChange={(e) => setFormData({...formData, hidden: e.target.checked})} className="bg-[#161616] border-[#222] rounded" /></div>
              </div>
              <div>
                <FormLabel label="Draft" />
                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.status === 'draft' || false} onChange={(e) => setFormData({...formData, status: e.target.checked ? 'draft' : 'published'})} className="bg-[#161616] border-[#222] rounded" /></div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
