import { ReactNode, useState, useRef, useEffect, MouseEvent as ReactMouseEvent, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GripVertical, MoreVertical, Pencil, Copy, Trash2, Check, X, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown, ChevronDown, ChevronUp, LayoutGrid, Settings2, Share, Activity } from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { PortalMenu } from "@/components/ui/PortalMenu";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useIsMounted } from "@/hooks/useIsMounted";
import { SchemaForm } from "./builder/SchemaForm";
import { getTemplateManifest } from "@/widgets/registry";
import type { WidgetInstance, WidgetTypeDefinition } from "@/types/widgetInstance";
import type { HealthStatusType } from "./engine/WidgetRuntime";

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
    onGroupCollapse?: (groupId: string, collapsed: boolean) => void;
    health?: HealthStatusType;
    healthMessage?: string;
    lastUpdated?: number;
}

import { useShallow } from "zustand/react/shallow";

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
    onGroupCollapse,
    health,
    healthMessage,
    lastUpdated = Date.now(),
}: WidgetCardProps) {
    const {
        removeInstance, renameInstance, duplicateInstance, toggleInstanceLock,
        toggleCollapse, bringToFront, sendToBack, bringForward, sendBackward, updateInstanceConfig
    } = useWidgetStore(useShallow(s => ({
        removeInstance: s.removeInstance,
        renameInstance: s.renameInstance,
        duplicateInstance: s.duplicateInstance,
        toggleInstanceLock: s.toggleInstanceLock,
        toggleCollapse: s.toggleCollapse,
        bringToFront: s.bringToFront,
        sendToBack: s.sendToBack,
        bringForward: s.bringForward,
        sendBackward: s.sendBackward,
        updateInstanceConfig: s.updateInstanceConfig
    })));
    const dashboardEditMode = useSettingsStore((s) => s.dashboardEditMode);
    const enablePremiumVisuals = useSettingsStore((s) => s.enablePremiumVisuals);
    const [menuOpen, setMenuOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [exportFlash, setExportFlash] = useState(false);
    const [renameValue, setRenameValue] = useState("");

    // ── 3D Tilt Logic ──
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (effectiveEditMode || isLockedState || isDivider) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
        spotlightX.set(mouseX);
        spotlightY.set(mouseY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        spotlightX.set(-1000);
        spotlightY.set(-1000);
    };

    // Kinetic Corner Brackets: Independent Quadrant Physics
    const tlX = useTransform(mouseXSpring, [-0.5, 0], [-4, 0]);
    const tlY = useTransform(mouseYSpring, [-0.5, 0], [-4, 0]);

    const trX = useTransform(mouseXSpring, [0, 0.5], [0, 4]);
    const trY = useTransform(mouseYSpring, [-0.5, 0], [-4, 0]);

    const blX = useTransform(mouseXSpring, [-0.5, 0], [-4, 0]);
    const blY = useTransform(mouseYSpring, [0, 0.5], [0, 4]);

    const brX = useTransform(mouseXSpring, [0, 0.5], [0, 4]);
    const brY = useTransform(mouseYSpring, [0, 0.5], [0, 4]);

    const spotlightX = useMotionValue(-1000);
    const spotlightY = useMotionValue(-1000);
    const spotlightBackground = useTransform(
        [spotlightX, spotlightY],
        ([cx, cy]) => `radial-gradient(175px circle at ${cx}px ${cy}px, var(--color-accent-glow), transparent 80%)`
    );

    const isMounted = useIsMounted();
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const title = instance.title ?? definition?.defaultTitle ?? instance.type;
    const Icon = definition?.icon ?? LayoutGrid;
    const manifest = getTemplateManifest(instance.type);

    // Auto-focus rename input
    useEffect(() => {
        if (renaming) inputRef.current?.focus();
    }, [renaming]);

    useEffect(() => {
        if (exportFlash) {
            const t = setTimeout(() => setExportFlash(false), 2000);
            return () => clearTimeout(t);
        }
    }, [exportFlash]);

    const handleEdit = () => {
        setIsEditing(true);
        setMenuOpen(false);
    };

    const handleExport = () => {
        const payload = {
            type: instance.type,
            version: 1,
            meta: { name: title },
            config: instance.config
        };
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        setExportFlash(true);
        setMenuOpen(false);
    };

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

    const isDivider = instance.type === "section_divider";

    // Use mounted-safe versions of non-deterministic state
    const effectiveEditMode = isMounted ? dashboardEditMode : false;
    const isLockedState = isMounted ? (stackCount > 1 ? groupLocked : instance.isLocked) : false;

    // Wait for mount to avoid hydration mismatch with persisted settings
    const motionStyle = {
        scale: 1,
        boxShadow: undefined,
        opacity: 1,
        borderColor: (health === 'error' && enablePremiumVisuals)
            ? ["rgba(239, 68, 68, 0.4)", "rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.4)"]
            : (health === 'loading' && enablePremiumVisuals)
                ? ["rgba(251, 191, 36, 0.4)", "rgba(251, 191, 36, 0.1)", "rgba(251, 191, 36, 0.4)"]
                : undefined
    };

    const pulseTransition = (health === 'error' || health === 'loading') && enablePremiumVisuals ? {
        borderColor: {
            duration: health === 'error' ? 0.8 : 1.5,
            repeat: Infinity,
            ease: "easeInOut"
        }
    } : undefined;

    return (
        <>
            <motion.div
                animate={motionStyle}
                transition={enablePremiumVisuals ? {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                    ...pulseTransition
                } : { duration: 0.2, ease: "easeOut", ...pulseTransition }}
                onMouseMove={enablePremiumVisuals ? handleMouseMove : undefined}
                onMouseLeave={enablePremiumVisuals ? handleMouseLeave : undefined}
                className={`group relative flex flex-col h-full rounded-2xl border transition-colors duration-500 ${isDivider ? "overflow-visible" : "overflow-visible"} ${isDivider
                    ? "border-none shadow-none bg-transparent"
                    : effectiveEditMode
                        ? "border-emerald-500/40 bg-emerald-500/[0.04] shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                        : "bg-[#14141C]/60 border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl hover:-translate-y-[2px] hover:border-white/15 hover:shadow-[0_0_40px_var(--color-accent-glow)]"
                    } ${isLockedState ? "border-white/10 opacity-95 shadow-none ring-0" : ""} ${className}`}
                style={{
                    backdropFilter: isDivider ? "none" : "blur(12px)",
                    transformStyle: "preserve-3d",
                    rotateX: (enablePremiumVisuals && !effectiveEditMode) ? rotateX : 0,
                    rotateY: (enablePremiumVisuals && !effectiveEditMode) ? rotateY : 0,
                }}
            >
                {/* Tactical Depth Overlay: Noise & Glass */}
                {(!isDivider && enablePremiumVisuals) && <div className="absolute inset-0 noise-overlay rounded-2xl pointer-events-none" />}
                {!isDivider && (
                    <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                            background: "radial-gradient(circle at center, rgba(255,255,255,0.03), transparent)",
                            transform: "translateZ(1px)"
                        }}
                    />
                )}
                {(!isDivider && enablePremiumVisuals) && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none z-0 overflow-hidden"
                        style={{ background: spotlightBackground }}
                    />
                )}

                {/* Kinetic Corner Brackets - Precision Quadrant Shift */}
                {(!isDivider && enablePremiumVisuals) && (
                    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                        {[
                            { pos: "top-2 left-2", border: "border-t border-l", x: tlX, y: tlY },
                            { pos: "top-2 right-2", border: "border-t border-r", x: trX, y: trY },
                            { pos: "bottom-2 left-2", border: "border-b border-l", x: blX, y: blY },
                            { pos: "bottom-2 right-2", border: "border-b border-r", x: brX, y: brY }
                        ].map((corner, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 0.4 }}
                                className={`absolute w-3 h-3 ${corner.pos} ${corner.border}`}
                                style={{
                                    borderColor: "var(--color-accent)",
                                    x: corner.x,
                                    y: corner.y,
                                    willChange: "transform"
                                }}
                                transition={{ opacity: { duration: 0.3 } }}
                            />
                        ))}
                    </div>
                )}


                {/* Title bar / Drag Handle - HIDDEN for dividers */}
                {!isDivider && (
                    <div
                        className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 shrink-0 tbb-drag-handle ${instance.isCollapsed ? 'rounded-2xl' : 'rounded-t-2xl'} ${dashboardEditMode
                            ? (stackCount > 1 ? groupLocked : instance.isLocked) ? "cursor-default opacity-50" : "cursor-move bg-purple-500/5 select-none touch-none"
                            : "touch-none"
                            }`}
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                    >

                        {dashboardEditMode ? (
                            <div className={`p-1 rounded ${(stackCount > 1 ? groupLocked : instance.isLocked) ? "bg-white/5 text-white/20" : "bg-emerald-500/20 text-emerald-300"}`}>
                                <GripVertical size={14} />
                            </div>
                        ) : (
                            <Icon size={16} style={{ color: "var(--color-accent)" }} />
                        )}

                        {/* Title / Rename */}
                        {renaming ? (
                            <div
                                className="flex items-center gap-1 flex-1 min-w-0"
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                            >
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
                                {/* Health Dot — with enhanced status tooltip */}
                                {!dashboardEditMode && !isDivider && health !== undefined && (
                                    <div className="relative group/health">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-colors duration-500 relative z-10"
                                            style={{
                                                backgroundColor: {
                                                    loading: "var(--color-warning)",
                                                    success: "var(--color-success)",
                                                    error: "var(--color-danger)",
                                                    stale: "var(--color-text-muted)"
                                                }[health]
                                            }}
                                        />
                                        {health === 'loading' && (
                                            <div className="absolute inset-0 rounded-full bg-[var(--color-warning)] animate-ping opacity-20" />
                                        )}

                                        {/* Status Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/health:opacity-100 transition-all duration-300 pointer-events-none z-[100] scale-90 group-hover/health:scale-100 translate-y-2 group-hover/health:translate-y-0">
                                            <div className="bg-[var(--color-bg)]/95 backdrop-blur-xl border border-[var(--color-border)] rounded-xl px-3 py-2 shadow-2xl flex flex-col gap-1 min-w-[120px]">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${health === 'error' ? 'text-[var(--color-danger)]' : health === 'success' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                                                        {health}
                                                    </span>
                                                    <span className="text-[8px] text-[var(--color-text-muted)] font-mono">
                                                        {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                                {healthMessage && (
                                                    <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed max-w-[180px] break-words">
                                                        {healthMessage}
                                                    </p>
                                                )}
                                                {!healthMessage && health === 'success' && (
                                                    <p className="text-[10px] text-[var(--color-text-muted)] italic">System normal</p>
                                                )}


                                                {/* Arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-[var(--color-bg)]/95" />
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                        <div
                            className="flex items-center gap-1.5 h-full relative"
                            ref={menuRef}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            {/* Export Success Flash */}
                            <AnimatePresence>
                                {exportFlash && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute right-full whitespace-nowrap mr-2 px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-[9px] font-black text-green-400 uppercase tracking-widest"
                                    >
                                        JSON Copied
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Stack Cycle Badge */}
                            {stackCount > 1 && (
                                <motion.button
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.94 }}
                                    transition={{ duration: 0.12 }}
                                    onPointerUp={(e) => {
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

                            {/* Collapse Toggle */}
                            <button
                                onPointerUp={(e) => {
                                    e.stopPropagation();
                                    if (stackCount > 1 && groupId && onGroupCollapse) {
                                        onGroupCollapse(groupId, !instance.isCollapsed);
                                    } else {
                                        toggleCollapse(instance.instanceId);
                                    }
                                }}
                                className="p-1.5 rounded-lg transition-all duration-300 hover:bg-white/5 text-white/30 hover:text-white/60"
                                title={instance.isCollapsed ? "Expand" : "Collapse"}
                            >
                                {instance.isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>

                            {dashboardEditMode && (
                                <button
                                    onPointerUp={(e) => {
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
                                        className={`p-1 rounded-lg transition-colors ${dashboardEditMode ? "hover:bg-emerald-500/20 text-emerald-300" : "hover:bg-white/5 text-white/40"
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
                                        onClick={handleEdit}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                        style={{ color: "var(--color-accent)" }}
                                    >
                                        <Settings2 size={12} /> Configure
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/[0.04] transition-colors"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        <Share size={12} /> Export Widget
                                    </button>
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
                )}

                {/* Content area separator */}
                {!isDivider && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                )}

                {/* Content area */}
                <AnimatePresence initial={false}>
                    {!instance.isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`
                        flex-1 min-h-0 overflow-hidden rounded-b-2xl relative flex flex-col 
                        ${isDivider ? "tbb-drag-handle cursor-move touch-none" : ""} 
                        ${dashboardEditMode && !isDivider ? "pointer-events-none opacity-40 grayscale-[0.5]" : ""}
                        ${dashboardEditMode && isDivider ? "ring-1 ring-white/10 rounded-lg bg-white/[0.02]" : ""}
                    `}
                        >
                            {/* Visual grid hint during edit mode */}
                            {dashboardEditMode && !isDivider && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-500/30" />
                            )}

                            <div className="flex-1 min-h-0">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div >

            {/* Edit Modal Overlay */}
            <AnimatePresence>
                {
                    isEditing && manifest && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-black/60"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-[#0C0C12] border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Settings2 size={20} className="text-emerald-400" />
                                            Widget Settings
                                        </h2>
                                        <p className="text-xs text-white/30 uppercase tracking-[0.15em] font-medium">
                                            {manifest.name} Config
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                                    <SchemaForm
                                        schema={manifest.configSchema ?? {}}
                                        defaultValues={instance.config}
                                        onValidatedSubmit={(values) => {
                                            updateInstanceConfig(instance.instanceId, values);
                                            setIsEditing(false);
                                        }}
                                        onCancel={() => setIsEditing(false)}
                                        submitLabel="Safe & Close"
                                        isSubmitting={false}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </>
    );
}
