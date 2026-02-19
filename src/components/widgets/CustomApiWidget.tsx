"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Puzzle, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { ApiWidgetInstance } from "@/types/widget";
import type { WidgetInstance } from "@/types/widgetInstance";
import { Skeleton } from "@/components/ui/Skeleton";
import { PortalSelect } from "@/components/ui/PortalSelect";

const TEMPLATES = [
    { name: "GitHub Repo Stats", template: "github", url: "https://api.github.com/repos/{owner}/{repo}" },
    { name: "LeetCode Stats", template: "leetcode", url: "https://leetcode-stats-api.herokuapp.com/{username}" },
    { name: "Random JSON", template: "json", url: "https://jsonplaceholder.typicode.com/posts/1" },
    { name: "Anime Quote", template: "anime_quote", url: "https://animechan.io/api/v1/quotes/random" },
    { name: "Motivational Quote", template: "motivation", url: "https://api.quotable.io/random" },
    { name: "Weather (Open-Meteo)", template: "weather", url: "https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&current_weather=true" },
];

function ApiWidgetCard({ instance }: { instance: ApiWidgetInstance }) {
    const [data, setData] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(false);
    const { deleteApiWidget } = useSettingsStore();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(instance.url, {
                headers: instance.headers || {},
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Fetch failed");
        } finally {
            setLoading(false);
        }
    }, [instance.url, instance.headers]);

    useEffect(() => {
        fetchData();
        if (instance.refreshInterval > 0) {
            const interval = setInterval(fetchData, instance.refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [fetchData, instance.refreshInterval]);

    return (
        <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
                    {instance.name}
                </span>
                <button onClick={fetchData} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
                    <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                </button>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1 rounded hover:bg-white/5"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                <button
                    onClick={() => deleteApiWidget(instance.id)}
                    className="p-1 rounded hover:bg-white/5"
                    style={{ color: "var(--color-danger)" }}
                >
                    <Trash2 size={11} />
                </button>
            </div>

            {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}

            {loading && !data && !error && (
                <div className="flex flex-col gap-2">
                    <Skeleton height="12px" width="100%" />
                    <Skeleton height="12px" width="90%" />
                    <Skeleton height="12px" width="40%" />
                </div>
            )}

            {data ? (
                <pre
                    className="text-xs overflow-auto rounded-lg p-2"
                    style={{
                        maxHeight: expanded ? "300px" : "80px",
                        background: "rgba(0,0,0,0.3)",
                        color: "var(--color-text-secondary)",
                    }}
                >
                    {JSON.stringify(data, null, 2)}
                </pre>
            ) : null}
        </div>
    );
}

export default function CustomApiWidget({ instance }: { instance: WidgetInstance }) {
    const { apiWidgets, addApiWidget } = useSettingsStore();
    const [showAdd, setShowAdd] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    const [name, setName] = useState("");
    const [url, setUrl] = useState(TEMPLATES[0].url);
    const [refreshInterval, setRefreshInterval] = useState(0);

    const handleAdd = () => {
        if (!name.trim() || !url.trim()) return;
        addApiWidget({
            name: name.trim(),
            template: TEMPLATES[selectedTemplate].template,
            url: url.trim(),
            headers: {},
            refreshInterval,
        });
        setName("");
        setUrl(TEMPLATES[0].url);
        setShowAdd(false);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Existing instances */}
            {apiWidgets.map((w) => (
                <ApiWidgetCard key={w.id} instance={w} />
            ))}

            {apiWidgets.length === 0 && !showAdd && (
                <p className="text-xs text-center py-2" style={{ color: "var(--color-text-muted)" }}>
                    No API widgets configured. Add one below!
                </p>
            )}

            {/* Add form */}
            {showAdd ? (
                <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <PortalSelect
                        value={String(selectedTemplate)}
                        onChange={(val) => {
                            const idx = Number(val);
                            setSelectedTemplate(idx);
                            setUrl(TEMPLATES[idx].url);
                            setName(TEMPLATES[idx].name);
                        }}
                        options={TEMPLATES.map((t, i) => ({
                            label: t.name,
                            value: String(i),
                        }))}
                        className="w-full"
                    />
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Widget name"
                        className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)]"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="API URL"
                        className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)]"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="btn-accent text-xs px-3 py-1">Add</button>
                        <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs px-3 py-1">Cancel</button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => { setShowAdd(true); setName(TEMPLATES[0].name); }}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl transition-all hover:bg-white/[0.03]"
                    style={{ color: "var(--color-text-muted)", border: "1px dashed rgba(255,255,255,0.08)" }}
                >
                    <Plus size={12} /> Add API Widget
                </button>
            )}
        </div>
    );
}
