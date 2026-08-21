export default function BareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-night text-paper">
      {children}
    </div>
  );
}
