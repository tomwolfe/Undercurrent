"use client";

import { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode[];
  className?: string;
}

export function MasonryGrid({
  children,
  className = ""
}: MasonryGridProps) {
  return (
    <div className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 ${className}`}>
      {children.map((child, index) => (
        <div key={index} className="break-inside-avoid">
          {child}
        </div>
      ))}
    </div>
  );
}
