import { DashboardTableSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full flex justify-center py-24 px-6 md:px-12 max-w-5xl mx-auto">
      <div className="w-full flex flex-col gap-12">
        <PageHeaderSkeleton />
        <DashboardTableSkeleton />
      </div>
    </div>
  );
}
