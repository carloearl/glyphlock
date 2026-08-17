import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, GitCommit, ExternalLink, Loader2 } from "lucide-react";

const REPO = "carloearl/glyphlock";

export default function GitHubCommitFeed() {
  const { data: commits = [], isLoading, isError } = useQuery({
    queryKey: ["githubCommits", REPO],
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=10`);
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-green-400" />
            Latest Commits
          </CardTitle>
          <a href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer">
            <Badge variant="outline" className="text-xs text-slate-400 hover:text-white cursor-pointer">
              {REPO} <ExternalLink className="w-3 h-3 ml-1" />
            </Badge>
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : isError ? (
          <p className="text-center text-slate-500 text-sm py-8">Unable to load commits from GitHub</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commits.map((c) => (
              <a
                key={c.sha}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GitCommit className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{c.commit?.message?.split("\n")[0]}</p>
                    <p className="text-xs text-slate-500">
                      {c.commit?.author?.name} · <code className="text-slate-400">{c.sha.slice(0, 7)}</code>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                  {c.commit?.author?.date ? new Date(c.commit.author.date).toLocaleDateString() : ""}
                </span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}