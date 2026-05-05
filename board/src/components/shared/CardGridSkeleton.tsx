"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface CardGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function CardGridSkeleton({ count = 4, columns = 2 }: CardGridSkeletonProps) {
  const gridCols = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols[columns]}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bento-card space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
