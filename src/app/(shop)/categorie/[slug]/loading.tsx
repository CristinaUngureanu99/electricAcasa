import { Skeleton, ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function CategorieLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Skeleton className="h-4 w-48 mb-6" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-40 mb-8" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
