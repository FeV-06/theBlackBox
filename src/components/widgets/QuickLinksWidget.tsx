"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2, Link2 } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetInstance } from "@/types/widgetInstance";

export default function QuickLinksWidget({ instance }: { instance: WidgetInstance }) {
    const { bookmarks, addBookmark, deleteBookmark } = useSettingsStore();
    const [showAdd, setShowAdd] = useState(false);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");

    const handleAdd = () => {
        if (!title.trim() || !url.trim()) return;
        addBookmark(title.trim(), url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
        setTitle("");
        setUrl("");
        setShowAdd(false);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Links grid */}
            <div className="grid grid-cols-3 gap-2">
                <AnimatePresence>
                    {bookmarks.map((bm) => (
                        <motion.a
                            key={bm.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            href={bm.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/[0.04] transition-all group"
                            style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                style={{ background: "rgba(124,92,255,0.12)", color: "var(--color-accent)" }}
                            >
                                {bm.title.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs truncate w-full text-center" style={{ color: "var(--color-text-secondary)" }}>
                                {bm.title}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    deleteBookmark(bm.id);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all"
                                style={{ color: "var(--color-danger)" }}
                            >
                                <Trash2 size={10} />
                            </button>
                        </motion.a>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add toggle */}
            {showAdd ? (
                <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[color:var(--color-accent)]"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="URL"
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
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
                    onClick={() => setShowAdd(true)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs rounded-xl transition-all hover:bg-white/[0.03]"
                    style={{ color: "var(--color-text-muted)", border: "1px dashed rgba(255,255,255,0.08)" }}
                >
                    <Plus size={12} /> Add Link
                </button>
            )}
        </div>
    );
}
