'use client';

import { FileImage, Loader2, CheckCircle2, AlertCircle, X, RefreshCw, FileDown } from 'lucide-react';
import type { UploadItem } from '@/hooks/use-image-upload';

interface UploadProgressProps {
  uploads: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearCompleted: () => void;
}

const STATUS_CONFIG = {
  pending: { icon: FileImage, label: 'Waiting...', color: 'text-neutral-400' },
  compressing: { icon: FileDown, label: 'Compressing...', color: 'text-amber-400' },
  uploading: { icon: Loader2, label: 'Uploading...', color: 'text-[#ff7700]' },
  success: { icon: CheckCircle2, label: 'Uploaded', color: 'text-emerald-400' },
  error: { icon: AlertCircle, label: 'Failed', color: 'text-red-400' },
  cancelled: { icon: X, label: 'Cancelled', color: 'text-neutral-500' },
};

/**
 * Inline upload progress display showing all active/completed uploads
 * with progress bars, retry, and dismiss controls.
 */
export default function UploadProgress({
  uploads,
  onRetry,
  onDismiss,
  onClearCompleted,
}: UploadProgressProps) {
  if (uploads.length === 0) return null;

  const hasCompletedItems = uploads.some(
    (u) => u.status === 'success' || u.status === 'error' || u.status === 'cancelled'
  );

  return (
    <div className="fixed bottom-12 right-6 z-[70] w-80 max-h-[50vh] flex flex-col gap-2 overflow-y-auto">
      {uploads.map((item) => {
        const cfg = STATUS_CONFIG[item.status];
        const Icon = cfg.icon;
        const isActive =
          item.status === 'uploading' || item.status === 'compressing' || item.status === 'pending';
        const isError = item.status === 'error';
        const isComplete = item.status === 'success';

        return (
          <div
            key={item.id}
            className={`bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200 ${
              isComplete ? 'opacity-90 hover:opacity-100' : ''
            }`}
          >
            {/* Top row: icon, filename, action */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    cfg.color
                  } ${item.status === 'uploading' ? 'animate-spin' : ''}`}
                />
                <span className="text-xs text-neutral-300 truncate font-medium">
                  {item.file.name}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isError && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="p-1 rounded hover:bg-[#333] text-neutral-400 hover:text-white transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onDismiss(item.id)}
                  className="p-1 rounded hover:bg-[#333] text-neutral-500 hover:text-white transition-colors"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  isError
                    ? 'bg-red-500'
                    : isComplete
                      ? 'bg-emerald-500'
                      : 'bg-[#ff7700]'
                }`}
                style={{ width: `${isActive ? item.progress : isComplete ? 100 : isError ? 100 : 0}%` }}
              />
            </div>

            {/* Status label */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono ${cfg.color}`}>
                {item.status === 'uploading' ? `${item.progress}%` : cfg.label}
              </span>
              {item.error && (
                <span className="text-[9px] text-red-400/80 truncate max-w-[200px]" title={item.error}>
                  {item.error}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Clear completed button */}
      {hasCompletedItems && (
        <button
          onClick={onClearCompleted}
          className="self-end text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1"
        >
          Clear completed
        </button>
      )}
    </div>
  );
}
