"use client";

import { useState, useRef, useEffect } from "react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";

export default function CanvasSelector() {
    const { canvases, activeCanvasId, switchCanvas, addCanvas, renameCanvas, deleteCanvas } = useWidgetStore();
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const activeCanvas = canvases.find(c => c.id === activeCanvasId) || canvases[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setEditingId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    const handleRenameSubmit = (id: string) => {
        if (editName.trim()) {
            renameCanvas(id, editName.trim());
        }
        setEditingId(null);
    };

    const handleCreateNew = () => {
        const newId = addCanvas("New Canvas");
        switchCanvas(newId);
        setEditingId(newId);
        setEditName("New Canvas");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            >
                <span className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {activeCanvas?.name || "Dashboard"}
                </span>
                <ChevronDown size={18} className={`transition-transform duration-200 opacity-50 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl border border-white/10 bg-[var(--color-bg-elevated)] shadow-2xl z-50 overflow-hidden select-none animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto p-1 scrollbar-none">
                        {canvases.map((canvas) => (
                            <div
                                key={canvas.id}
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeCanvasId === canvas.id ? "bg-[var(--color-accent-dim)]/20 text-[var(--color-accent)]" : "hover:bg-white/5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                    }`}
                                onClick={() => {
                                    if (editingId !== canvas.id) {
                                        switchCanvas(canvas.id);
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {editingId === canvas.id ? (
                                    <input
                                        ref={inputRef}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => handleRenameSubmit(canvas.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleRenameSubmit(canvas.id);
                                            if (e.key === "Escape") setEditingId(null);
                                        }}
                                        className="bg-black/50 border border-[var(--color-accent)]/30 rounded px-2 py-0.5 text-sm w-full focus:outline-none focus:border-[var(--color-accent)]"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="truncate text-sm font-medium">{canvas.name}</span>
                                )}

                                {editingId !== canvas.id && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingId(canvas.id);
                                                setEditName(canvas.name);
                                            }}
                                            className="p-1 hover:bg-white/10 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        {canvases.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCanvas(canvas.id);
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-1 border-t border-white/10 bg-[var(--color-bg-elevated)]">
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <Plus size={14} />
                            <span>Create Canvas</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
