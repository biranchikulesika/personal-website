import { DashboardTableSkeleton, PageHeaderSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full flex justify-center py-12 px-6">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-1 md:col-span-2">
            <DashboardTableSkeleton />
          </div>
          <div className="col-span-1 flex flex-col gap-6">
            <DashboardTableSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
