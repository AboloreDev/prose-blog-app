import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton = () => (
  <div className="min-h-screen">
    <div className="h-14 border-b px-4 flex items-center">
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

export default PostSkeleton;
