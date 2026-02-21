"use client";

import { useState, useRef, useEffect } from "react";
import {
    Download, Upload, ToggleLeft, ToggleRight, Palette, Puzzle, Trash2,
    LogIn, LogOut, User, Loader2, Plus, Copy, Lock, Unlock,
    LayoutTemplate, Save, Command
} from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import type { QuoteVibe } from "@/types/widget";
import type { WidgetType } from "@/types/widgetInstance";
import { useTemplateStore } from "@/store/useTemplateStore";
import { DEFAULT_TEMPLATES, TemplatePreset } from "@/lib/defaultTemplates";
import { cn } from "@/lib/utils";
import { useIsMounted } from "@/hooks/useIsMounted";

const VIBES: { value: QuoteVibe; label: string }[] = [
    { value: "motivational", label: "💪 Motivational" },
    { value: "anime", label: "⚡ Anime" },
    { value: "tech", label: "💻 Tech" },
    { value: "random", label: "🎲 Random" },
];

export default function SettingsTab() {
    const { instances, layout, toggleInstance, removeInstance, addInstance, duplicateInstance, resetToDefaults, toggleInstanceLock } = useWidgetStore();
    const { quoteVibe, setQuoteVibe, apiWidgets, deleteApiWidget, commandPaletteTheme, setCommandPaletteTheme } = useSettingsStore();
    const { isConnected, profile, loading, connectWithPopup, disconnect, checkConnection } = useGoogleAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState("");
    const [disconnecting, setDisconnecting] = useState(false);
    const [selectedType, setSelectedType] = useState<WidgetType>("todo");
    const isMounted = useIsMounted();

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

    const handleAddWidget = () => {
        addInstance(selectedType);
    };

    // Build a map for registry lookup
    const registryMap = new Map(WIDGET_REGISTRY.map((d) => [d.type, d]));

    if (!isMounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-32 bg-white/5 rounded" /><div className="h-64 bg-white/5 rounded-2xl" /></div>;

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>Settings</h1>

            <div className="flex flex-col gap-6">
                {/* Command Palette Theme */}
                <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: "var(--color-accent)" }}>
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <Command size={16} style={{ color: "var(--color-accent)" }} /> Command Palette Theme
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {(["default", "terminal", "creative", "ai", "focus", "mocha"] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setCommandPaletteTheme(t)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm transition-all capitalize",
                                    commandPaletteTheme === t
                                        ? "" // Use style below
                                        : "bg-white/[0.03] text-white/70 border border-white/[0.04] hover:bg-white/[0.06]",
                                )}
                                style={commandPaletteTheme === t ? { background: "var(--color-accent-glow)", color: "var(--color-accent)", border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" } : undefined}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

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

                {/* Template Manager */}
                <TemplateManager />


                {/* Widget Manager */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                        <Puzzle size={16} /> Widget Manager
                    </h3>

                    {/* Add widget */}
                    <div className="flex gap-2 mb-4">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as WidgetType)}
                            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs outline-none focus:border-[color:var(--color-accent)]"
                            style={{ color: "var(--color-text-primary)", background: "rgba(255,255,255,0.03)" }}
                        >
                            {WIDGET_REGISTRY.map((def) => (
                                <option key={def.type} value={def.type} style={{ background: "#14141a", color: "#e8e8f0" }}>
                                    {def.defaultTitle} {def.allowMultiple ? "" : "(single)"}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddWidget} className="btn-accent px-3 py-2 flex items-center gap-1.5">
                            <Plus size={14} /> Add
                        </button>
                    </div>

                    {/* Instance list */}
                    <div className="flex flex-col gap-2">
                        {layout.map((id) => {
                            const inst = instances[id];
                            if (!inst) return null;
                            const def = registryMap.get(inst.type);
                            const Icon = def?.icon ?? Puzzle;
                            const title = inst.title ?? def?.defaultTitle ?? inst.type;
                            return (
                                <div key={id} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.02]" style={{ background: "rgba(255,255,255,0.01)" }}>
                                    <Icon size={16} style={{ color: inst.enabled ? "var(--color-accent)" : "var(--color-text-muted)" }} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm block truncate" style={{ color: inst.enabled ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{title}</span>
                                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{inst.type}</span>
                                    </div>
                                    <button onClick={() => toggleInstanceLock(id)} className="p-1" title={inst.isLocked ? "Unlock" : "Lock"}>
                                        {inst.isLocked
                                            ? <Lock size={16} style={{ color: "var(--color-accent)" }} />
                                            : <Unlock size={16} style={{ color: "var(--color-text-muted)" }} />
                                        }
                                    </button>
                                    <button onClick={() => toggleInstance(id)} className="p-1" title={inst.enabled ? "Disable" : "Enable"}>
                                        {inst.enabled
                                            ? <ToggleRight size={20} style={{ color: "var(--color-accent)" }} />
                                            : <ToggleLeft size={20} style={{ color: "var(--color-text-muted)" }} />
                                        }
                                    </button>
                                    <button onClick={() => duplicateInstance(id)} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }} title="Duplicate">
                                        <Copy size={13} />
                                    </button>
                                    <button onClick={() => removeInstance(id)} className="p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-danger)" }} title="Delete">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={resetToDefaults} className="btn-ghost text-xs mt-3">Reset to defaults</button>
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

function TemplateManager() {
    const { templates, applyTemplate, createFromCurrent, deleteTemplate, duplicateTemplate } = useTemplateStore();
    const [newTemplateName, setNewTemplateName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Combine defaults and user templates
    const allTemplates = [...DEFAULT_TEMPLATES, ...templates];

    const handleCreate = () => {
        if (!newTemplateName.trim()) return;
        createFromCurrent(newTemplateName);
        setNewTemplateName("");
        setIsCreating(false);
    };

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                    <LayoutTemplate size={16} /> Dashboard Templates
                </h3>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="btn-accent text-xs flex items-center gap-1.5 px-3 py-1.5"
                >
                    <Save size={13} /> Save Current
                </button>
            </div>

            {isCreating && (
                <div className="flex gap-2 mb-4 animate-fade-in">
                    <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Template Name..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs outline-none"
                        style={{ color: "var(--color-text-primary)" }}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <button onClick={handleCreate} className="btn-accent px-3 py-1 text-xs">Save</button>
                    <button onClick={() => setIsCreating(false)} className="btn-ghost px-3 py-1 text-xs">Cancel</button>
                </div>
            )}

            <div className="flex flex-col gap-2">
                {allTemplates.map(t => {
                    const isDefault = !!t.isDefault;
                    return (
                        <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.02]" style={{ background: "rgba(255,255,255,0.01)" }}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{t.name}</span>
                                    {isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">Default</span>}
                                </div>
                                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                                    {new Date(t.updatedAt).toLocaleDateString()} • {t.snapshot.layout.length} widgets
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => applyTemplate(t.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}
                                >
                                    Apply
                                </button>

                                <button onClick={() => duplicateTemplate(t.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }} title="Duplicate">
                                    <Copy size={13} />
                                </button>

                                {!isDefault && (
                                    <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-danger)" }} title="Delete">
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
