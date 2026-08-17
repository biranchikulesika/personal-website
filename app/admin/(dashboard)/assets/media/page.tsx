'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getRecentUploads, uploadImage, deleteImage, StorageBucket
} from '@/lib/supabase/storage';
import {
  runImageCleanupAction,
  getStorageHealthSummaryAction,
  getRecentCleanupLogsAction
} from '@/app/admin/actions/storage.actions';
import {
  UploadCloud, Trash2, Copy, ImageIcon, CheckCircle,
  ExternalLink, ShieldCheck, RefreshCw, AlertTriangle, Play, Sparkles
} from 'lucide-react';
import { MediaGridSkeleton } from '@/components/ui/skeletons';

export default function MediaAssetsPage() {
  const [activeBucket, setActiveBucket] = useState<StorageBucket>('post-images');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Storage Health & Cleanup State
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setUploadError('');
    try {
      const list = await getRecentUploads(activeBucket, 40);
      setFiles(list || []);
    } catch (e) {
      console.error('Error fetching bucket uploads: ', e);
    } finally {
      setLoading(false);
    }
  }, [activeBucket]);

  const loadHealthSummary = useCallback(async () => {
    try {
      const summary = await getStorageHealthSummaryAction();
      setHealthSummary(summary);
    } catch (err) {
      console.warn('Failed to load storage health summary:', err);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [activeBucket, loadMedia]);

  useEffect(() => {
    loadHealthSummary();
  }, [loadHealthSummary]);

  const handleRunCleanup = async (dryRun: boolean) => {
    setIsCleaning(true);
    setCleanupResult(null);
    try {
      const res = await runImageCleanupAction({ dryRun });
      setCleanupResult(res);
      await loadHealthSummary();
      if (!dryRun) {
        await loadMedia();
      }
    } catch (err: any) {
      alert('Cleanup failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCleaning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError('');
    try {
      await uploadImage({ bucket: activeBucket, file: selectedFile });
      loadMedia();
      loadHealthSummary();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (confirm('Delete this media permanently from Storage and Registry?')) {
      try {
        await deleteImage(activeBucket, path);
        loadMedia();
        loadHealthSummary();
      } catch (err: any) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPath(url);
    setTimeout(() => {
      setCopiedPath(null);
    }, 1500);
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12 text-heading">

      {/* Title ribbon */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-[0.25em] text-[#ff7700] uppercase font-mono font-bold">Studio Assets</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2 font-sans">Media Library</h1>
          <p className="text-muted-text text-sm">Directly upload, manage, and automatically clean up unreferenced media assets.</p>
        </div>

        {/* Upload Button overlay */}
        <div className="relative">
          <label className={`bg-neutral-100 hover:bg-white text-black px-4 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer w-fit ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <UploadCloud className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer hidden"
            />
          </label>
        </div>
      </div>

      {/* Storage Health & Automated Orphan Cleanup Card */}
      <div className="mb-8 p-5 bg-[#141414] border border-[#262626] rounded-xl font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff7700]/10 text-[#ff7700] border border-[#ff7700]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                Automatic Orphaned-Image Cleanup
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  {healthSummary?.retentionDays || 60}-Day Safety Buffer
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Images unreferenced by any published/draft post or site model for over 2 months are automatically purged in the background.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleRunCleanup(true)}
              disabled={isCleaning}
              className="px-3 py-1.5 rounded text-xs font-mono font-medium text-neutral-300 hover:text-white bg-[#222] hover:bg-[#2e2e2e] border border-[#333] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Test scan without deleting anything"
            >
              {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Dry Run
            </button>
            <button
              type="button"
              onClick={() => handleRunCleanup(false)}
              disabled={isCleaning}
              className="px-3 py-1.5 rounded text-xs font-mono font-medium text-[#ff7700] hover:text-white bg-[#ff7700]/10 hover:bg-[#ff7700] border border-[#ff7700]/30 hover:border-[#ff7700] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Run live cleanup and delete eligible images"
            >
              {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Run Cleanup Now
            </button>
          </div>
        </div>

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Tracked Images</span>
            <div className="text-xl font-semibold text-white mt-1 font-mono">{healthSummary?.totalTracked ?? '—'}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">In storage registry</p>
          </div>

          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500">Active In Use</span>
            <div className="text-xl font-semibold text-emerald-400 mt-1 font-mono">{healthSummary?.activeCount ?? '—'}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Referenced in content</p>
          </div>

          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500">In Grace Period</span>
            <div className="text-xl font-semibold text-amber-300 mt-1 font-mono">{healthSummary?.orphanedInGracePeriod ?? '—'}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">&lt; {healthSummary?.retentionDays || 60} days unreferenced</p>
          </div>

          <div className="p-3 bg-[#0d0d0d] rounded-lg border border-[#1f1f1f]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">Eligible Cleanup</span>
            <div className="text-xl font-semibold text-red-400 mt-1 font-mono">{healthSummary?.eligibleForCleanup ?? '—'}</div>
            <p className="text-[10px] text-neutral-500 mt-0.5">&gt; {healthSummary?.retentionDays || 60} days unreferenced</p>
          </div>
        </div>

        {/* Cleanup Feedback Banner */}
        {cleanupResult && (
          <div className={`mt-4 p-3.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
            cleanupResult.success ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-amber-950/20 border-amber-900/40 text-amber-300'
          }`}>
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Cleanup {cleanupResult.dryRun ? 'Dry Run' : 'Completed'} in {cleanupResult.durationMs}ms:
              </div>
              <div className="text-neutral-300 mt-1">
                Scanned {cleanupResult.scannedCount} files · {cleanupResult.referencedCount} active · {cleanupResult.orphanedCount} unreferenced · {cleanupResult.deletedCount} {cleanupResult.dryRun ? 'would be deleted' : 'deleted'} · {cleanupResult.skippedCount} skipped in grace period · {cleanupResult.failedCount} failed
              </div>
              {cleanupResult.deletedPaths?.length > 0 && (
                <div className="mt-1.5 text-[11px] text-neutral-400 max-h-20 overflow-y-auto">
                  {cleanupResult.deletedPaths.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Scheduled Run Status */}
        {healthSummary?.lastCleanupLog && (
          <div className="mt-3 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
            <span>Last background run: {new Date(healthSummary.lastCleanupLog.executed_at).toLocaleString()}</span>
            <span className={healthSummary.lastCleanupLog.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}>
              Status: {healthSummary.lastCleanupLog.status} ({healthSummary.lastCleanupLog.deleted_count} deleted)
            </span>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded text-red-400 text-xs font-mono">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Bucket Tabs Selection */}
      <div className="flex border-b border-border mb-8 gap-4 overflow-x-auto scrollbar-hide">
        {(['media', 'post-images', 'cover-images', 'persona-assets', 'profile-assets', 'newsletter-assets'] as StorageBucket[]).map((bucket) => (
          <button
            key={bucket}
            onClick={() => setActiveBucket(bucket)}
            className={`pb-3 text-xs font-mono uppercase tracking-widest font-semibold transition-colors border-b-2 hover:text-white px-1 ${
              activeBucket === bucket ? 'border-[#ff7700] text-white' : 'border-transparent text-muted-text'
            }`}
          >
            {bucket} folder
          </button>
        ))}
      </div>

      {loading ? (
        <MediaGridSkeleton items={10} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {files.map((file, idx) => {
            const isCopied = copiedPath === file.publicUrl;
            return (
              <div
                key={idx}
                className="bg-surface border border-border hover:border-neutral-700 rounded-lg p-3 flex flex-col justify-between group transition-all relative aspect-square overflow-hidden"
              >
                {/* Visual Graphics Background Preview */}
                <div className="w-full h-[65%] rounded overflow-hidden bg-muted border border-border relative flex items-center justify-center">
                  <Image
                    src={file.publicUrl}
                    alt={file.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                  <ImageIcon className="w-6 h-6 text-neutral-800 absolute z-0 group-hover:text-neutral-700 transition-colors pointer-events-none" />
                </div>

                {/* Info and action panel */}
                <div className="pt-2.5">
                  <p className="text-[10px] font-mono font-semibold text-heading truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[8px] font-mono text-muted-text mt-1 uppercase">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Floating controls */}
                <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(file.publicUrl)}
                    className="p-2 bg-[#ff7700] hover:bg-[#ff7700]/95 text-white rounded-md"
                    title="Copy URL parameter"
                  >
                    {isCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-neutral-800 hover:bg-muted text-white rounded-md"
                    title="View original"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteFile(file.path)}
                    className="p-2 bg-red-950/80 hover:bg-red-900/90 text-red-400 border border-red-900/25 rounded-md"
                    title="delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}

          {(files?.length || 0) === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-lg bg-[#111111]/30">
              <UploadCloud className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
              <p className="text-xs font-mono text-muted-text">No layout assets uploaded in this folder path.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
