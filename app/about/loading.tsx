import { ProfileSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <div className="w-full flex justify-center py-24">
      <ProfileSkeleton />
    </div>
  );
}
