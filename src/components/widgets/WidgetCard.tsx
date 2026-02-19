"use client";

import { ReactNode, useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, MoreVertical, Pencil, Copy, Trash2, Check, X, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown } from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { PortalMenu } from "@/components/ui/PortalMenu";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { WidgetInstance, WidgetTypeDefinition } from "@/types/widgetInstance";

interface WidgetCardProps {
    instance: WidgetInstance;
    definition: WidgetTypeDefinition;
    children: ReactNode;
    dragHandleProps?: Record<string, unknown>;
    className?: string;
    stackCount?: number;
    groupId?: string;
    groupLocked?: boolean;
    onToggleGroupLock?: (groupId: string) => void;
    onCycleStack?: (groupId: string, direction: "next" | "prev") => void;
    onExpandStack?: (groupId: string) => void;
    onUnlinkFromStack?: (groupId: string, instanceId: string) => void;
    onRelinkToStacks?: (instanceId: string) => void;
}

export default function WidgetCard({
    instance,
    definition,
    children,
    dragHandleProps,
    className = "",
    stackCount = 0,
    groupId,
    groupLocked = false,
    onToggleGroupLock,
    onCycleStack,
    onExpandStack,
    onUnlinkFromStack,
    onRelinkToStacks,
}: WidgetCardProps) {
    const { removeInstance, renameInstance, duplicateInstance, toggleInstanceLock, bringToFront, sendToBack, bringForward, sendBackward } = useWidgetStore();
    const dashboardEditMode = useSettingsStore((s) => s.dashboardEditMode);
    const [menuOpen, setMenuOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const title = instance.title ?? definition.defaultTitle;
    const Icon = definition.icon;



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
        <div
            className={`group relative flex flex-col h-full rounded-2xl border transition-all duration-500 overflow-hidden ${dashboardEditMode
                ? "border-purple-500/40 bg-purple-500/[0.04] shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20"
                : "bg-[#14141C]/60 border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl hover:-translate-y-[2px] hover:border-white/15 hover:shadow-[0_0_40px_rgba(124,92,255,0.12)]"
                } ${(stackCount > 1 ? groupLocked : instance.isLocked) ? "border-white/10 opacity-95 shadow-none ring-0" : ""} ${className}`}
            style={{ backdropFilter: "blur(12px)" }}
        >
            {/* Title bar / Drag Handle */}
            <div
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 shrink-0 tbb-drag-handle ${dashboardEditMode
                    ? (stackCount > 1 ? groupLocked : instance.isLocked) ? "cursor-default opacity-50" : "cursor-move bg-purple-500/5 select-none"
                    : ""
                    }`}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
                {/* Header Accent Gradient */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#7C5CFF]/40 via-[#7C5CFF]/10 to-transparent opacity-60 pointer-events-none" />
                {dashboardEditMode ? (
                    <div className={`p-1 rounded ${(stackCount > 1 ? groupLocked : instance.isLocked) ? "bg-white/5 text-white/20" : "bg-purple-500/20 text-purple-300"}`}>
                        <GripVertical size={14} />
                    </div>
                ) : (
                    <Icon size={16} style={{ color: "var(--color-accent)" }} />
                )}

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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-semibold tracking-wide truncate uppercase text-white/85">
                            {title}
                        </span>
                        {((stackCount > 1 && groupLocked) || (stackCount <= 1 && instance.isLocked)) && dashboardEditMode && (
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/5 bg-white/[0.02]">
                                {stackCount > 1 ? "Stack Locked" : "Locked"}
                            </span>
                        )}
                    </div>
                )}

                {/* Stack Controls Container */}
                <div className="flex items-center gap-1.5 h-full relative" ref={menuRef}>
                    {/* Stack Cycle Badge */}
                    {stackCount > 1 && (
                        <motion.button
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            transition={{ duration: 0.12 }}
                            onClick={(e: ReactMouseEvent) => {
                                if (!groupId || !onCycleStack) return;
                                const dir = e.shiftKey ? "prev" : "next";
                                onCycleStack(groupId, dir);
                            }}
                            className="px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white/50 tracking-tight hover:bg-white/20 hover:text-white/80 transition-colors uppercase active:scale-95 touch-none"
                            title="Click to cycle | Shift+Click for prev"
                        >
                            +{stackCount - 1}
                        </motion.button>
                    )}

                    {dashboardEditMode && (
                        <button
                            onClick={(e: ReactMouseEvent) => {
                                e.stopPropagation();
                                if (stackCount > 1 && groupId && onToggleGroupLock) {
                                    onToggleGroupLock(groupId);
                                } else {
                                    toggleInstanceLock(instance.instanceId);
                                }
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-300 ${(stackCount > 1 ? groupLocked : instance.isLocked)
                                ? "bg-white/10 text-white/80 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "hover:bg-white/5 text-white/30 hover:text-white/60"
                                }`}
                            title={stackCount > 1 ? (groupLocked ? "Unlock stack" : "Lock stack") : (instance.isLocked ? "Unlock widget" : "Lock widget")}
                        >
                            {(stackCount > 1 ? groupLocked : instance.isLocked) ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                    )}

                    <PortalMenu
                        trigger={
                            <div
                                className={`p-1 rounded-lg transition-colors ${dashboardEditMode ? "hover:bg-purple-500/20 text-purple-300" : "hover:bg-white/5 text-white/40"
                                    }`}
                            >
                                <MoreVertical size={14} />
                            </div>
                        }
                    >
                        <div className="min-w-[140px]">
                            {stackCount > 1 && onExpandStack && groupId && (
                                <>
                                    <button
                                        onClick={() => {
                                            onExpandStack(groupId);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors font-semibold"
                                        style={{ color: "var(--color-accent)" }}
                                    >
                                        <Copy size={12} className="rotate-90" /> Expand Stack
                                    </button>

                                    {onUnlinkFromStack && (
                                        <button
                                            onClick={() => {
                                                onUnlinkFromStack(groupId, instance.instanceId);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors text-red-400 hover:text-red-300"
                                        >
                                            <ArrowUpToLine size={12} className="rotate-45" /> Unlink from Stack
                                        </button>
                                    )}

                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                                </>
                            )}

                            {/* Re-enable Stacking */}
                            {stackCount <= 1 && instance.groupDisabled && onRelinkToStacks && (
                                <>
                                    <button
                                        onClick={() => {
                                            onRelinkToStacks(instance.instanceId);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors text-green-400 hover:text-green-300"
                                    >
                                        <ArrowDownToLine size={12} /> Enable Stacking
                                    </button>
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                                </>
                            )}

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
                            {dashboardEditMode && (
                                <>
                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                                    <button
                                        onClick={() => { bringToFront(instance.instanceId); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        <ArrowUpToLine size={12} /> Bring to Front
                                    </button>
                                    <button
                                        onClick={() => { sendToBack(instance.instanceId); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        <ArrowDownToLine size={12} /> Send to Back
                                    </button>
                                    <button
                                        onClick={() => { bringForward(instance.instanceId); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        <ArrowUp size={12} /> Bring Forward
                                    </button>
                                    <button
                                        onClick={() => { sendBackward(instance.instanceId); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        <ArrowDown size={12} /> Send Backward
                                    </button>
                                </>
                            )}
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                            <button
                                onClick={handleDelete}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </PortalMenu>
                </div>
            </div>

            {/* Content area: flex-1 to fill card, min-h-0 to allow shrink, overflow-hidden to clip children */}
            <div className={`flex-1 min-h-0 overflow-hidden relative flex flex-col ${dashboardEditMode ? "pointer-events-none opacity-40 grayscale-[0.5]" : ""}`}>
                {/* Visual grid hint during edit mode */}
                {dashboardEditMode && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-500/30" />
                )}

                <div className="flex-1 min-h-0">
                    {children}
                </div>
            </div>
        </div >
    );
}
