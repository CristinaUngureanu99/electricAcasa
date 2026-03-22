'use client';

export function Skeleton({ className }: { className?: string }) {
  return <div role="status" aria-busy="true" className={`animate-pulse bg-gray-200 rounded-xl ${className || ''}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-20 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
