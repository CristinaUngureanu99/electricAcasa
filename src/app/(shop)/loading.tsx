import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductGridSkeleton />
    </div>
  );
}
