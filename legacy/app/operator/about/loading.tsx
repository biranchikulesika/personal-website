import { ProfileSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full flex justify-center py-24 px-6 md:px-12 max-w-3xl mx-auto">
      <ProfileSkeleton />
    </div>
  );
}
