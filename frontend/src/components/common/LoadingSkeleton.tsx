import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={clsx('animate-pulse bg-gray-200 rounded', className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-full mb-1" />
    <Skeleton className="h-4 w-5/6 mb-3" />
    <div className="flex gap-1">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-16 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export default Skeleton;
