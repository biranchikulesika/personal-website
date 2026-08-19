import React from 'react';

/* ──────────────────────────────────────────────
   Base Skeleton — shimmer overlay via pseudo-element
   GPU-friendly: uses transform instead of bg-position
   ────────────────────────────────────────────── */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden rounded-md bg-muted/60 ${className}`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
      }}
      {...props}
    >
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer motion-reduce:hidden"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-accent) 3%, transparent) 40%, color-mix(in srgb, var(--color-accent) 7%, transparent) 50%, color-mix(in srgb, var(--color-accent) 3%, transparent) 60%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
}

/* ── Shimmer bar — single thin line ── */
function Bar({ className, shimmer = true }: { className?: string; shimmer?: boolean }) {
  return <Skeleton className={`h-4 ${className ?? ''}`} shimmer={shimmer} />;
}

/* ── Text block — multiple bars with varied widths ── */
function TextBlock({ lines = 3, shimmer = true }: { lines?: number; shimmer?: boolean }) {
  const widths = ['full', 'full', '11/12', 'full', '5/6', '4/5', '3/4'];
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Bar key={i} className={`w-${widths[i % widths.length]}`} shimmer={shimmer} />
      ))}
    </div>
  );
}

/* ── Meta row — small labels like dates, tags ── */
function MetaRow({ count = 2, shimmer = true }: { count?: number; shimmer?: boolean }) {
  return (
    <div className="flex gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-20" shimmer={shimmer} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PUBLIC — PAGE SKELETONS
   ══════════════════════════════════════════════ */

/* ── Page header skeleton (title + description) ── */
export function PageHeaderSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="mb-10 w-full max-w-2xl" aria-hidden="true">
      <Skeleton className="h-10 w-3/4 mb-4" shimmer={shimmer} />
      <Bar className="w-full mb-2" shimmer={shimmer} />
      <Bar className="w-5/6" shimmer={shimmer} />
    </div>
  );
}

/* ── Hero section (large heading + tagline) ── */
export function HeroSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl" aria-hidden="true">
      <Skeleton className="h-4 w-32" shimmer={shimmer} />
      <Skeleton className="h-12 md:h-16 w-3/4" shimmer={shimmer} />
      <Bar className="w-full max-w-xl" shimmer={shimmer} />
      <Bar className="w-5/6 max-w-lg" shimmer={shimmer} />
    </div>
  );
}

/* ── Home page skeleton — matches the real homepage layout ── */
export function HomeSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="flex flex-col w-full" aria-label="Loading content">
      {/* Hero */}
      <section className="flex flex-col justify-center px-5 sm:px-8 md:px-16 lg:px-24 pt-20 pb-8 md:pt-36 md:pb-16 w-full border-b border-border min-h-[70vh]">
        <div className="mx-auto w-full max-w-300 flex flex-col gap-8 md:gap-16">
          <Skeleton className="h-14 md:h-24 w-2/3 md:w-1/2" shimmer={shimmer} />
          <Skeleton className="h-12 md:h-16 w-full max-w-175" shimmer={shimmer} />
          {/* Nav cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full mt-2 md:mt-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 md:h-44 w-full rounded-2xl" shimmer={shimmer} />
            ))}
          </div>
        </div>
      </section>
      {/* Marquee */}
      <div className="w-full py-5 border-y border-border">
        <div className="flex gap-20 px-5 opacity-40">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-3 w-24 shrink-0" shimmer={shimmer} />)}
        </div>
      </div>
      {/* Section 2: Quote + Principles */}
      <section className="px-6 md:px-16 lg:px-24 py-10 md:py-20 border-b border-border">
        <div className="max-w-275 mx-auto flex flex-col md:flex-row gap-12 md:gap-20">
          <div className="flex-1">
            <Skeleton className="h-24 md:h-48 w-full max-w-lg" shimmer={shimmer} />
          </div>
          <div className="w-full md:w-95 shrink-0 md:pl-10 md:border-l border-border space-y-6">
            <Skeleton className="h-3 w-32" shimmer={shimmer} />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-6 shrink-0" shimmer={shimmer} />
                <Bar className="w-3/4" shimmer={shimmer} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Builder home skeleton ── */
export function BuilderSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="w-full" aria-label="Loading">
      <section className="w-full min-h-svh flex flex-col justify-center pt-16 md:pt-20 pb-32 md:pb-40">
        <div className="max-w-5xl mx-auto px-6 md:px-12 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-0 lg:items-start">
            <div className="lg:col-span-7">
              <Skeleton className="h-14 md:h-20 w-full max-w-xl mb-4" shimmer={shimmer} />
              <Bar className="w-2/3" shimmer={shimmer} />
            </div>
            <div className="lg:col-span-4 lg:col-start-9 w-full mt-8 lg:mt-2">
              <Skeleton className="h-48 w-full rounded-sm" shimmer={shimmer} />
            </div>
            <div className="lg:col-span-7 mt-8 space-y-4">
              <Bar className="w-full max-w-lg" shimmer={shimmer} />
              <div className="flex gap-6">
                <Skeleton className="h-4 w-24" shimmer={shimmer} />
                <Skeleton className="h-4 w-24" shimmer={shimmer} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const OperatorSkeleton = BuilderSkeleton;

/* ── Thinker home skeleton ── */
export function ThinkerSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 lg:py-24" aria-label="Loading">
      <Skeleton className="h-4 w-32 mb-6" shimmer={shimmer} />
      <Skeleton className="h-10 md:h-14 w-full mb-3" shimmer={shimmer} />
      <Skeleton className="h-10 md:h-14 w-4/5 mb-6" shimmer={shimmer} />
      <TextBlock lines={4} shimmer={shimmer} />
      <div className="mt-12 space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" shimmer={shimmer} />
        <TextBlock lines={3} shimmer={shimmer} />
      </div>
    </div>
  );
}

/* ── Wanderer home skeleton ── */
export function WandererSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-14 py-12 lg:py-24" aria-label="Loading">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-8 space-y-20 lg:space-y-32">
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-3 w-48" shimmer={shimmer} />
            <Skeleton className="h-10 md:h-14 w-64" shimmer={shimmer} />
            <TextBlock lines={3} shimmer={shimmer} />
            <Skeleton className="h-10 w-full max-w-lg" shimmer={shimmer} />
          </div>
          <div className="space-y-16">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 md:h-96 w-full rounded-lg" shimmer={shimmer} />
            ))}
          </div>
        </div>
        <div className="hidden lg:flex lg:col-span-4 pl-12 border-l border-border h-[calc(100vh-200px)] sticky top-36">
          <div className="space-y-6 w-full pr-4 pt-10">
            <Skeleton className="h-4 w-24" shimmer={shimmer} />
            <Bar className="w-full" shimmer={shimmer} />
            <Bar className="w-full" shimmer={shimmer} />
            <Bar className="w-4/5" shimmer={shimmer} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Blog article card skeleton ── */
export function ArticleCardSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="flex flex-col space-y-4" aria-hidden="true">
      <Skeleton className="w-full aspect-[3/2] rounded-md" shimmer={shimmer} />
      <div className="space-y-2">
        <MetaRow count={2} shimmer={shimmer} />
        <Skeleton className="h-6 w-full" shimmer={shimmer} />
        <Bar className="w-full" shimmer={shimmer} />
        <Bar className="w-4/5" shimmer={shimmer} />
      </div>
    </div>
  );
}

/* ── Blog article grid skeleton (6 cards) ── */
export function ArticleGridSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16" aria-label="Loading articles">
      {Array.from({ length: 6 }).map((_, i) => (
        <ArticleCardSkeleton key={i} shimmer={shimmer} />
      ))}
    </div>
  );
}

/* ── Post content skeleton (matches article layout) ── */
export function PostContentSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12" aria-label="Loading article">
      <Skeleton className="h-4 w-24 mb-6" shimmer={shimmer} />
      <Skeleton className="h-10 md:h-14 w-full mb-3" shimmer={shimmer} />
      <Skeleton className="h-10 md:h-14 w-4/5 mb-6" shimmer={shimmer} />
      <div className="flex gap-6 mb-10 border-b border-border pb-6">
        <Skeleton className="h-4 w-28" shimmer={shimmer} />
        <Skeleton className="h-4 w-20" shimmer={shimmer} />
      </div>
      <Skeleton className="h-64 md:h-80 w-full rounded-lg mb-8" shimmer={shimmer} />
      <div className="space-y-4">
        <TextBlock lines={6} shimmer={shimmer} />
        <Skeleton className="h-64 w-full rounded-lg my-8" shimmer={shimmer} />
        <TextBlock lines={5} shimmer={shimmer} />
      </div>
    </div>
  );
}

/* ── Profile/About page skeleton ── */
export function ProfileSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12" aria-label="Loading profile">
      <PageHeaderSkeleton shimmer={shimmer} />
      <div className="space-y-4 mt-4">
        <TextBlock lines={5} shimmer={shimmer} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <Skeleton className="h-32 w-full rounded-xl" shimmer={shimmer} />
        <Skeleton className="h-32 w-full rounded-xl" shimmer={shimmer} />
      </div>
    </div>
  );
}

/* ── Newsletter form skeleton ── */
export function NewsletterFormSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="w-full max-w-xl" aria-label="Loading newsletter">
      <PageHeaderSkeleton shimmer={shimmer} />
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-12 w-full border-b rounded-none" shimmer={shimmer} />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-8 w-full" shimmer={shimmer} />
          <Skeleton className="h-8 w-full" shimmer={shimmer} />
        </div>
      </div>
    </div>
  );
}

/* ── Terms / Fund / generic content page skeleton ── */
export function ContentSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12" aria-label="Loading content">
      <PageHeaderSkeleton shimmer={shimmer} />
      <div className="space-y-4 mt-8">
        <TextBlock lines={8} shimmer={shimmer} />
        <Skeleton className="h-32 w-full rounded-xl my-6" shimmer={shimmer} />
        <TextBlock lines={6} shimmer={shimmer} />
        <Skeleton className="h-24 w-full rounded-xl my-6" shimmer={shimmer} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ADMIN — SKELETONS
   ══════════════════════════════════════════════ */

/* ── Dashboard table skeleton ── */
export function DashboardTableSkeleton({ rows = 5, shimmer = true }: { rows?: number; shimmer?: boolean } = {}) {
  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-background" aria-label="Loading table">
      <div className="bg-muted p-4 border-b border-border flex items-center justify-between">
        <Skeleton className="h-5 w-1/4" shimmer={shimmer} />
        <Skeleton className="h-8 w-24" shimmer={shimmer} />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-2 w-1/2">
              <Skeleton className="h-5 w-full" shimmer={shimmer} />
              <Skeleton className="h-3 w-2/3" shimmer={shimmer} />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded" shimmer={shimmer} />
              <Skeleton className="h-8 w-16 rounded" shimmer={shimmer} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Admin dashboard (stats + recent activity) ── */
export function AdminDashboardSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="space-y-8" aria-label="Loading dashboard">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="border border-border rounded-lg p-5 space-y-3">
            <Skeleton className="h-3 w-24" shimmer={shimmer} />
            <Skeleton className="h-8 w-16" shimmer={shimmer} />
            <Skeleton className="h-3 w-32" shimmer={shimmer} />
          </div>
        ))}
      </div>
      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardTableSkeleton rows={4} shimmer={shimmer} />
        <DashboardTableSkeleton rows={4} shimmer={shimmer} />
      </div>
    </div>
  );
}

/* ── Admin compose editor skeleton ── */
export function AdminEditorSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-neutral-400 font-sans overflow-hidden select-none" aria-label="Loading editor">
      {/* VS Code Top Tab Bar */}
      <div className="h-[36px] bg-[#181818] border-b border-[#222] px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <div className="h-7 px-3 rounded-t bg-[#1e1e1e] border-t border-t-[#ff7700] border-x border-[#282828] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neutral-600" />
            <div className="w-20 h-3 rounded bg-neutral-700/60 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 pr-2">
          <div className="w-16 h-6 rounded bg-neutral-800/80 animate-pulse" />
          <div className="w-16 h-6 rounded bg-[#ff7700]/20 animate-pulse" />
        </div>
      </div>

      {/* Breadcrumb row */}
      <div className="h-[32px] bg-[#1e1e1e] border-b border-[#222] px-4 flex items-center gap-2 shrink-0">
        <div className="w-16 h-3 rounded bg-neutral-800 animate-pulse" />
        <span className="text-neutral-600 text-xs">›</span>
        <div className="w-48 h-3.5 rounded bg-neutral-800/80 animate-pulse" />
      </div>

      {/* Subtitle row */}
      <div className="h-[30px] bg-[#1a1a1a] border-b border-[#222] px-4 flex items-center shrink-0">
        <div className="w-64 h-3 rounded bg-neutral-800/50 animate-pulse" />
      </div>

      {/* Editor Body */}
      <div className="flex-1 min-h-0 bg-[#1e1e1e] flex flex-row">
        {/* Monaco Line Numbers Gutter */}
        <div className="w-12 bg-[#1e1e1e] border-r border-[#282828] py-4 flex flex-col items-center gap-3 text-[11px] font-mono text-neutral-700 shrink-0">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
          <span>9</span>
          <span>10</span>
        </div>

        {/* Code Canvas Placeholder */}
        <div className="flex-1 p-6 space-y-3">
          <div className="w-1/3 h-4 rounded bg-neutral-800/60 animate-pulse" />
          <div className="w-2/3 h-3.5 rounded bg-neutral-800/40 animate-pulse" />
          <div className="w-1/2 h-3.5 rounded bg-neutral-800/40 animate-pulse" />
          <div className="w-4/5 h-3.5 rounded bg-neutral-800/30 animate-pulse" />
          <div className="w-3/5 h-3.5 rounded bg-neutral-800/30 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Media gallery grid skeleton ── */
export function MediaGridSkeleton({ items = 8, shimmer = true }: { items?: number; shimmer?: boolean } = {}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-label="Loading media">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-md" shimmer={shimmer} />
          <Skeleton className="h-3 w-3/4" shimmer={shimmer} />
        </div>
      ))}
    </div>
  );
}

/* ── Admin settings skeleton ── */
export function SettingsSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="space-y-8 max-w-2xl" aria-label="Loading settings">
      <PageHeaderSkeleton shimmer={shimmer} />
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-border rounded-lg p-5 space-y-4">
            <Skeleton className="h-5 w-1/3" shimmer={shimmer} />
            <Skeleton className="h-10 w-full rounded" shimmer={shimmer} />
            <Skeleton className="h-8 w-24 rounded" shimmer={shimmer} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Admin login skeleton ── */
export function AdminLoginSkeleton({ shimmer = true }: { shimmer?: boolean } = {}) {
  return (
    <div className="h-screen w-full flex" aria-label="Loading login">
      {/* Left pane */}
      <div className="hidden md:flex flex-1 items-center justify-center border-r border-border bg-muted/30">
        <Skeleton className="h-64 w-3/4 max-w-lg" shimmer={shimmer} />
      </div>
      {/* Right pane */}
      <div className="w-full md:w-[450px] flex flex-col items-center justify-center px-8 space-y-8">
        <Skeleton className="h-8 w-48" shimmer={shimmer} />
        <div className="w-full max-w-[350px] space-y-4">
          <Skeleton className="h-12 w-full rounded-md" shimmer={shimmer} />
          <Skeleton className="h-12 w-full rounded-md" shimmer={shimmer} />
          <Skeleton className="h-12 w-full rounded-md" shimmer={shimmer} />
          <div className="flex items-center gap-4 py-4">
            <Skeleton className="flex-1 h-px" shimmer={shimmer} />
            <Skeleton className="h-4 w-28" shimmer={shimmer} />
            <Skeleton className="flex-1 h-px" shimmer={shimmer} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 w-full rounded-md" shimmer={shimmer} />
            <Skeleton className="h-16 w-full rounded-md" shimmer={shimmer} />
            <Skeleton className="h-16 w-full rounded-md" shimmer={shimmer} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Questions / Fragments list skeleton ── */
export function ListSkeleton({ items = 5, shimmer = true }: { items?: number; shimmer?: boolean } = {}) {
  return (
    <div className="space-y-3" aria-label="Loading list">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" shimmer={shimmer} />
            <Skeleton className="h-3 w-1/2" shimmer={shimmer} />
          </div>
          <Skeleton className="h-8 w-20 rounded shrink-0 ml-4" shimmer={shimmer} />
        </div>
      ))}
    </div>
  );
}
