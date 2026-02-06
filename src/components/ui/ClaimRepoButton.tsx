"use client";

import React, { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaimRepoButtonProps {
  repoFullName: string;
  isVerified?: boolean;
}

export function ClaimRepoButton({ repoFullName, isVerified: initialVerified }: ClaimRepoButtonProps) {
  const [isVerified, setIsVerified] = useState(initialVerified);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    // Mock backend logic for verification
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsVerified(true);
    setIsClaiming(false);
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 text-sm font-medium">
        <ShieldCheck className="w-4 h-4" />
        Verified Maintainer
      </div>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isClaiming}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
        "border border-blue-500 shadow-sm hover:shadow-md"
      )}
    >
      {isClaiming ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Check className="w-4 h-4" />
      )}
      {isClaiming ? "Verifying..." : "Claim this Repo"}
    </button>
  );
}
