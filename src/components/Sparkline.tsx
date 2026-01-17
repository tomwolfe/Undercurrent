"use client";

import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ 
  data, 
  width = 80, 
  height = 30, 
  color = "currentColor" 
}: SparklineProps) {
  const id = useId();
  const gradientId = `sparkline-gradient-${id.replace(/:/g, "")}`;
  
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]"
      />
      <path
        d={`M 0 ${height} L ${points} L ${width} ${height} Z`}
        fill={`url(#${gradientId})`}
        stroke="none"
      />
    </svg>
  );
}