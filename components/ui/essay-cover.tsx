/**
 * Placeholder cover for essay cards — the first letter of the title on a
 * radial gradient. Used in writing-section, scribble-page, and about-page.
 */
export function EssayCover({ title }: { title: string }) {
  return (
    <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(250,249,245,0.08)_15%,transparent_75%)]">
      <span className="font-serif text-5xl italic text-paper/40">
        {title.charAt(0)}
      </span>
    </div>
  );
}
