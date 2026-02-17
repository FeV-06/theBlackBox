"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Download, Upload, ToggleLeft, ToggleRight, Palette, Puzzle, Trash2,
    LogIn, LogOut, User, Loader2,
} from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";
import { WIDGET_DEFS } from "@/components/widgets/WidgetGrid";
import type { QuoteVibe } from "@/types/widget";

const VIBES: { value: QuoteVibe; label: string }[] = [
    { value: "motivational", label: "💪 Motivational" },
    { value: "anime", label: "⚡ Anime" },
    { value: "tech", label: "💻 Tech" },
    { value: "random", label: "🎲 Random" },
];

export default function SettingsTab() {
    const { enabled, toggle, reset: resetWidgets } = useWidgetStore();
    const { quoteVibe, setQuoteVibe, apiWidgets, deleteApiWidget } = useSettingsStore();
    const { isConnected, profile, loading, connectWithPopup, disconnect, checkConnection } = useGoogleAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState("");
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => { checkConnection(); }, [checkConnection]);

    const handleExport = () => {
        const data: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("tbb-")) data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `TheBlackBox-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                Object.entries(data).forEach(([key, val]) => {
                    if (key.startsWith("tbb-") && typeof val === "string") localStorage.setItem(key, val);
                });
                setImportStatus("✓ Imported! Refresh to see changes.");
            } catch { setImportStatus("✗ Invalid file."); }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        await disconnect();
        setDisconnecting(false);
    };

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>Settings</h1>

            <div className="flex flex-col gap-6">
                {/* Google Account */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <User size={16} /> Google Account
                    </h3>
                    {isConnected ? (
                        <div className="flex items-center gap-4">
                            {profile?.picture ? (
                                <img src={profile.picture} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,92,255,0.15)" }}>
                                    <User size={18} style={{ color: "var(--color-accent)" }} />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{profile?.name || "Connected"}</p>
                                <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{profile?.email}</p>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                                className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5"
                                style={{ color: "var(--color-danger)" }}
                            >
                                {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <p className="flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Connect for Calendar & Gmail integration</p>
                            <button
                                onClick={connectWithPopup}
                                disabled={loading}
                                className="btn-accent text-xs flex items-center gap-1.5 px-3 py-1.5"
                            >
                                {loading ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                                Connect
                            </button>
                        </div>
                    )}
                </div>

                {/* Export/Import */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <Download size={16} /> Data Backup
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleExport} className="btn-accent flex items-center gap-2">
                            <Download size={14} /> Export JSON
                        </button>
                        <label className="btn-ghost flex items-center gap-2 cursor-pointer">
                            <Upload size={14} /> Import JSON
                            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                    {importStatus && <p className="text-xs mt-2" style={{ color: importStatus.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)" }}>{importStatus}</p>}
                </div>

                {/* Widget toggles */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <ToggleRight size={16} /> Widget Visibility
                    </h3>
                    <div className="flex flex-col gap-2">
                        {WIDGET_DEFS.map((w) => {
                            const on = enabled[w.id];
                            const Icon = w.icon;
                            return (
                                <button key={w.id} onClick={() => toggle(w.id)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.02]"
                                    style={{ background: "rgba(255,255,255,0.01)" }}>
                                    <Icon size={16} style={{ color: on ? "var(--color-accent)" : "var(--color-text-muted)" }} />
                                    <span className="flex-1 text-left text-sm" style={{ color: on ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{w.title}</span>
                                    {on ? <ToggleRight size={20} style={{ color: "var(--color-accent)" }} /> : <ToggleLeft size={20} style={{ color: "var(--color-text-muted)" }} />}
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={resetWidgets} className="btn-ghost text-xs mt-3">Reset to defaults</button>
                </div>

                {/* Quote vibe */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <Palette size={16} /> Quote Vibe
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {VIBES.map((v) => (
                            <button key={v.value} onClick={() => setQuoteVibe(v.value)}
                                className="px-4 py-2 rounded-xl text-sm transition-all"
                                style={{
                                    background: quoteVibe === v.value ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.03)",
                                    color: quoteVibe === v.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                                    border: quoteVibe === v.value ? "1px solid rgba(124,92,255,0.3)" : "1px solid rgba(255,255,255,0.04)",
                                }}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* API widgets manager */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <Puzzle size={16} /> Custom API Widgets
                    </h3>
                    {apiWidgets.length === 0 ? (
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No API widgets configured. Add them from the Dashboard widget grid.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {apiWidgets.map((w) => (
                                <div key={w.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                                    <span className="flex-1 text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{w.name}</span>
                                    <span className="text-xs truncate max-w-40" style={{ color: "var(--color-text-muted)" }}>{w.url}</span>
                                    <button onClick={() => deleteApiWidget(w.id)} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-danger)" }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
