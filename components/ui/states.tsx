import Link from 'next/link';
import type { ReactNode } from 'react';

// Base State Props -------------------------------------------------------------

export interface StateViewProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Base unboxed state component.
 *
 * Minimal, quiet, and unboxed — strictly avoids cards, borders, heavy shadows,
 * or decorative wrappers.
 */
export function StateView({
  title,
  description,
  action,
  compact = false,
  className = '',
}: StateViewProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-16 md:py-24 px-4'
      } ${className}`}
    >
      {title && (
        <h3
          className={`font-serif font-normal text-paper ${
            compact ? 'text-base' : 'text-2xl sm:text-3xl'
          }`}
        >
          {title}
        </h3>
      )}
      {description && (
        <p
          className={`text-gray-mid ${
            compact ? 'mt-1 text-xs' : 'mt-2 max-w-md text-sm leading-relaxed'
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className={compact ? 'mt-3' : 'mt-6'}>{action}</div>}
    </div>
  );
}

// 1. No Search Results --------------------------------------------------------

export interface NoSearchResultsProps {
  query?: string;
  onReset?: () => void;
  resetLabel?: string;
  compact?: boolean;
  className?: string;
}

export function NoSearchResults({
  query,
  onReset,
  resetLabel = 'Clear search',
  compact = false,
  className,
}: NoSearchResultsProps) {
  return (
    <StateView
      compact={compact}
      className={className}
      title="No results found"
      description={
        query ? `No matches found for "${query}".` : 'No items match your filters.'
      }
      action={
        onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center rounded-full border border-tinted/30 bg-night-soft px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-post-card"
          >
            {resetLabel}
          </button>
        ) : undefined
      }
    />
  );
}

// 2. No Content / Empty Collection -------------------------------------------

export interface NoContentStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function NoContentState({
  title = 'No entries yet',
  description = 'Nothing has been published here yet.',
  action,
  compact = false,
  className,
}: NoContentStateProps) {
  return (
    <StateView
      compact={compact}
      className={className}
      title={title}
      description={description}
      action={action}
    />
  );
}

// 3. No Rows in a Table (Table Empty State) -----------------------------------

export interface EmptyTableStateProps {
  colSpan: number;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyTableState({
  colSpan,
  title = 'No items to display',
  description = 'No records match the current view.',
  action,
  className = '',
}: EmptyTableStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-12 text-center ${className}`}>
        <p className="font-serif text-base font-normal text-paper">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-mid">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </td>
    </tr>
  );
}

// 4. Fetching / Loading State -------------------------------------------------

export interface LoadingStateProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}

export function LoadingState({
  title = 'Loading…',
  description,
  compact = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-16 md:py-24 px-4'
      } ${className || ''}`}
      role="status"
      aria-live="polite"
    >
      <p
        className={`font-serif font-normal text-paper ${
          compact ? 'text-sm' : 'text-lg'
        }`}
      >
        {title}
      </p>
      {description && (
        <p
          className={`text-gray-mid ${
            compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

// 5. Fetch Failed / Something Went Wrong (Error State) ------------------------

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this content. Please try again.',
  onRetry,
  action,
  compact = false,
  className,
}: ErrorStateProps) {
  const actionElement =
    action ||
    (onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
      >
        Try again
      </button>
    ) : undefined);

  return (
    <StateView
      compact={compact}
      className={className}
      title={title}
      description={description}
      action={actionElement}
    />
  );
}

// 6. Not Found State ----------------------------------------------------------

export interface NotFoundStateProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  homeHref?: string;
  compact?: boolean;
  className?: string;
}

export function NotFoundState({
  title = 'Page not found',
  description = (
    <>
      The page you’re looking for doesn’t exist
      <br />
      or may have been moved.
    </>
  ),
  action,
  homeHref = '/',
  compact = false,
  className,
}: NotFoundStateProps) {
  const actionElement =
    action || (
      <Link
        href={homeHref}
        className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
      >
        Go home
      </Link>
    );

  return (
    <StateView
      compact={compact}
      className={className}
      title={title}
      description={description}
      action={actionElement}
    />
  );
}

// 7. Permission / Unauthorized State ------------------------------------------

export interface UnauthorizedStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  homeHref?: string;
  compact?: boolean;
  className?: string;
}

export function UnauthorizedState({
  title = 'Access restricted',
  description = 'You do not have permission to view this page.',
  action,
  homeHref = '/',
  compact = false,
  className,
}: UnauthorizedStateProps) {
  const actionElement =
    action || (
      <Link
        href={homeHref}
        className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-xs font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
      >
        Return home
      </Link>
    );

  return (
    <StateView
      compact={compact}
      className={className}
      title={title}
      description={description}
      action={actionElement}
    />
  );
}

// 8. No Media Available -------------------------------------------------------

export interface NoMediaStateProps {
  title?: string;
  description?: string;
  onUpload?: () => void;
  compact?: boolean;
  className?: string;
}

export function NoMediaState({
  title = 'No media assets',
  description = 'Upload images or documents to view them here.',
  onUpload,
  compact = false,
  className,
}: NoMediaStateProps) {
  return (
    <StateView
      compact={compact}
      className={className}
      title={title}
      description={description}
      action={
        onUpload ? (
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-accent-hover"
          >
            Upload asset
          </button>
        ) : undefined
      }
    />
  );
}
