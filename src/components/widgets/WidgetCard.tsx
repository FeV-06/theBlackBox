"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { GripVertical, MoreVertical, Pencil, Copy, Trash2, Check, X } from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import type { WidgetInstance, WidgetTypeDefinition } from "@/types/widgetInstance";

interface WidgetCardProps {
    instance: WidgetInstance;
    definition: WidgetTypeDefinition;
    children: ReactNode;
    dragHandleProps?: Record<string, unknown>;
    className?: string;
}

export default function WidgetCard({
    instance,
    definition,
    children,
    dragHandleProps,
    className = "",
}: WidgetCardProps) {
    const { removeInstance, renameInstance, duplicateInstance } = useWidgetStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const title = instance.title ?? definition.defaultTitle;
    const Icon = definition.icon;

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    // Auto-focus rename input
    useEffect(() => {
        if (renaming) inputRef.current?.focus();
    }, [renaming]);

    const startRename = () => {
        setRenameValue(title);
        setRenaming(true);
        setMenuOpen(false);
    };

    const confirmRename = () => {
        renameInstance(instance.instanceId, renameValue);
        setRenaming(false);
    };

    const cancelRename = () => {
        setRenaming(false);
    };

    const handleDuplicate = () => {
        duplicateInstance(instance.instanceId);
        setMenuOpen(false);
    };

    const handleDelete = () => {
        removeInstance(instance.instanceId);
        setMenuOpen(false);
    };

    return (
        <div className={`glass-card flex flex-col overflow-hidden ${className}`}>
            {/* Title bar */}
            <div
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
                {dragHandleProps && (
                    <button
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/5 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <GripVertical size={16} />
                    </button>
                )}
                <Icon size={16} style={{ color: "var(--color-accent)" }} />

                {/* Title / Rename */}
                {renaming ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") confirmRename();
                                if (e.key === "Escape") cancelRename();
                            }}
                            className="flex-1 min-w-0 bg-white/[0.05] border border-white/[0.1] rounded px-2 py-0.5 text-sm outline-none focus:border-[color:var(--color-accent)]"
                            style={{ color: "var(--color-text-primary)" }}
                        />
                        <button onClick={confirmRename} className="p-0.5 rounded hover:bg-white/5" style={{ color: "var(--color-success)" }}>
                            <Check size={14} />
                        </button>
                        <button onClick={cancelRename} className="p-0.5 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}>
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>
                        {title}
                    </span>
                )}

                {/* 3-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        <MoreVertical size={14} />
                    </button>

                    {menuOpen && (
                        <div
                            className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-[140px]"
                            style={{
                                background: "rgba(20,20,26,0.98)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            <button
                                onClick={startRename}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                <Pencil size={12} /> Rename
                            </button>
                            <button
                                onClick={handleDuplicate}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                <Copy size={12} /> Duplicate
                            </button>
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                            <button
                                onClick={handleDelete}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                style={{ color: "var(--color-danger)" }}
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Content */}
            <div className="flex-1 p-3 md:p-4 overflow-auto">{children}</div>
        </div>
    );
}
