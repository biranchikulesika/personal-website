'use client';

import { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { getRecentUploads, deleteImage } from '@/lib/supabase/storage';
import { X, Image as ImageIcon, Trash2, Copy, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeletons';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string, url: string) => void;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecentUploads('post-images', 30);
      setImages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  const handleDelete = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this image permanently?')) return;
    
    try {
      await deleteImage('post-images', path);
      setImages(images.filter(img => img.path !== path));
    } catch (err) {
      console.error(err);
      alert('Failed to delete image');
    }
  };

  const handleCopyPath = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedId(path);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-12">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col bg-[#0c0c0c] border border-border rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#111]">
          <h2 className="text-lg font-mono uppercase font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" /> Media Library
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3">
              <ImageIcon className="w-12 h-12 opacity-20" />
              <span className="font-mono text-xs uppercase tracking-widest">No images found</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => (
                <div 
                  key={img.path} 
                  className="group relative aspect-square bg-[#111] border border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onSelect(img.path, img.publicUrl)}
                >
                  <NextImage src={img.publicUrl} alt={img.name} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <span className="text-[10px] font-mono text-white truncate mb-2">{img.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleCopyPath(e, img.path)}
                        className="flex-1 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center justify-center transition-colors"
                        title="Copy Storage Path"
                      >
                        {copiedId === img.path ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, img.path)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs flex items-center justify-center transition-colors"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
