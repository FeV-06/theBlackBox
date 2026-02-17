"use client";

import { useState, useEffect, useCallback } from "react";
import { Github, Star, GitFork, AlertCircle, GitCommit, RefreshCw } from "lucide-react";

interface RepoData {
    full_name: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    updated_at: string;
}

interface CommitData {
    sha: string;
    commit: { message: string; author: { date: string } };
}

export default function GitHubWidget() {
    const [owner, setOwner] = useState("");
    const [repo, setRepo] = useState("");
    const [repoData, setRepoData] = useState<RepoData | null>(null);
    const [commits, setCommits] = useState<CommitData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchRepo = useCallback(async () => {
        if (!owner || !repo) return;
        setLoading(true);
        setError("");
        try {
            const [repoRes, commitsRes] = await Promise.all([
                fetch(`https://api.github.com/repos/${owner}/${repo}`),
                fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`),
            ]);
            if (!repoRes.ok) throw new Error("Repo not found");
            const repoJson = await repoRes.json();
            const commitsJson = commitsRes.ok ? await commitsRes.json() : [];
            setRepoData(repoJson);
            setCommits(Array.isArray(commitsJson) ? commitsJson : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to fetch");
        } finally {
            setLoading(false);
        }
    }, [owner, repo]);

    return (
        <div className="flex flex-col gap-3">
            {/* Repo input */}
            <div className="flex gap-2">
                <input
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="owner"
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <span className="text-xs self-center" style={{ color: "var(--color-text-muted)" }}>/</span>
                <input
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    placeholder="repo"
                    onKeyDown={(e) => e.key === "Enter" && fetchRepo()}
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={fetchRepo} className="btn-accent px-2 py-1.5" disabled={loading}>
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {error && (
                <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                    {error}
                </p>
            )}

            {repoData && (
                <>
                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-warning)" }}>
                            <Star size={13} /> {repoData.stargazers_count.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <GitFork size={13} /> {repoData.forks_count.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-danger)" }}>
                            <AlertCircle size={13} /> {repoData.open_issues_count}
                        </div>
                    </div>

                    {/* Commits */}
                    {commits.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Recent Commits
                            </p>
                            {commits.map((c) => (
                                <div key={c.sha} className="flex items-start gap-2 text-xs">
                                    <GitCommit size={12} className="mt-0.5 shrink-0" style={{ color: "var(--color-accent)" }} />
                                    <span className="truncate" style={{ color: "var(--color-text-secondary)" }}>
                                        {c.commit.message.split("\n")[0]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {!repoData && !loading && !error && (
                <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
                    Enter owner/repo and press Enter
                </p>
            )}
        </div>
    );
}
