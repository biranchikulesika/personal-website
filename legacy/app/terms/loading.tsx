import { PageHeaderSkeleton, Skeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full flex justify-center py-24 px-6 md:px-12 max-w-3xl mx-auto">
      <div className="w-full flex flex-col gap-6">
        <PageHeaderSkeleton />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full mt-4" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
