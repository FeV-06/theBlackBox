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
import { SkeletonEmailRow } from "@/components/ui/Skeleton";
import type {
    GmailMailbox,
    GmailStatus,
    GmailCategory,
    GmailMessagePreview,
} from "@/types/gmail";
import { PortalSelect } from "@/components/ui/PortalSelect";

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
            params.set("maxResults", "50");

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
        <div className="flex flex-col h-full gap-3 relative overflow-hidden">
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
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,92,255,0.12)" }}>
                        <Mail size={14} style={{ color: "var(--color-accent)" }} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{unreadCount}</span>
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>unread</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => fetchPage()}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    {paginationControls}
                </div>
            </div>

            {/* ═══════ MODE TOGGLE ═══════ */}
            <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                    onClick={() => setConfig({ mode: "basic" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{
                        background: cfg.mode === "basic" ? "rgba(124,92,255,0.12)" : "transparent",
                        color: cfg.mode === "basic" ? "var(--color-accent)" : "rgba(255,255,255,0.3)",
                    }}
                >
                    Filters
                </button>
                <button
                    onClick={() => setConfig({ mode: "advanced" })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{
                        background: cfg.mode === "advanced" ? "rgba(124,92,255,0.12)" : "transparent",
                        color: cfg.mode === "advanced" ? "var(--color-accent)" : "rgba(255,255,255,0.3)",
                        borderLeft: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    Query
                </button>
            </div>

            {/* ═══════ BASIC FILTERS ═══════ */}
            {cfg.mode === "basic" && (
                <div className="flex flex-wrap gap-1.5 shrink-0 z-10">
                    <PortalSelect
                        value={cfg.mailbox}
                        onChange={(val) => setConfig({ mailbox: val })}
                        options={[
                            { label: "Inbox", value: "inbox" },
                            { label: "Sent", value: "sent" },
                            { label: "Drafts", value: "drafts" },
                            { label: "Starred", value: "starred" },
                            { label: "Important", value: "important" },
                            { label: "Spam", value: "spam" },
                            { label: "Trash", value: "trash" },
                            { label: "All Mail", value: "all" },
                        ]}
                    />
                    <PortalSelect
                        value={cfg.status}
                        onChange={(val) => setConfig({ status: val })}
                        options={[
                            { label: "All Status", value: "all" },
                            { label: "Unread", value: "unread" },
                            { label: "Read", value: "read" },
                        ]}
                    />
                    <PortalSelect
                        value={cfg.category}
                        onChange={(val) => setConfig({ category: val })}
                        options={[
                            { label: "All Categories", value: "all" },
                            { label: "Primary", value: "primary" },
                            { label: "Promotions", value: "promotions" },
                            { label: "Social", value: "social" },
                            { label: "Updates", value: "updates" },
                            { label: "Forums", value: "forums" },
                        ]}
                    />
                </div>
            )}

            {/* ═══════ ADVANCED QUERY ═══════ */}
            {cfg.mode === "advanced" && (
                <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex gap-1.5">
                        <input
                            ref={queryInputRef}
                            type="text"
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") applyAdvancedQuery(); }}
                            placeholder="from:github newer_than:7d"
                            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)] transition-colors"
                            style={{ color: "var(--color-text-primary)" }}
                        />
                        <button
                            onClick={applyAdvancedQuery}
                            className="p-1.5 rounded-lg transition-all hover:bg-white/[0.04]"
                            style={{ color: "var(--color-accent)", border: "1px solid rgba(124,92,255,0.2)" }}
                        >
                            <Zap size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className="flex-1 overflow-x-auto whitespace-nowrap no-scrollbar flex items-center gap-1.5 py-0.5">
                            <button
                                onClick={() => setShowAddPreset(true)}
                                className="flex-shrink-0 p-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-white/30 hover:text-white/60 transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                            {gmailPresets.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setConfig({ mode: "advanced", query: p.query });
                                        setLocalQuery(p.query);
                                    }}
                                    className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${activePresetId === p.id
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                        : "bg-white/[0.03] border-white/5 text-white/30 hover:text-white/60"
                                        }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowManagePresets(true)}
                            className="p-1.5 rounded-lg border border-white/5 text-white/30 hover:text-white/60 transition-colors"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════ MESSAGE LIST ═══════ */}
            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1"
            >
                {messages.map((msg, i) => (
                    <motion.a
                        key={msg.id}
                        href={gmailLink(msg.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex flex-col gap-1 p-3 rounded-xl transition-all hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 truncate">
                                {cleanFrom(msg.from)}
                            </span>
                            <span className="text-[10px] opacity-20 whitespace-nowrap">{formatEmailDate(msg.date)}</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed line-clamp-1" style={{ color: "var(--color-text-primary)" }}>
                            {msg.subject || "(No Subject)"}
                        </p>
                        {msg.snippet && (
                            <p className="text-[10px] opacity-40 line-clamp-1 leading-relaxed">{msg.snippet}</p>
                        )}
                    </motion.a>
                ))}

                {loading && messages.length === 0 && !error && (
                    <div className="flex flex-col gap-0.5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonEmailRow key={i} />
                        ))}
                    </div>
                )}

                {messages.length === 0 && !loading && !error && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-2">
                        <Mail size={24} />
                        <p className="text-[10px] uppercase font-bold tracking-widest text-center px-4">
                            No messages found for this filter
                        </p>
                    </div>
                )}

                {loading && messages.length > 0 && (
                    <div className="flex justify-center py-4">
                        <RefreshCw size={14} className="animate-spin text-purple-400/50" />
                    </div>
                )}
            </div>
        </div>
    );
}
