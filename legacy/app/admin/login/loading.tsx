import { Skeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center dark:bg-[#050505] bg-[#F5F5F2] font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-amber-900/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] px-6">
        <div className="flex flex-col items-center mb-8">
          <Skeleton className="h-12 w-12 rounded-2xl mb-6" />
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="dark:bg-[#0A0A0A]/60 bg-white/60 backdrop-blur-xl rounded-3xl border dark:border-stone-800/60 border-stone-200/60 p-8 shadow-2xl">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-12 ml-1" />
              <Skeleton className="h-[44px] w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16 ml-1" />
              <Skeleton className="h-[44px] w-full rounded-xl" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-[46px] w-full rounded-xl" />
            </div>
          </div>

          <div className="my-7 flex justify-center">
            <Skeleton className="h-3 w-32" />
          </div>

          <Skeleton className="h-[46px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
