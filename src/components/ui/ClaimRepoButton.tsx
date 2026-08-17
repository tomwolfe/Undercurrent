"use client";

import { ExternalLink } from "lucide-react";

const SUGGEST_REPO_URL = "https://github.com/tomwolfe/Undercurrent/issues/new";

export function ClaimRepoButton() {
  return (
    <a
      href={SUGGEST_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/40 transition-colors"
    >
      Suggest a repo
      <ExternalLink size={9} />
    </a>
  );
}
