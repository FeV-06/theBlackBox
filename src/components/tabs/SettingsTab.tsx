"use client";

import { useState, useRef, useEffect } from "react";
import {
    Download, Upload, ToggleLeft, ToggleRight, Palette, Puzzle, Trash2,
    LogIn, LogOut, User, Loader2, Plus, Copy, Lock, Unlock,
    LayoutTemplate, Save, Command
} from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { QuoteVibe } from "@/types/widget";
import type { WidgetType } from "@/types/widgetInstance";
import { useTemplateStore } from "@/store/useTemplateStore";
import { DEFAULT_TEMPLATES, TemplatePreset } from "@/lib/defaultTemplates";
import { cn } from "@/lib/utils";
import { useIsMounted } from "@/hooks/useIsMounted";
function SettingsCard({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
    return (
        <div className={cn("glass-card p-5 h-full", className)} style={style}>
            {children}
        </div>
    );
}

const VIBES: { value: QuoteVibe; label: string }[] = [
    { value: "motivational", label: "💪 Motivational" },
    { value: "anime", label: "⚡ Anime" },
    { value: "tech", label: "💻 Tech" },
    { value: "random", label: "🎲 Random" },
];

export default function SettingsTab() {
    const { instances, layout, toggleInstance, removeInstance, addInstance, duplicateInstance, resetToDefaults, toggleInstanceLock } = useWidgetStore();
    const { quoteVibe, setQuoteVibe, apiWidgets, deleteApiWidget, commandPaletteTheme, setCommandPaletteTheme } = useSettingsStore();
    const { isConnected, user, loading, signInWithGoogle, signOut } = useAuthStore();
    const profilePicture = user?.user_metadata?.avatar_url as string | undefined;
    const profileName = user?.user_metadata?.full_name as string | undefined;
    const profileEmail = user?.email;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState("");
    const [disconnecting, setDisconnecting] = useState(false);
    const [selectedType, setSelectedType] = useState<WidgetType>("todo");
    const isMounted = useIsMounted();

    // Mouse Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const parallaxX = useTransform(springX, [0, 1000], [5, -5]);
    const parallaxY = useTransform(springY, [0, 1000], [5, -5]);
    const heavyParallaxX = useTransform(springX, [0, 1000], [15, -15]);
    const heavyParallaxY = useTransform(springY, [0, 1000], [15, -15]);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };



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
        await signOut();
        setDisconnecting(false);
    };

    const handleAddWidget = () => {
        addInstance(selectedType);
    };

    // Build a map for registry lookup
    const registryMap = new Map(WIDGET_REGISTRY.map((d) => [d.type, d]));

    if (!isMounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-32 bg-white/5 rounded" /><div className="h-64 bg-white/5 rounded-2xl" /></div>;

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            initial="initial"
            animate="animate"
            variants={{
                initial: { opacity: 0 },
                animate: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                }
            }}
            className="max-w-3xl mx-auto relative px-4 py-6 md:px-0"
        >
            {/* Fragmentation Layer: Kinetic Background Decoration */}
            <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden"
            >
                <div className="absolute top-0 right-1/4 w-px h-full bg-white shadow-[0_0_15px_white]" />
                <div className="absolute bottom-1/3 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                <motion.div
                    style={{ x: heavyParallaxX, y: heavyParallaxY, rotate: 15 }}
                    className="absolute top-24 -left-24 w-96 h-96 border border-white opacity-20"
                />
                {/* Kinetic Grain Layer */}
                <div className="absolute inset-0 noise-overlay opacity-[0.15] mix-blend-overlay" />
            </motion.div>

            {/* Editorial Watermark - Kinetic Editorial Layering */}
            <motion.div
                style={{ x: heavyParallaxX, y: heavyParallaxY, color: "var(--color-text-primary)" }}
                className="absolute -top-12 opacity-5 select-none pointer-events-none transition-all duration-700 font-black text-9xl tracking-[-0.05em] translate-y-2"
            >
                SETTINGS
            </motion.div>

            {/* Header Spacer - Maintains editorial balance without redundant text */}
            <div className="h-12 mb-8 relative z-10" />

            <div className="flex flex-col gap-6 relative z-10">
                {/* Command Palette Theme */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <SettingsCard className="border-l-4" style={{ borderLeftColor: "var(--color-accent)" }}>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                            <Command size={16} style={{ color: "var(--color-accent)" }} /> Command Palette Theme
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(["default", "terminal", "creative", "ai", "focus", "mocha"] as const).map((t) => (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
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
                                </motion.button>
                            ))}
                        </div>
                    </SettingsCard>
                </motion.div>

                {/* Google Account */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <SettingsCard>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                            <User size={16} /> Google Account
                        </h3>
                        {isConnected ? (
                            <div className="flex items-center gap-4">
                                {profilePicture ? (
                                    <img src={profilePicture} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,92,255,0.15)" }}>
                                        <User size={18} style={{ color: "var(--color-accent)" }} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{profileName || "Connected"}</p>
                                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{profileEmail}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-1.5"
                                    style={{ color: "var(--color-danger)" }}
                                >
                                    {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                                    Disconnect
                                </motion.button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <p className="flex-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Connect for Calendar & Gmail integration</p>
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={signInWithGoogle}
                                    disabled={loading}
                                    className="btn-accent text-xs flex items-center gap-1.5 px-3 py-1.5"
                                >
                                    {loading ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                                    Connect
                                </motion.button>
                            </div>
                        )}
                    </SettingsCard>
                </motion.div>

                {/* Export/Import */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <SettingsCard>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                            <Download size={16} /> Data Backup
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExport}
                                className="btn-accent flex items-center gap-2"
                            >
                                <Download size={14} /> Export JSON
                            </motion.button>
                            <motion.label
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn-ghost flex items-center gap-2 cursor-pointer"
                            >
                                <Upload size={14} /> Import JSON
                                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                            </motion.label>
                        </div>
                        {importStatus && <p className="text-xs mt-2" style={{ color: importStatus.startsWith("✓") ? "var(--color-success)" : "var(--color-danger)" }}>{importStatus}</p>}
                    </SettingsCard>
                </motion.div>

                {/* Template Manager */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <TemplateManager />
                </motion.div>


                {/* Widget Manager */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <SettingsCard>
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
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddWidget}
                                className="btn-accent px-3 py-2 flex items-center gap-1.5"
                            >
                                <Plus size={14} /> Add
                            </motion.button>
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
                                    <motion.div
                                        layout
                                        key={id}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.02]"
                                        style={{ background: "rgba(255,255,255,0.01)" }}
                                    >
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
                                    </motion.div>
                                );
                            })}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={resetToDefaults}
                            className="btn-ghost text-xs mt-3"
                        >
                            Reset to defaults
                        </motion.button>
                    </SettingsCard>
                </motion.div>

                {/* Quote vibe */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <SettingsCard>
                        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                            <Palette size={16} /> Quote Vibe
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {VIBES.map((v) => (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    key={v.value}
                                    onClick={() => setQuoteVibe(v.value)}
                                    className="px-4 py-2 rounded-xl text-sm transition-all"
                                    style={{
                                        background: quoteVibe === v.value ? "rgba(var(--color-primary-rgb), 0.15)" : "rgba(255,255,255,0.03)",
                                        color: quoteVibe === v.value ? "var(--color-accent)" : "var(--color-text-secondary)",
                                        border: quoteVibe === v.value ? "1px solid rgba(var(--color-primary-rgb), 0.3)" : "1px solid rgba(255,255,255,0.04)",
                                    }}>
                                    {v.label}
                                </motion.button>
                            ))}
                        </div>
                    </SettingsCard>
                </motion.div>

                {/* API widgets manager */}
                <motion.div variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}>
                    <SettingsCard>
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
                    </SettingsCard>
                </motion.div>
            </div>
        </motion.div>
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
        <SettingsCard>
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
                        <motion.div
                            layout
                            key={t.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.02]"
                            style={{ background: "rgba(255,255,255,0.01)" }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{t.name}</span>
                                    {isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">Default</span>}
                                </div>
                                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                                    {new Date(t.updatedAt).toLocaleDateString()} • {t.snapshot ? `${t.snapshot.layout.length} widgets` : "Built-in"}
                                </span>
                            </div>

                            <div className="flex items-center gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => applyTemplate(t.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}
                                >
                                    Apply
                                </motion.button>

                                <button onClick={() => duplicateTemplate(t.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }} title="Duplicate">
                                    <Copy size={13} />
                                </button>

                                {!isDefault && (
                                    <button onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--color-danger)" }} title="Delete">
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </SettingsCard>
    );
}
