import { LoadingState } from '@/components/ui/states';

export default function AdminLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-night">
      <LoadingState title="Loading admin workspace…" />
    </div>
  );
}
