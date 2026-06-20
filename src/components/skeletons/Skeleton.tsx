'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-[var(--bg-tertiary)] ${className}`} />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full max-w-md rounded-xl" />
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4">
      <MessageSkeleton />
      <div className="flex gap-3 flex-row-reverse">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-2 flex flex-col items-end">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-64 rounded-xl" />
        </div>
      </div>
      <MessageSkeleton />
      <MessageSkeleton />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function StatusBarSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}
