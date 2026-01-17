"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface MasonryGridProps {
  children: ReactNode[];
  columnCount?: number;
  className?: string;
}

export function MasonryGrid({
  children,
  columnCount = 4,
  className = ""
}: MasonryGridProps) {
  const [columns, setColumns] = useState<ReactNode[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateColumns = () => {
      // Determine column count based on screen size
      let cols = columnCount;
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) cols = 1;
        else if (window.innerWidth < 768) cols = 2;
        else if (window.innerWidth < 1024) cols = 3;
        else cols = columnCount;
      }

      // Initialize columns
      const newColumns: ReactNode[][] = Array.from({ length: cols }, () => []);

      // Distribute children among columns based on shortest column
      children.forEach((child) => {
        // Find the shortest column
        let shortestColumnIndex = 0;
        for (let i = 1; i < newColumns.length; i++) {
          if (newColumns[i].length < newColumns[shortestColumnIndex].length) {
            shortestColumnIndex = i;
          }
        }

        // Add child to shortest column
        newColumns[shortestColumnIndex].push(child);
      });

      setColumns(newColumns);
    };

    calculateColumns();

    const handleResize = () => calculateColumns();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [children, columnCount]);

  // Define responsive classes
  const responsiveClasses = [
    "grid-cols-1",
    "sm:grid-cols-2",
    "lg:grid-cols-3",
    `xl:grid-cols-${Math.min(columnCount, 4)}` // cap at 4 for xl screens
  ].join(" ");

  return (
    <div
      ref={containerRef}
      className={`grid ${responsiveClasses} gap-6 ${className}`}
    >
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-6">
          {column}
        </div>
      ))}
    </div>
  );
}