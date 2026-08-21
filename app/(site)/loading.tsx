import { LoadingState } from '@/components/ui/states';

export default function Loading() {
  return (
    <div className="container-site py-16 md:py-24">
      <LoadingState title="Loading…" />
    </div>
  );
}
