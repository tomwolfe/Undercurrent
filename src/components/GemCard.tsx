"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, GitCommit, Code2, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

export interface Gem {
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  gem_score: number;
  recent_commits: number;
  activity: number[];
  good_first_issues_url: string;
  has_good_first_issues: boolean;
  pushed_at: string;
}

interface GemCardProps {
  gem: Gem;
  now: number;
}

export function GemCard({ gem, now }: GemCardProps) {
  const getScoreVariant = (score: number) => {
    if (score >= 90) return "gold";
    if (score >= 70) return "silver";
    return "outline";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Gold";
    if (score >= 70) return "Silver";
    return "Gem";
  };

  const isRecent = useMemo(() => {
    if (now === 0) return false;
    return new Date(gem.pushed_at).getTime() > now - 7 * 24 * 60 * 60 * 1000;
  }, [gem.pushed_at, now]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Card className="group relative h-full flex flex-col justify-between border-white/[0.05] bg-[#0A0A0A] p-0 hover:border-white/10 hover:bg-[#0F0F0F] transition-all duration-300 overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <Badge 
              variant={getScoreVariant(gem.gem_score)}
              className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            >
              {getScoreLabel(gem.gem_score)} {gem.gem_score}
            </Badge>
            
            <div className="flex items-center gap-3">
              {gem.activity && (
                <div className="opacity-40 group-hover:opacity-100 transition-opacity">
                  <Sparkline data={gem.activity} color={gem.gem_score >= 70 ? "#94a3b8" : "#4b5563"} />
                </div>
              )}
              <div className="flex items-center gap-1 text-[11px] font-medium text-white/40">
                <Star size={12} className="text-white/20" />
                <span>{(gem.stars / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white/90 group-hover:text-white transition-colors flex items-center gap-2">
              {gem.name}
              {isRecent && (
                <span className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-white/40 leading-relaxed min-h-[40px]">
              {gem.description || "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/50 bg-white/[0.02]">
              <Code2 size={10} className="text-white/30" />
              {gem.language}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/50 bg-white/[0.02]">
              <GitCommit size={10} className="text-white/30" />
              {gem.recent_commits} commits/wk
            </Badge>
          </div>

          <div className="mt-2 flex gap-2">
            <a
              href={gem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.05] border border-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              View Repo
            </a>
            <a
              href={gem.good_first_issues_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                gem.has_good_first_issues 
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.3)]"
                  : "bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed pointer-events-none"
              )}
            >
              {gem.has_good_first_issues ? "Contribute" : "Lurking"}
              {gem.has_good_first_issues && <ArrowUpRight size={14} />}
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
