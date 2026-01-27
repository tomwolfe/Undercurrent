"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, AlertCircle } from "lucide-react";

interface RepoDetailsProps {
  fullName: string;
}

export function RepoDetails({ fullName }: RepoDetailsProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/details/${fullName}`);
        if (!response.ok) {
          throw new Error("Failed to load repository details");
        }
        const data = await response.json();
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [fullName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm font-medium">Fetching README...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-rose-500/60 text-center px-6">
        <AlertCircle className="mb-4" size={32} />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-blue max-w-none px-4 pb-12">
      <ReactMarkdown>{content || ""}</ReactMarkdown>
    </div>
  );
}
