"use client";

import { ReactNode, useEffect, useState } from "react";

interface MasonryGridProps {
  children: ReactNode[];
  className?: string;
}

export function MasonryGrid({
  children,
  className = ""
}: MasonryGridProps) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1280) setColumns(4);
      else if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 640) setColumns(2);
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const columnWrappers: ReactNode[][] = Array.from({ length: columns }, () => []);

  children.forEach((child, index) => {
    columnWrappers[index % columns].push(child);
  });

  return (
    <div className={`flex gap-6 ${className}`}>
      {columnWrappers.map((col, i) => (
        <div key={i} className="flex flex-1 flex-col gap-6">
          {col.map((child, j) => (
            <div key={j}>
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
