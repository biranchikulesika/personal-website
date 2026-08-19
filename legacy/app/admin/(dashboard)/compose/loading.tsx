import { DashboardTableSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full p-6">
      <div className="w-full max-w-5xl flex flex-col gap-8 mx-auto">
        <PageHeaderSkeleton />
        <DashboardTableSkeleton />
      </div>
    </div>
  );
}
