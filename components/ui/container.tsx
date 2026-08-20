/**
 * Shared content container that centers content with consistent padding.
 * Matches the existing container-site class in globals.css.
 */
export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`container-site ${className}`}>{children}</div>
  );
}
