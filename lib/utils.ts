/**
 * Formats a date string for display. Accepts either an ISO date
 * ("2026-03-12") or a pre-formatted string ("Mar 12, 2026") and always
 * renders the full day-month-year form.
 */
export function formatDisplayDate(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();

  // Already human-readable ("Mar 12, 2026", "2025").
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return trimmed;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}