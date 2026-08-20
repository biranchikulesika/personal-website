import { AlertCircleIcon } from '../icons';

// LoadingState -----------------------------------------------------------------

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading…',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-tinted/20 border-t-accent" />
      <p className="mt-4 text-sm text-ink-soft">{message}</p>
    </div>
  );
}

// EmptyState -------------------------------------------------------------------

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-night-soft text-ink-soft/60 ring-1 ring-tinted/20">
          {icon}
        </div>
      )}
      <h3 className="mt-4 font-serif text-lg font-normal text-paper">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ErrorState -------------------------------------------------------------------

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'This is usually temporary. Try again in a moment.',
  error,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-night-soft text-accent ring-1 ring-tinted/20">
        <AlertCircleIcon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-normal text-paper">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        {description}
      </p>
      {error && (
        <code className="mt-3 max-w-xs truncate text-xs text-ink-soft/60">
          {error}
        </code>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
