import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

// Shared admin primitives. One button style, one badge style, one input style.
// Keep this file presentational only; screen-specific logic stays in managers.

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants = {
  primary: "bg-accent text-night hover:bg-accent-hover",
  secondary:
    "border border-tinted/40 bg-night-soft text-paper hover:border-tinted/60 hover:bg-post-card",
  ghost: "text-gray-mid hover:bg-post-card hover:text-paper",
  danger:
    "border border-rose-500/30 text-rose-300 hover:border-rose-500/50 hover:bg-rose-500/10",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export function Button({
  variant = "secondary",
  size = "sm",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    />
  );
}

export function buttonClassName(
  variant: keyof typeof buttonVariants = "secondary",
  size: keyof typeof buttonSizes = "sm",
) {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-tinted/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-paper">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-mid">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-mid">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-tinted/20 bg-night-soft p-4 ${className}`}
    >
      {children}
    </div>
  );
}

const badgeTones = {
  green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  grey: "bg-white/[0.04] text-gray-mid ring-tinted/50",
  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  red: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  accent: "bg-accent/10 text-accent ring-accent/20",
};

export function Badge({
  tone = "grey",
  children,
  className = "",
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-5 ring-1 ring-inset ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const statusLabels: Record<string, string> = {
  published: "Published",
  unpublished: "Draft",
  draft: "Draft",
  archived: "Archived",
  scheduled: "Scheduled",
  active: "Active",
  unsubscribed: "Unsubscribed",
  current: "Current",
  past: "Past",
  want_to_read: "Want to read",
  reading: "Reading",
  on_shelf: "On Shelf",
  finished: "Finished",
};

const statusTones: Record<string, keyof typeof badgeTones> = {
  published: "green",
  active: "green",
  current: "green",
  finished: "green",
  scheduled: "amber",
  reading: "amber",
  unpublished: "grey",
  draft: "grey",
  archived: "grey",
  unsubscribed: "grey",
  past: "grey",
  want_to_read: "grey",
  on_shelf: "grey",
};

export function statusLabel(status?: string | null): string {
  if (!status) return "Draft";
  return statusLabels[status] ?? status.replace(/_/g, " ");
}

export function StatusBadge({ status }: { status?: string | null }) {
  const key = status ?? "draft";
  return <Badge tone={statusTones[key] ?? "grey"}>{statusLabel(key)}</Badge>;
}

export function TypeBadge({ kind }: { kind: "post" | "note" | "now" | "book" }) {
  const label =
    kind === "post" ? "Essay" : kind === "now" ? "Now" : kind === "book" ? "Book" : "Note";
  return <Badge tone="grey">{label}</Badge>;
}

export const inputClass =
  "w-full rounded-lg border border-tinted/30 bg-night px-3 py-2 text-sm text-paper placeholder:text-gray-mid/50 transition-colors hover:border-tinted/50 focus:border-accent/60 focus:outline-none disabled:opacity-50";

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-mid"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-mid/80">{hint}</p>}
    </div>
  );
}

export function Toolbar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center ${className}`}
    >
      {children}
    </div>
  );
}

export function CountStat({
  label,
  value,
  href,
  onClick,
}: {
  label: string;
  value: number;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="block text-3xl font-semibold tabular-nums tracking-tight text-paper">
        {value}
      </span>
      <span className="mt-1 block text-xs text-gray-mid">{label}</span>
    </>
  );
  const className =
    "block rounded-xl border border-tinted/20 bg-night-soft p-4 text-left transition-colors hover:border-tinted/40 hover:bg-post-card/60";

  if (href) {
    return (
      <a href={href} className={className}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
