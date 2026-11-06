import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({
  width = "w-full",
  height = "h-4",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <Skeleton className={`${width} ${height} rounded-md ${className}`} />;
}

export function SkeletonAvatar({ size = "w-10 h-10", className = "" }: { size?: string; className?: string }) {
  return <Skeleton className={`${size} rounded-full flex-shrink-0 ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-4 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-10 h-10" />
        <div className="space-y-1.5 flex-1">
          <SkeletonLine width="w-1/3" height="h-4" />
          <SkeletonLine width="w-1/4" height="h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-full" height="h-4" />
        <SkeletonLine width="w-5/6" height="h-4" />
      </div>
      <Skeleton className="w-full h-40 rounded-xl" />
      <div className="flex items-center justify-between pt-2">
        <SkeletonLine width="w-20" height="h-3" />
        <SkeletonLine width="w-16" height="h-3" />
      </div>
    </div>
  );
}
