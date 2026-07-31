'use client';

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getRecentUploads, uploadImage, deleteImage, StorageBucket
} from '@/lib/supabase/storage';
import {
  UploadCloud, Trash2, Copy, ImageIcon, CheckCircle,
  ExternalLink
} from 'lucide-react';
import { MediaGridSkeleton } from '@/components/ui/skeletons';

export default function MediaAssetsPage() {
  const [activeBucket, setActiveBucket] = useState<StorageBucket>('post-images');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

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

  useEffect(() => {
    loadMedia();
  }, [activeBucket, loadMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError('');
    try {
      await uploadImage({ bucket: activeBucket, file: selectedFile });
      loadMedia();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (confirm('Delete this media permanently from Storage?')) {
      try {
        await deleteImage(activeBucket, path);
        loadMedia();
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] tracking-[0.25em] text-[#ff7700] uppercase font-mono font-bold">Studio Assets</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2 font-sans">Media Library</h1>
          <p className="text-muted-text text-sm">Directly upload and manage static content images and layout file assets.</p>
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
