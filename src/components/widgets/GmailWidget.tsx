"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail, RefreshCw, ExternalLink, LogIn, Search, Zap,
    ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Save, Bookmark,
} from "lucide-react";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import type { WidgetInstance } from "@/types/widgetInstance";
import type {
    GmailMailbox,
    GmailStatus,
    GmailCategory,
    GmailMessagePreview,
} from "@/types/gmail";

/* ── Deep-link hash per mailbox ── */
const MAILBOX_HASH: Record<GmailMailbox, string> = {
    inbox: "#inbox",
    sent: "#sent",
    drafts: "#drafts",
    spam: "#spam",
    trash: "#trash",
    starred: "#starred",
    important: "#imp",
    all: "#all",
};

/* ── Styling ── */
const selectClass =
    "bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1 text-[11px] outline-none focus:border-[color:var(--color-accent)] transition-colors cursor-pointer appearance-none";
const selectStyle: React.CSSProperties = {
    color: "var(--color-text-secondary)",
    background: "rgba(255,255,255,0.03)",
};
const optStyle: React.CSSProperties = { background: "#1B1B22" };

const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)] transition-colors";

const QUERY_CHIPS = [
    "from:",
    "subject:",
    "has:attachment",
    "newer_than:7d",
    "is:unread",
    "is:starred",
];

/* ── Helpers ── */
function formatEmailDate(raw: string): string {
    if (!raw) return "";
    try {
        const d = new Date(raw);
        const now = new Date();
        const isToday =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
        if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
        return raw.slice(0, 10);
    }
}

function cleanFrom(raw: string): string {
    const match = raw.match(/^"?([^"<]+)"?\s*</);
    if (match) return match[1].trim();
    return raw.replace(/<[^>]+>/g, "").trim() || raw;
}

/* ══════════════════════════════════════════════════════════════
   Add Preset Modal
   ══════════════════════════════════════════════════════════════ */
function AddPresetModal({
    onClose,
    initialQuery,
}: {
    onClose: () => void;
    initialQuery?: string;
}) {
    const { addGmailPreset, applyGmailPreset } = useSettingsStore();
    const [name, setName] = useState("");
    const [query, setQuery] = useState(initialQuery ?? "");

    const handleSave = () => {
        const id = addGmailPreset(name, query);
        if (id) {
            applyGmailPreset(id);
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl p-4 w-[90%] max-w-[300px] flex flex-col gap-3"
                style={{
                    background: "linear-gradient(135deg, rgba(24,24,30,0.98), rgba(18,18,22,0.99))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        New Preset
                    </h4>
                    <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
                        <X size={14} style={{ color: "var(--color-text-muted)" }} />
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Preset name"
                        className={inputClass}
                        style={{ color: "var(--color-text-primary)" }}
                        autoFocus
                    />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Gmail query (e.g. from:github)"
                        className={inputClass}
                        style={{ color: "var(--color-text-primary)" }}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !query.trim()}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-40"
                        style={{ background: "rgba(124,92,255,0.2)", color: "var(--color-accent)" }}
                    >
                        <Save size={11} /> Save & Apply
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Manage Presets Modal
   ══════════════════════════════════════════════════════════════ */
function ManagePresetsModal({ onClose }: { onClose: () => void }) {
    const { gmailPresets, updateGmailPreset, deleteGmailPreset } = useSettingsStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editQuery, setEditQuery] = useState("");

    const startEdit = (id: string) => {
        const p = gmailPresets.find((pr) => pr.id === id);
        if (!p) return;
        setEditingId(id);
        setEditName(p.name);
        setEditQuery(p.query);
    };

    const saveEdit = () => {
        if (editingId && editName.trim() && editQuery.trim()) {
            updateGmailPreset(editingId, { name: editName, query: editQuery });
        }
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this preset?")) {
            deleteGmailPreset(id);
            if (editingId === id) setEditingId(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl p-4 w-[90%] max-w-[340px] flex flex-col gap-3 max-h-[80%]"
                style={{
                    background: "linear-gradient(135deg, rgba(24,24,30,0.98), rgba(18,18,22,0.99))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
            >
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Manage Presets
                    </h4>
                    <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
                        <X size={14} style={{ color: "var(--color-text-muted)" }} />
                    </button>
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: "260px", scrollbarWidth: "thin", scrollbarColor: "rgba(124,92,255,0.25) transparent" }}>
                    {gmailPresets.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>No presets yet.</p>
                    )}
                    {gmailPresets.map((p) => (
                        <div
                            key={p.id}
                            className="rounded-lg px-3 py-2 flex flex-col gap-1.5"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                        >
                            {editingId === p.id ? (
                                <div className="flex flex-col gap-1.5">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className={inputClass}
                                        style={{ color: "var(--color-text-primary)" }}
                                        autoFocus
                                    />
                                    <input
                                        value={editQuery}
                                        onChange={(e) => setEditQuery(e.target.value)}
                                        className={inputClass}
                                        style={{ color: "var(--color-text-primary)" }}
                                    />
                                    <div className="flex justify-end gap-1.5">
                                        <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-1 rounded" style={{ color: "var(--color-text-muted)" }}>
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            disabled={!editName.trim() || !editQuery.trim()}
                                            className="text-[10px] px-2 py-1 rounded font-medium disabled:opacity-40"
                                            style={{ background: "rgba(124,92,255,0.15)", color: "var(--color-accent)" }}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{p.name}</p>
                                        <p className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>{p.query}</p>
                                    </div>
                                    <button onClick={() => startEdit(p.id)} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
                                        <Pencil size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-danger)" }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[11px] font-medium self-end" style={{ color: "var(--color-text-muted)" }}>
                    Done
                </button>
            </motion.div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Gmail Widget
   ══════════════════════════════════════════════════════════════ */
export default function GmailWidget({ instance }: { instance: WidgetInstance }) {
    const { isConnected, connectWithPopup, checkConnection } = useGoogleAuthStore();
    const { gmailPresets } = useSettingsStore();
    const { updateInstanceConfig } = useWidgetStore();

    // Per-instance config (with defaults)
    const cfg = useMemo(() => ({
        mode: (instance.config.mode as string) ?? "basic",
        mailbox: (instance.config.mailbox as string) ?? "inbox",
        status: (instance.config.status as string) ?? "all",
        category: (instance.config.category as string) ?? "all",
        query: (instance.config.query as string) ?? "",
    }), [instance.config]);

    const setConfig = useCallback((partial: Record<string, unknown>) => {
        updateInstanceConfig(instance.instanceId, partial);
    }, [instance.instanceId, updateInstanceConfig]);

    const [messages, setMessages] = useState<GmailMessagePreview[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [localQuery, setLocalQuery] = useState(cfg.query);

    // Pagination
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [pageTokenStack, setPageTokenStack] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [showAddPreset, setShowAddPreset] = useState(false);
    const [showManagePresets, setShowManagePresets] = useState(false);

    const queryInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => { checkConnection(); }, [checkConnection]);
    useEffect(() => { setLocalQuery(cfg.query); }, [cfg.query]);

    /* ── Fetch ── */
    const fetchPage = useCallback(async (pageToken?: string) => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (cfg.mode === "advanced") {
                params.set("mode", "advanced");
                params.set("query", cfg.query);
            } else {
                params.set("mode", "basic");
                params.set("mailbox", cfg.mailbox);
                params.set("status", cfg.status);
                params.set("category", cfg.category);
            }
            if (pageToken) params.set("pageToken", pageToken);

            const res = await fetch(`/api/google/gmail/summary?${params}`);
            if (res.status === 401) { setError("Session expired. Reconnect Google."); return; }
            if (!res.ok) throw new Error("API error");
            const json = await res.json();
            setMessages(json.messages ?? []);
            setNextPageToken(json.nextPageToken ?? undefined);
            if (json.unreadCount !== undefined && json.unreadCount > 0) {
                setUnreadCount(json.unreadCount);
            }
            scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
            setError("Failed to load emails");
        } finally {
            setLoading(false);
        }
    }, [cfg.mode, cfg.mailbox, cfg.status, cfg.category, cfg.query]);

    // Reset pagination and fetch when filters change
    useEffect(() => {
        if (isConnected) {
            setPageTokenStack([]);
            setCurrentPage(1);
            setNextPageToken(undefined);
            fetchPage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, cfg.mode, cfg.mailbox, cfg.status, cfg.category, cfg.query]);

    const goNextPage = () => {
        if (!nextPageToken) return;
        setPageTokenStack((s) => [...s, nextPageToken]);
        setCurrentPage((p) => p + 1);
        fetchPage(nextPageToken);
    };

    const goPrevPage = () => {
        if (pageTokenStack.length <= 1) {
            setPageTokenStack([]);
            setCurrentPage(1);
            fetchPage();
            return;
        }
        const newStack = [...pageTokenStack];
        newStack.pop();
        const prevToken = newStack[newStack.length - 1];
        setPageTokenStack(newStack);
        setCurrentPage((p) => p - 1);
        fetchPage(prevToken);
    };

    const applyAdvancedQuery = () => {
        setConfig({ query: localQuery.trim() });
    };

    const insertChip = (chip: string) => {
        const next = localQuery ? `${localQuery} ${chip}` : chip;
        setLocalQuery(next);
        queryInputRef.current?.focus();
    };

    const gmailLink = (msgId: string) =>
        `https://mail.google.com/mail/u/0/${MAILBOX_HASH[cfg.mailbox as keyof typeof MAILBOX_HASH] ?? "#inbox"}/${msgId}`;

    // Active preset detection
    const activePresetId = gmailPresets.find((p) => p.query === cfg.query)?.id;

    /* ── Not connected ── */
    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Mail size={28} style={{ color: "var(--color-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Connect Google to see your inbox
                </p>
                <button onClick={connectWithPopup} className="btn-accent text-xs flex items-center gap-1.5 px-3 py-1.5">
                    <LogIn size={13} /> Connect Google
                </button>
            </div>
        );
    }

    /* ── Loading first page ── */
    if (loading && messages.length === 0 && !error) {
        return (
            <div className="flex items-center justify-center py-8">
                <RefreshCw size={18} className="animate-spin" style={{ color: "var(--color-accent)" }} />
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div className="flex flex-col items-center py-6 gap-2">
                <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>
                <button onClick={() => fetchPage()} className="btn-ghost text-xs">Retry</button>
            </div>
        );
    }

    /* ── Pagination controls (reused in both modes) ── */
    const paginationControls = (
        <div className="flex items-center gap-1 ml-auto">
            <button
                onClick={goPrevPage}
                disabled={currentPage <= 1 || loading}
                className="p-1 rounded-md transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
                <ChevronLeft size={12} />
            </button>
            <span className="text-[10px] px-1" style={{ color: "var(--color-text-muted)" }}>pg {currentPage}</span>
            <button
                onClick={goNextPage}
                disabled={!nextPageToken || loading}
                className="p-1 rounded-md transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
                <ChevronRight size={12} />
            </button>
        </div>
    );

    return (
        <div className="flex flex-col gap-2 relative" style={{ minHeight: 0 }}>
            {/* Modals */}
            <AnimatePresence>
                {showAddPreset && (
                    <AddPresetModal
                        key="add"
                        onClose={() => setShowAddPreset(false)}
                        initialQuery={localQuery}
                    />
                )}
                {showManagePresets && (
                    <ManagePresetsModal key="manage" onClose={() => setShowManagePresets(false)} />
                )}
            </AnimatePresence>

            {/* ═══════ HEADER ═══════ */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,92,255,0.12)" }}>
                        <Mail size={14} style={{ color: "var(--color-accent)" }} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{unreadCount}</span>
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>unread</span>
                    </div>
                </div>
                <button
                    onClick={() => fetchPage()}
                    disabled={loading}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* ═══════ MODE TOGGLE ═══════ */}
            <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                    onClick={() => setConfig({ mode: "basic" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium transition-all"
                    style={{
                        background: cfg.mode === "basic" ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.02)",
                        color: cfg.mode === "basic" ? "var(--color-accent)" : "var(--color-text-muted)",
                    }}
                >
                    <Mail size={11} /> Filters
                </button>
                <button
                    onClick={() => setConfig({ mode: "advanced" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium transition-all"
                    style={{
                        background: cfg.mode === "advanced" ? "rgba(124,92,255,0.15)" : "rgba(255,255,255,0.02)",
                        color: cfg.mode === "advanced" ? "var(--color-accent)" : "var(--color-text-muted)",
                        borderLeft: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <Search size={11} /> Query
                </button>
            </div>

            {/* ═══════ BASIC FILTERS ═══════ */}
            {cfg.mode === "basic" && (
                <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    <select value={cfg.mailbox} onChange={(e) => setConfig({ mailbox: e.target.value })} className={selectClass} style={selectStyle}>
                        <option value="inbox" style={optStyle}>Inbox</option>
                        <option value="sent" style={optStyle}>Sent</option>
                        <option value="drafts" style={optStyle}>Drafts</option>
                        <option value="starred" style={optStyle}>Starred</option>
                        <option value="important" style={optStyle}>Important</option>
                        <option value="spam" style={optStyle}>Spam</option>
                        <option value="trash" style={optStyle}>Trash</option>
                        <option value="all" style={optStyle}>All Mail</option>
                    </select>
                    <select value={cfg.status} onChange={(e) => setConfig({ status: e.target.value })} className={selectClass} style={selectStyle}>
                        <option value="all" style={optStyle}>All</option>
                        <option value="unread" style={optStyle}>Unread</option>
                        <option value="read" style={optStyle}>Read</option>
                    </select>
                    <select value={cfg.category} onChange={(e) => setConfig({ category: e.target.value })} className={selectClass} style={selectStyle}>
                        <option value="all" style={optStyle}>All Categories</option>
                        <option value="primary" style={optStyle}>Primary</option>
                        <option value="promotions" style={optStyle}>Promos</option>
                        <option value="social" style={optStyle}>Social</option>
                        <option value="updates" style={optStyle}>Updates</option>
                        <option value="forums" style={optStyle}>Forums</option>
                    </select>
                    {paginationControls}
                </div>
            )}

            {/* ═══════ ADVANCED QUERY ═══════ */}
            {cfg.mode === "advanced" && (
                <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Query input row */}
                    <div className="flex gap-1.5">
                        <input
                            ref={queryInputRef}
                            type="text"
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") applyAdvancedQuery(); }}
                            placeholder="from:github newer_than:7d"
                            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)] transition-colors"
                            style={{ color: "var(--color-text-primary)" }}
                        />
                        <button
                            onClick={applyAdvancedQuery}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all hover:opacity-90"
                            style={{ background: "rgba(124,92,255,0.2)", color: "var(--color-accent)" }}
                        >
                            <Zap size={11} />
                        </button>
                        {/* Save current query as preset */}
                        <button
                            onClick={() => setShowAddPreset(true)}
                            className="px-2 py-1.5 rounded-lg text-[11px] transition-all hover:bg-white/[0.04]"
                            style={{ color: "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
                            title="Save as preset"
                        >
                            <Bookmark size={12} />
                        </button>
                    </div>

                    {/* Preset dropdown row */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value={activePresetId ?? ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                    const preset = gmailPresets.find(p => p.id === val);
                                    if (preset) {
                                        setConfig({ mode: "advanced", query: preset.query });
                                        setLocalQuery(preset.query);
                                    }
                                }
                            }}
                            className={selectClass + " flex-1 min-w-0"}
                            style={activePresetId ? { color: "var(--color-accent)", background: "rgba(124,92,255,0.08)", borderColor: "rgba(124,92,255,0.25)" } : selectStyle}
                        >
                            <option value="" disabled style={optStyle}>Select a preset…</option>
                            {gmailPresets.map((p) => (
                                <option key={p.id} value={p.id} style={optStyle}>{p.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowAddPreset(true)}
                            className="p-1 rounded-md transition-all hover:bg-white/[0.04]"
                            style={{ color: "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
                            title="Add preset"
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={() => setShowManagePresets(true)}
                            className="p-1 rounded-md transition-all hover:bg-white/[0.04]"
                            style={{ color: "var(--color-text-muted)", border: "1px solid rgba(255,255,255,0.06)" }}
                            title="Manage presets"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>

                    {/* Keywords dropdown + pagination */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value=""
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) { insertChip(val); e.target.value = ""; }
                            }}
                            className={selectClass}
                            style={selectStyle}
                        >
                            <option value="" disabled style={optStyle}>Insert keyword…</option>
                            {QUERY_CHIPS.map((chip) => (
                                <option key={chip} value={chip} style={optStyle}>{chip}</option>
                            ))}
                        </select>
                        {paginationControls}
                    </div>
                </div>
            )}

            {/* ═══════ SCROLL-LOCKED MESSAGE LIST ═══════ */}
            <div
                ref={scrollRef}
                className="flex flex-col gap-0.5 overflow-y-auto flex-1"
                style={{
                    maxHeight: "300px",
                    minHeight: "80px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(124,92,255,0.25) transparent",
                }}
            >
                {messages.map((msg, i) => (
                    <motion.a
                        key={msg.id}
                        href={gmailLink(msg.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg group transition-all hover:bg-white/[0.03]"
                        style={{ border: "1px solid transparent", flexShrink: 0 }}
                        onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = "rgba(124,92,255,0.2)";
                            el.style.boxShadow = "0 0 8px rgba(124,92,255,0.08)";
                        }}
                        onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.borderColor = "transparent";
                            el.style.boxShadow = "none";
                        }}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{msg.subject}</p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>{cleanFrom(msg.from)}</p>
                            {msg.snippet && (
                                <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--color-text-muted)", opacity: 0.6 }}>{msg.snippet}</p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                            <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{formatEmailDate(msg.date)}</span>
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-text-muted)" }} />
                        </div>
                    </motion.a>
                ))}

                {messages.length === 0 && !loading && (
                    <div className="text-center py-4">
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No messages found for this filter.</p>
                    </div>
                )}

                {loading && messages.length > 0 && (
                    <div className="flex justify-center py-3">
                        <RefreshCw size={14} className="animate-spin" style={{ color: "var(--color-accent)" }} />
                    </div>
                )}
            </div>
        </div>
    );
}
