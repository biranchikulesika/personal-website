import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full flex justify-center py-24 px-6 md:px-12 max-w-3xl mx-auto">
      <div className="w-full flex flex-col gap-8">
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
