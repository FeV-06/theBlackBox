"use client";

import { useMemo, useRef, useState, useEffect, useCallback, Fragment } from "react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "framer-motion";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { registryMap } from "@/lib/widgetRegistry";
import { snap } from "@/lib/snap";
import WidgetCard from "./WidgetCard";
import WidgetStackPreview from "./WidgetStackPreview";
import ProjectsOverviewWidget from "./ProjectsOverviewWidget";
import type { TabId } from "@/types/widget";
import type { WidgetInstance } from "@/types/widgetInstance";
import type { WidgetGroup } from "@/types/widgetGroup";
import { AlertTriangle } from "lucide-react";
import StackExpandModal from "./StackExpandModal";

/* ── Constants ── */
const GROUP_PROXIMITY_PX = 40;
const WIDTH_SIMILARITY_PX = 40;
const HEIGHT_SIMILARITY_PX = 40;

/* ── Canvas Sizing Constants ── */
const SIDEBAR_WIDTH = 72;
const HEADER_HEIGHT = 72;
const CANVAS_MIN_EXTRA_PADDING_X = 0;
const CANVAS_MIN_EXTRA_PADDING_Y = 0;
// Replaced fixed padding with dynamic calculation in component

/* ── Auto-Scroll Constants ── */
const SCROLL_EDGE_THRESHOLD = 90;
const SCROLL_SPEED = 22;

/* ── Helper: Compute Widget Bounds ── */
function computeCanvasBounds(instances: WidgetInstance[]) {
    let maxRight = 0;
    let maxBottom = 0;

    for (const inst of instances) {
        if (!inst?.layout) continue;
        const right = inst.layout.x + inst.layout.w;
        const bottom = inst.layout.y + inst.layout.h;

        if (right > maxRight) maxRight = right;
        if (bottom > maxBottom) maxBottom = bottom;
    }

    return { maxRight, maxBottom };
}

const STACK_OFFSET_X = 18;
const STACK_OFFSET_Y = 14;
const STACK_SCALE_STEP = 0.02;
const STACK_OPACITY_STEP = 0.08;
const STACK_BLUR_STEP = 2;

const STACK_MIN_OPACITY = 0.15;
const STACK_MIN_SCALE = 0.9;

/* ── Alignment Snap Constants ── */
const ALIGN_SNAP_THRESHOLD = 10;
const GUIDE_LINE_THICKNESS = 2;
const GUIDE_COLOR = "rgba(124,92,255,0.55)";
const GUIDE_GLOW = "0 0 18px rgba(124,92,255,0.45)";

/* ── Types ── */
interface WidgetRect {
    id: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    centerX: number;
    centerY: number;
    w: number;
    h: number;
}

interface AlignResult {
    snappedX: number;
    snappedY: number;
    verticalGuides: number[];
    horizontalGuides: number[];
}

interface ResizeAlignResult {
    snappedW: number;
    snappedH: number;
    verticalGuides: number[];
    horizontalGuides: number[];
}

interface WidgetCanvasProps {
    onNavigate?: (tab: TabId) => void;
}

/* ── Alignment Snap Logic ── */
function computeDragAlignment(
    activeRect: WidgetRect,
    otherRects: WidgetRect[],
): AlignResult {
    let bestDx = Infinity;
    let bestDy = Infinity;
    let snapX = activeRect.left;
    let snapY = activeRect.top;
    const vGuides: number[] = [];
    const hGuides: number[] = [];

    for (const other of otherRects) {
        // Vertical alignment candidates (x-axis)
        const xCandidates = [
            { activePt: activeRect.left, otherPt: other.left },
            { activePt: activeRect.left, otherPt: other.right },
            { activePt: activeRect.right, otherPt: other.left },
            { activePt: activeRect.right, otherPt: other.right },
            { activePt: activeRect.centerX, otherPt: other.centerX },
        ];
        for (const { activePt, otherPt } of xCandidates) {
            const delta = Math.abs(activePt - otherPt);
            if (delta <= ALIGN_SNAP_THRESHOLD) {
                if (delta < bestDx) {
                    bestDx = delta;
                    snapX = activeRect.left + (otherPt - activePt);
                    vGuides.length = 0;
                    vGuides.push(otherPt);
                } else if (delta === bestDx && !vGuides.includes(otherPt)) {
                    vGuides.push(otherPt);
                }
            }
        }

        // Horizontal alignment candidates (y-axis)
        const yCandidates = [
            { activePt: activeRect.top, otherPt: other.top },
            { activePt: activeRect.top, otherPt: other.bottom },
            { activePt: activeRect.bottom, otherPt: other.top },
            { activePt: activeRect.bottom, otherPt: other.bottom },
            { activePt: activeRect.centerY, otherPt: other.centerY },
        ];
        for (const { activePt, otherPt } of yCandidates) {
            const delta = Math.abs(activePt - otherPt);
            if (delta <= ALIGN_SNAP_THRESHOLD) {
                if (delta < bestDy) {
                    bestDy = delta;
                    snapY = activeRect.top + (otherPt - activePt);
                    hGuides.length = 0;
                    hGuides.push(otherPt);
                } else if (delta === bestDy && !hGuides.includes(otherPt)) {
                    hGuides.push(otherPt);
                }
            }
        }
    }

    return {
        snappedX: bestDx <= ALIGN_SNAP_THRESHOLD ? snapX : activeRect.left,
        snappedY: bestDy <= ALIGN_SNAP_THRESHOLD ? snapY : activeRect.top,
        verticalGuides: vGuides,
        horizontalGuides: hGuides,
    };
}

function computeResizeAlignment(
    activeId: string,
    x: number,
    y: number,
    w: number,
    h: number,
    otherRects: WidgetRect[],
): ResizeAlignResult {
    const right = x + w;
    const bottom = y + h;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    let bestDw = Infinity;
    let bestDh = Infinity;
    let snappedW = w;
    let snappedH = h;
    const vGuides: number[] = [];
    const hGuides: number[] = [];

    for (const other of otherRects) {
        // Right edge alignment
        const rightCandidates = [other.left, other.right, other.centerX];
        for (const otherPt of rightCandidates) {
            const delta = Math.abs(right - otherPt);
            if (delta <= ALIGN_SNAP_THRESHOLD && delta < bestDw) {
                bestDw = delta;
                snappedW = otherPt - x;
                vGuides.length = 0;
                vGuides.push(otherPt);
            }
        }

        // Bottom edge alignment
        const bottomCandidates = [other.top, other.bottom, other.centerY];
        for (const otherPt of bottomCandidates) {
            const delta = Math.abs(bottom - otherPt);
            if (delta <= ALIGN_SNAP_THRESHOLD && delta < bestDh) {
                bestDh = delta;
                snappedH = otherPt - y;
                hGuides.length = 0;
                hGuides.push(otherPt);
            }
        }
    }

    return {
        snappedW: bestDw <= ALIGN_SNAP_THRESHOLD ? Math.max(280, snappedW) : w,
        snappedH: bestDh <= ALIGN_SNAP_THRESHOLD ? Math.max(180, snappedH) : h,
        verticalGuides: vGuides,
        horizontalGuides: hGuides,
    };
}

function UnknownWidget({ instance }: { instance: WidgetInstance }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 gap-2 text-center">
            <AlertTriangle size={24} className="text-red-500/50" />
            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-40">
                Unknown: {instance.type}
            </p>
        </div>
    );
}

export default function WidgetCanvas({ onNavigate }: WidgetCanvasProps) {
    const { instances, layout, updateInstanceLayout, lockedGroups, toggleGroupLock, unlinkFromStack, relinkToStacks } = useWidgetStore();
    const dashboardEditMode = useSettingsStore((s) => s.dashboardEditMode);
    /* ── Dynamic Canvas State (V4) ── */
    const [surfaceSize, setSurfaceSize] = useState({ w: 0, h: 0 });

    // Refs for V4 infinite scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);
    const liveBoundsRef = useRef({ maxRight: 0, maxBottom: 0 });
    const pointerRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const shrinkTimerRef = useRef<NodeJS.Timeout | null>(null);

    // V4.6: Scroll Preservation Refs
    const dragScrollStartRef = useRef({ left: 0, top: 0 });
    const scrollCompRef = useRef({ dx: 0, dy: 0 });

    // V4.7: Horizontal Drag Fix Ref
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    /* ── Active Widget State per Group ── */
    const [activeInGroup, setActiveInGroup] = useState<Record<string, string>>({});

    // Animation direction for slides
    const [cycleDirection, setCycleDirection] = useState<Record<string, 1 | -1>>({});

    // Modal state
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

    // Alignment guide state
    const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });
    const [animatedLayoutOverrides, setAnimatedLayoutOverrides] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({});
    const [guidesVisible, setGuidesVisible] = useState(false);

    // Track Viewport
    const [viewport, setViewport] = useState({ w: 0, h: 0 });

    /* ── Safe Surface Setter (Scroll Preservation) ── */
    const safeSetSurfaceSize = useCallback((next: { w: number; h: number }) => {
        const el = scrollRef.current;
        if (!el) {
            setSurfaceSize(next);
            return;
        }

        // 🚨 CRITICAL (V4.5): never restore scroll during drag/resize
        // This prevents "snap-back" because auto-scroll changes scroll position,
        // and restoring old position would undo that progress.
        if (isDraggingRef.current) {
            setSurfaceSize(next);
            return;
        }

        const prevLeft = el.scrollLeft;
        const prevTop = el.scrollTop;

        setSurfaceSize(next);

        requestAnimationFrame(() => {
            if (!scrollRef.current) return;
            scrollRef.current.scrollLeft = prevLeft;
            scrollRef.current.scrollTop = prevTop;
        });
    }, []);

    useEffect(() => {
        function updateViewport() {
            if (scrollRef.current) {
                setViewport({
                    w: scrollRef.current.clientWidth,
                    h: scrollRef.current.clientHeight
                });
            }
        }
        updateViewport();
        window.addEventListener("resize", updateViewport);
        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    // Cleanup shrink timer
    useEffect(() => {
        return () => {
            if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
        };
    }, []);

    /* ── Filter Visible Instances ── */
    const visibleInstances = useMemo(() => {
        return layout
            .map((id) => instances[id])
            .filter((inst) => inst && inst.enabled && inst.layout);
    }, [instances, layout]);

    /* ── Precomputed Widget Rects ── */
    const widgetRects = useMemo<WidgetRect[]>(() => {
        return visibleInstances
            .filter((inst) => inst.layout)
            .map((inst) => {
                const l = inst.layout!;
                return {
                    id: inst.instanceId,
                    left: l.x,
                    top: l.y,
                    right: l.x + l.w,
                    bottom: l.y + l.h,
                    centerX: l.x + l.w / 2,
                    centerY: l.y + l.h / 2,
                    w: l.w,
                    h: l.h,
                };
            });
    }, [visibleInstances]);

    /* ── Group Logic (BFS) ── */
    const groups = useMemo(() => {
        const groupable = visibleInstances.filter(i => !i.groupDisabled);
        const standalone = visibleInstances.filter(i => i.groupDisabled);

        const nodes = groupable.map(i => i.instanceId);
        const adj: Record<string, string[]> = {};
        nodes.forEach(id => adj[id] = []);

        // Build Adjacency Graph (Overlap + Similar Size)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const A = instances[nodes[i]];
                const B = instances[nodes[j]];
                if (!A?.layout || !B?.layout) continue;

                const rectA = { left: A.layout.x, right: A.layout.x + A.layout.w, top: A.layout.y, bottom: A.layout.y + A.layout.h };
                const rectB = { left: B.layout.x, right: B.layout.x + B.layout.w, top: B.layout.y, bottom: B.layout.y + B.layout.h };

                const sizeDiffA = Math.abs((A.layout.w * A.layout.h) - (B.layout.w * B.layout.h));
                const similarSize = sizeDiffA < 5000;

                const overlap =
                    rectA.left < rectB.right - 20 &&
                    rectA.right > rectB.left + 20 &&
                    rectA.top < rectB.bottom - 20 &&
                    rectA.bottom > rectB.top + 20;

                if (similarSize && overlap) {
                    adj[A.instanceId].push(B.instanceId);
                    adj[B.instanceId].push(A.instanceId);
                }
            }
        }

        const visited = new Set<string>();
        const result: WidgetGroup[] = [];

        nodes.forEach(id => {
            if (!visited.has(id)) {
                const component: string[] = [];
                const stack = [id];
                visited.add(id);

                while (stack.length > 0) {
                    const node = stack.pop()!;
                    component.push(node);
                    adj[node].forEach(neighbor => {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            stack.push(neighbor);
                        }
                    });
                }
                const sortedIds = component.sort();
                result.push({
                    groupId: sortedIds.join("|"),
                    instanceIds: sortedIds
                });
            }
        });

        // Add standalone groups for disabled instances
        standalone.forEach(inst => {
            result.push({
                groupId: `standalone:${inst.instanceId}`,
                instanceIds: [inst.instanceId]
            });
        });

        return result;
    }, [visibleInstances]);

    /* ── Dynamic Canvas Size Logic (V4) ── */
    // 1. Adaptive Padding
    const ADAPTIVE_PAD_X = 140; // Tight padding
    const ADAPTIVE_PAD_Y = 220;

    // 2. Compute desired canvas size from visible widgets
    const { maxBottom } = useMemo(
        () => computeCanvasBounds(visibleInstances),
        [visibleInstances]
    );

    // 3. Merge with Live Bounds (during drag)
    const finalMaxBottom = Math.max(maxBottom, liveBoundsRef.current.maxBottom || 0);

    const desiredCanvasHeight = finalMaxBottom + ADAPTIVE_PAD_Y;

    // 4. Update Surface Size
    useEffect(() => {
        // Minimum size is always at least the viewport
        const targetH = Math.max(viewport.h, desiredCanvasHeight);

        const expanding = targetH > surfaceSize.h;

        if (expanding) {
            // Instant expand
            if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
            safeSetSurfaceSize({ w: 0, h: targetH }); // w ignored
            return;
        }

        // Delayed shrink
        if (targetH === surfaceSize.h) return;

        if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);

        shrinkTimerRef.current = setTimeout(() => {
            // Check bounds again to be safe
            safeSetSurfaceSize({ w: 0, h: targetH }); // w ignored
        }, 500);

    }, [viewport.h, desiredCanvasHeight, surfaceSize, safeSetSurfaceSize]);


    /* ── Stack Cycling Logic ── */
    const handleCycleStack = useCallback((groupId: string, direction: "next" | "prev") => {
        const group = groups.find(g => g.groupId === groupId);
        if (!group) return;

        const ids = group.instanceIds;
        const currentActive = activeInGroup[groupId] || ids[0];
        const currentIndex = ids.indexOf(currentActive);

        let nextIndex: number;
        if (direction === "next") {
            nextIndex = (currentIndex + 1) % ids.length;
        } else {
            nextIndex = (currentIndex - 1 + ids.length) % ids.length;
        }

        const nextActiveId = ids[nextIndex];

        // Auto-align
        const currentInst = instances[currentActive];
        const nextInst = instances[nextActiveId];

        if (currentInst?.layout && nextInst?.layout) {
            if (nextInst.layout.x !== currentInst.layout.x || nextInst.layout.y !== currentInst.layout.y) {
                updateInstanceLayout(nextActiveId, {
                    x: currentInst.layout.x,
                    y: currentInst.layout.y
                });
            }
        }

        const dir = direction === "next" ? 1 : -1;

        setCycleDirection(prev => ({ ...prev, [groupId]: dir }));
        setActiveInGroup(prev => ({ ...prev, [groupId]: nextActiveId }));
    }, [groups, activeInGroup, instances, updateInstanceLayout]);

    const handleSetActiveInGroup = useCallback((groupId: string, instanceId: string) => {
        setCycleDirection(prev => ({ ...prev, [groupId]: 1 }));
        setActiveInGroup(prev => ({ ...prev, [groupId]: instanceId }));
        setExpandedGroupId(null);
    }, []);

    const slideVariants = {
        initial: (dir: number) => ({
            opacity: 0,
            x: dir * 30,
            scale: 0.985,
        }),
        animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.22, ease: "easeOut" as any },
        },
        exit: (dir: number) => ({
            opacity: 0,
            x: dir * -30,
            scale: 0.985,
            transition: { duration: 0.18, ease: "easeIn" as any },
        }),
    };

    /* ── Explicit Unlink Helper ── */
    const handleUnlinkFromStack = useCallback((groupId: string, instanceId: string) => {
        const inst = instances[instanceId];
        if (!inst || !inst.layout) return;

        unlinkFromStack(instanceId);
        const offset = inst.layout.w + 260;
        updateInstanceLayout(instanceId, {
            x: snap(inst.layout.x + offset),
            y: snap(inst.layout.y),
        });

        setActiveInGroup(prev => {
            const copy = { ...prev };
            delete copy[groupId];
            return copy;
        });
    }, [instances, updateInstanceLayout, unlinkFromStack]);

    /* ── Clear Guides Helper ── */
    const clearGuides = useCallback(() => {
        setGuidesVisible(false);
        setTimeout(() => setGuides({ vertical: [], horizontal: [] }), 150);
    }, []);

    /* ── Global Mouse Tracking (V4) ── */
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            pointerRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    // V4.7: Helper to get pointer in surface coordinates (scrolled space)
    const getSurfacePointer = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return { x: 0, y: 0 };

        const rect = el.getBoundingClientRect();
        return {
            x: el.scrollLeft + (pointerRef.current.x - rect.left),
            y: el.scrollTop + (pointerRef.current.y - rect.top),
        };
    }, []);

    /* ── Auto-Scroll Logic (V4.4 Fix) ── */
    const startAutoScroll = useCallback(() => {
        if (isDraggingRef.current) return;
        isDraggingRef.current = true;

        // Reset compensation tracker
        scrollCompRef.current = { dx: 0, dy: 0 };

        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const loop = () => {
            if (!isDraggingRef.current || !scrollRef.current) return;

            const el = scrollRef.current;
            const rect = el.getBoundingClientRect();
            const { x, y } = pointerRef.current;

            const EDGE = 90;
            const SPEED = 22;

            let dy = 0;

            // V5.0: Vertical Auto-Scroll ONLY
            if (y < rect.top + EDGE) dy = -SPEED;
            if (y > rect.bottom - EDGE) dy = SPEED;

            // Maintain V4.3 Expansion Logic (Vertical Only)
            const currentH = surfaceRef.current?.offsetHeight || surfaceSize.h;

            const distBottom = rect.bottom - y;

            if (distBottom < EDGE) {
                safeSetSurfaceSize({
                    w: 0, // ignored
                    h: Math.max(currentH, el.scrollTop + el.clientHeight + 500)
                });
            }

            if (dy !== 0) {
                el.scrollTop += dy;

                // Track total auto-scroll amount
                scrollCompRef.current.dy += dy;
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
    }, [surfaceSize, safeSetSurfaceSize]);

    const stopAutoScroll = useCallback(() => {
        isDraggingRef.current = false;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    /* ── Render Logic ── */
    return (
        <div
            ref={scrollRef}
            className="relative w-full h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden rounded-2xl"
        >
            <div
                ref={surfaceRef}
                className="relative transition-[height] duration-75 ease-out"
                style={{
                    width: "100%",
                    height: surfaceSize.h,
                    // minWidth/minHeight removed for V4.1 to rely on explicit pixel size
                    backgroundImage: dashboardEditMode
                        ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
                        : "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            >
                {/* ── Alignment Guide Lines ── */}
                {guides.vertical.map((x, i) => (
                    <div
                        key={`vg-${i}`}
                        className="absolute pointer-events-none"
                        style={{
                            left: x - GUIDE_LINE_THICKNESS / 2,
                            top: 0,
                            height: surfaceSize.h,
                            width: GUIDE_LINE_THICKNESS,
                            background: GUIDE_COLOR,
                            boxShadow: GUIDE_GLOW,
                            zIndex: 9999,
                            opacity: guidesVisible ? 1 : 0,
                            transition: "opacity 150ms ease",
                        }}
                    />
                ))}
                {guides.horizontal.map((y, i) => (
                    <div
                        key={`hg-${i}`}
                        className="absolute pointer-events-none"
                        style={{
                            top: y - GUIDE_LINE_THICKNESS / 2,
                            left: 0,
                            width: "100%",
                            height: GUIDE_LINE_THICKNESS,
                            background: GUIDE_COLOR,
                            boxShadow: GUIDE_GLOW,
                            zIndex: 9999,
                            opacity: guidesVisible ? 1 : 0,
                            transition: "opacity 150ms ease",
                        }}
                    />
                ))}

                {groups.map((group) => {
                    const { groupId, instanceIds } = group;

                    // Deterministic default active: first in store.layout order
                    const defaultActive = instanceIds.reduce((prev: string, curr: string) => {
                        const idxPrev = layout.indexOf(prev);
                        const idxCurr = layout.indexOf(curr);
                        return idxCurr < idxPrev ? curr : prev;
                    });

                    const activeId = activeInGroup[groupId] || defaultActive;
                    const activeInstance = instances[activeId];
                    if (!activeInstance || !activeInstance.layout) return null;

                    // Compute Stable Anchor: choose the widget with smallest y, if tie, smallest x
                    const anchorInstance = instanceIds
                        .map((id: string) => instances[id])
                        .filter((inst): inst is WidgetInstance => !!inst && !!inst.layout)
                        .reduce((best: WidgetInstance, curr: WidgetInstance) => {
                            if (!best) return curr;
                            if (curr.layout!.y < best.layout!.y) return curr;
                            if (curr.layout!.y === best.layout!.y && curr.layout!.x < best.layout!.x) return curr;
                            return best;
                        });

                    const anchorX = anchorInstance.layout!.x;
                    const anchorY = anchorInstance.layout!.y;

                    const isStacked = instanceIds.length > 1;

                    // For stacked view, sort background cards by height descending
                    const backgroundIds = instanceIds
                        .filter(id => id !== activeId)
                        .sort((a, b) => (instances[b]?.layout?.h || 0) - (instances[a]?.layout?.h || 0));

                    const definition = registryMap.get(activeInstance.type);
                    const Component = definition?.component || ((props: any) => <div className="p-4 text-xs italic opacity-40">Unknown {props.instance.type}</div>);

                    const dir = cycleDirection[groupId] || 1;

                    const groupLocked = !!lockedGroups[groupId];
                    const instanceLocked = !!activeInstance.isLocked;
                    const lockedFinal = groupLocked || instanceLocked;

                    // Rects for OTHER widgets (exclude all members of this group for alignment)
                    const groupMemberIds = new Set(instanceIds);
                    const otherRects = widgetRects.filter(r => !groupMemberIds.has(r.id));

                    return (
                        <Fragment key={groupId}>
                            {/* ── Background Stack Layers ── */}
                            {isStacked && backgroundIds.map((bgId, i) => {
                                const inst = instances[bgId];
                                const def = registryMap.get(inst.type);
                                if (!inst || !inst.layout || !def) return null;

                                const offsetX = STACK_OFFSET_X * (i + 1);
                                const offsetY = STACK_OFFSET_Y * (i + 1);
                                const scale = Math.max(STACK_MIN_SCALE, 1 - (i + 1) * STACK_SCALE_STEP);
                                const opacity = Math.max(0.35, 0.75 - i * 0.15);
                                const blur = 1 + i * 0.5;

                                return (
                                    <div
                                        key={`prev-${bgId}`}
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: anchorX + offsetX,
                                            top: anchorY + offsetY,
                                            width: activeInstance.layout!.w,
                                            height: activeInstance.layout!.h,
                                            transform: `scale(${scale})`,
                                            opacity: opacity,
                                            filter: `blur(${blur}px)`,
                                            zIndex: 10 + i
                                        }}
                                    >
                                        <WidgetStackPreview definition={def} title={inst.title || def.defaultTitle} />
                                    </div>
                                );
                            })}

                            {/* ── Active Widget ── */}
                            <Rnd
                                bounds={undefined} // Remove parent bounds for infinite canvas
                                size={{ width: activeInstance.layout.w, height: activeInstance.layout.h }}
                                position={{
                                    x: animatedLayoutOverrides[activeId]?.x ?? activeInstance.layout.x, // V4.7: Use activeInstance layout instead of anchor
                                    y: animatedLayoutOverrides[activeId]?.y ?? activeInstance.layout.y // V4.7: Use activeInstance layout instead of anchor
                                }}
                                disableDragging={!dashboardEditMode || lockedFinal}
                                enableResizing={dashboardEditMode && !lockedFinal ? {
                                    bottom: true,
                                    bottomRight: true,
                                    right: true,
                                    top: false,
                                    topLeft: false,
                                    topRight: false,
                                    left: false,
                                    bottomLeft: false,
                                } : false}
                                dragHandleClassName="tbb-drag-handle"
                                minWidth={280}
                                minHeight={180}
                                onDragStart={() => {
                                    if (scrollRef.current) {
                                        dragScrollStartRef.current = {
                                            left: scrollRef.current.scrollLeft,
                                            top: scrollRef.current.scrollTop
                                        };
                                    }

                                    // V4.7: Capture Drag Offset in Surface Coordinates
                                    const p = getSurfacePointer();
                                    dragOffsetRef.current = {
                                        x: p.x - activeInstance.layout!.x,
                                        y: p.y - activeInstance.layout!.y,
                                    };

                                    startAutoScroll();
                                }}
                                onDrag={(e, d) => {
                                    // V4.4: Explicit pointer update from Drag Event
                                    if ("clientX" in e && "clientY" in e) {
                                        pointerRef.current = { x: e.clientX, y: e.clientY };
                                    }

                                    // V4.8 Debug: Check horizontal scroll
                                    if (scrollRef.current) {
                                        // console.log("Drag ScrollLeft:", scrollRef.current.scrollLeft);
                                    }

                                    const w = activeInstance.layout!.w;
                                    const h = activeInstance.layout!.h;

                                    // V4.7: Compute Real Y From Pointer (Ignore d.y)
                                    // V5.0: Lock X-Axis Drag
                                    // V4.7: Compute Real X/Y From Pointer (Ignore d.x/d.y)
                                    // V5.1: Relaxed Lock - Allow X drag but clamp to surface width
                                    const p = getSurfacePointer();

                                    // 1. Calculate raw position from pointer
                                    let rawX = p.x - dragOffsetRef.current.x;
                                    const rawY = p.y - dragOffsetRef.current.y;

                                    // 2. Clamp X to current surface width (prevent expansion)
                                    // Use surfaceRef.current.clientWidth if available for most up-to-date width
                                    const maxW = surfaceRef.current?.clientWidth || surfaceSize.w;
                                    rawX = Math.max(0, Math.min(rawX, maxW - w));

                                    const snappedX = snap(rawX);
                                    const snappedY = snap(rawY);

                                    const activeRect: WidgetRect = {
                                        id: activeId,
                                        left: snappedX,
                                        top: snappedY,
                                        right: snappedX + w,
                                        bottom: snappedY + h,
                                        centerX: snappedX + w / 2,
                                        centerY: snappedY + h / 2,
                                        w,
                                        h,
                                    };
                                    const result = computeDragAlignment(activeRect, otherRects);
                                    setGuides({ vertical: result.verticalGuides, horizontal: result.horizontalGuides });
                                    setGuidesVisible(result.verticalGuides.length > 0 || result.horizontalGuides.length > 0);

                                    // ── Live Bounds for Dynamic Expansion ──
                                    // Use raw/snapped coords instead of d.x/d.y
                                    // V5.0: Only expand bottom
                                    // V5.1: X is clamped, so we don't need to track maxRight for expansion
                                    const bottom = rawY + h;

                                    liveBoundsRef.current = {
                                        maxRight: 0,
                                        maxBottom: Math.max(liveBoundsRef.current.maxBottom, bottom)
                                    };

                                    const PAD_Y = 220;
                                    const neededH = Math.max(viewport.h, bottom + PAD_Y);

                                    const needsResize = neededH > surfaceSize.h;
                                    if (needsResize) {
                                        safeSetSurfaceSize({
                                            w: 0, // ignored
                                            h: Math.max(surfaceSize.h, neededH)
                                        });
                                    }
                                }}
                                onDragStop={(e, d) => {
                                    stopAutoScroll();
                                    liveBoundsRef.current = { maxRight: 0, maxBottom: 0 }; // Reset

                                    const w = activeInstance.layout!.w;
                                    const h = activeInstance.layout!.h;

                                    // Step 1: Extract current active layout
                                    const oldX = activeInstance.layout!.x;
                                    const oldY = activeInstance.layout!.y;

                                    // V4.7: Recompute Valid Drop Position (Ignore d.x/d.y)
                                    // V5.0: Lock X
                                    // V4.7: Recompute Valid Drop Position (Ignore d.x/d.y)
                                    // V5.1: Allow X change, clamp to surface
                                    const p = getSurfacePointer();

                                    let rawX = p.x - dragOffsetRef.current.x;
                                    const rawY = p.y - dragOffsetRef.current.y;

                                    // Clamp X
                                    const maxW = surfaceRef.current?.clientWidth || surfaceSize.w;
                                    rawX = Math.max(0, Math.min(rawX, maxW - w));

                                    const finalX = Math.max(0, snap(rawX));
                                    const finalY = Math.max(0, snap(rawY));

                                    // Step 3: Compute translation delta safely
                                    const dx = finalX - oldX;
                                    const dy = finalY - oldY;

                                    // Step 4: Apply translation to all widgets in the group WITHOUT snapping
                                    if (isStacked) {
                                        instanceIds.forEach((id) => {
                                            const inst = instances[id];
                                            if (!inst?.layout) return;

                                            updateInstanceLayout(id, {
                                                x: Math.max(0, inst.layout.x + dx),
                                                y: Math.max(0, inst.layout.y + dy),
                                            });
                                        });
                                    }

                                    // Step 5: Force active widget to exact snapped position
                                    updateInstanceLayout(activeId, {
                                        x: finalX,
                                        y: finalY,
                                    });

                                    // ── Inertia Animation ──
                                    // 1. Set override to current drag position (unsnapped)
                                    setAnimatedLayoutOverrides(prev => ({
                                        ...prev,
                                        [activeId]: { x: rawX, y: rawY, w: activeInstance.layout!.w, h: activeInstance.layout!.h }
                                    }));

                                    // 2. Animate to snapped position
                                    const start = { x: rawX, y: rawY };
                                    const end = { x: finalX, y: finalY };

                                    let velocity = { x: 0, y: 0 };
                                    let current = { ...start };
                                    const stiffness = 0.2; // 0.2
                                    const damping = 0.8; // 0.8
                                    const precision = 0.5;

                                    const animate = () => {
                                        const forceX = (end.x - current.x) * stiffness;
                                        const forceY = (end.y - current.y) * stiffness;

                                        velocity.x = (velocity.x + forceX) * damping;
                                        velocity.y = (velocity.y + forceY) * damping;

                                        current.x += velocity.x;
                                        current.y += velocity.y;

                                        // Check stop condition
                                        if (
                                            Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1 &&
                                            Math.abs(end.x - current.x) < precision && Math.abs(end.y - current.y) < precision
                                        ) {
                                            setAnimatedLayoutOverrides(prev => {
                                                const next = { ...prev };
                                                delete next[activeId];
                                                return next;
                                            });
                                            return;
                                        }

                                        setAnimatedLayoutOverrides(prev => ({
                                            ...prev,
                                            [activeId]: { ...prev[activeId]!, x: current.x, y: current.y }
                                        }));
                                        requestAnimationFrame(animate);
                                    };
                                    requestAnimationFrame(animate);

                                    clearGuides();

                                    // V4.6: Force scroll restoration after Rnd cleanup
                                    requestAnimationFrame(() => {
                                        if (!scrollRef.current) return;
                                        // V5.0: Only restore scrollTop, scrollLeft is always 0
                                        scrollRef.current.scrollTop = dragScrollStartRef.current.top + scrollCompRef.current.dy;
                                        // Reset compensation
                                        scrollCompRef.current = { dx: 0, dy: 0 };
                                    });
                                }}
                                onResizeStart={() => startAutoScroll()}
                                onResize={(e, direction, ref, delta, pos) => {
                                    // V4.4: Explicit pointer update from Resize Event
                                    if ("clientX" in e && "clientY" in e) {
                                        pointerRef.current = { x: e.clientX, y: e.clientY };
                                    }

                                    const newW = ref.offsetWidth;
                                    const newH = ref.offsetHeight;
                                    const result = computeResizeAlignment(activeId, pos.x, pos.y, newW, newH, otherRects);
                                    setGuides({ vertical: result.verticalGuides, horizontal: result.horizontalGuides });
                                    setGuidesVisible(result.verticalGuides.length > 0 || result.horizontalGuides.length > 0);

                                    const w = ref.offsetWidth;
                                    const h = ref.offsetHeight;
                                    const right = pos.x + w;
                                    const bottom = pos.y + h;

                                    liveBoundsRef.current = {
                                        maxRight: Math.max(liveBoundsRef.current.maxRight, right),
                                        maxBottom: Math.max(liveBoundsRef.current.maxBottom, bottom)
                                    };

                                    const PAD_X = 140;
                                    const PAD_Y = 220;
                                    const neededW = Math.max(viewport.w, right + PAD_X);
                                    const neededH = Math.max(viewport.h, bottom + PAD_Y);

                                    const needsResize = neededW > surfaceSize.w || neededH > surfaceSize.h;
                                    if (needsResize) {
                                        safeSetSurfaceSize({
                                            w: Math.max(surfaceSize.w, neededW),
                                            h: Math.max(surfaceSize.h, neededH)
                                        });
                                    }
                                }}
                                onResizeStop={(e, direction, ref, delta, pos) => {
                                    stopAutoScroll();
                                    liveBoundsRef.current = { maxRight: 0, maxBottom: 0 };

                                    const newW = ref.offsetWidth;
                                    const newH = ref.offsetHeight;
                                    const result = computeResizeAlignment(activeId, pos.x, pos.y, newW, newH, otherRects);
                                    const finalW = snap(result.snappedW);
                                    const finalH = snap(result.snappedH);
                                    const finalX = snap(pos.x);
                                    const finalY = snap(pos.y);

                                    updateInstanceLayout(activeId, {
                                        w: finalW,
                                        h: finalH,
                                        x: finalX,
                                        y: finalY,
                                    });

                                    // ── Inertia Animation (Resize) ──
                                    setAnimatedLayoutOverrides(prev => ({
                                        ...prev,
                                        [activeId]: { x: pos.x, y: pos.y, w: newW, h: newH }
                                    }));

                                    const start = { x: pos.x, y: pos.y, w: newW, h: newH };
                                    const end = { x: finalX, y: finalY, w: finalW, h: finalH };

                                    let velocity = { x: 0, y: 0, w: 0, h: 0 };
                                    let current = { ...start };
                                    const stiffness = 0.2;
                                    const damping = 0.8;
                                    const precision = 0.5;

                                    const animate = () => {
                                        const forceX = (end.x - current.x) * stiffness;
                                        const forceY = (end.y - current.y) * stiffness;
                                        const forceW = (end.w - current.w) * stiffness;
                                        const forceH = (end.h - current.h) * stiffness;

                                        velocity.x = (velocity.x + forceX) * damping;
                                        velocity.y = (velocity.y + forceY) * damping;
                                        velocity.w = (velocity.w + forceW) * damping;
                                        velocity.h = (velocity.h + forceH) * damping;

                                        current.x += velocity.x;
                                        current.y += velocity.y;
                                        current.w += velocity.w;
                                        current.h += velocity.h;

                                        if (
                                            Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1 &&
                                            Math.abs(velocity.w) < 0.1 && Math.abs(velocity.h) < 0.1 &&
                                            Math.abs(end.x - current.x) < precision && Math.abs(end.y - current.y) < precision &&
                                            Math.abs(end.w - current.w) < precision && Math.abs(end.h - current.h) < precision
                                        ) {
                                            setAnimatedLayoutOverrides(prev => {
                                                const next = { ...prev };
                                                delete next[activeId];
                                                return next;
                                            });
                                            return;
                                        }

                                        setAnimatedLayoutOverrides(prev => ({
                                            ...prev,
                                            [activeId]: { x: current.x, y: current.y, w: current.w, h: current.h }
                                        }));
                                        requestAnimationFrame(animate);
                                    };
                                    requestAnimationFrame(animate);

                                    clearGuides();
                                }}
                                style={{
                                    zIndex: dashboardEditMode ? (activeInstance.zIndex ?? 1) + 1000 : (activeInstance.zIndex ?? 1),
                                }}
                                className={`transition-shadow duration-300 ${isStacked ? 'shadow-2xl' : ''}`}
                            >
                                <AnimatePresence mode="wait" initial={false} custom={dir}>
                                    <motion.div
                                        key={activeId}
                                        custom={dir}
                                        variants={slideVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        className="h-full w-full"
                                    >
                                        <WidgetCard
                                            instance={activeInstance}
                                            definition={definition || {} as any}
                                            stackCount={instanceIds.length}
                                            groupId={groupId}
                                            groupLocked={groupLocked}
                                            onToggleGroupLock={toggleGroupLock}
                                            onCycleStack={handleCycleStack}
                                            onExpandStack={() => setExpandedGroupId(groupId)}
                                            onUnlinkFromStack={handleUnlinkFromStack}
                                            onRelinkToStacks={relinkToStacks}
                                        >
                                            {activeInstance.type === "projects_overview" ? (
                                                <ProjectsOverviewWidget instance={activeInstance} onNavigate={onNavigate} />
                                            ) : (
                                                <Component instance={activeInstance} />
                                            )}
                                        </WidgetCard>
                                    </motion.div>
                                </AnimatePresence>
                            </Rnd>
                        </Fragment>
                    );
                })}

                {/* Stack Expansion Modal */}
                <StackExpandModal
                    isOpen={!!expandedGroupId}
                    groupId={expandedGroupId}
                    instances={expandedGroupId ? (groups.find(g => g.groupId === expandedGroupId)?.instanceIds.map((id: string) => instances[id]).filter(Boolean) as WidgetInstance[]) : []}
                    activeId={expandedGroupId ? (activeInGroup[expandedGroupId] || groups.find(g => g.groupId === expandedGroupId)?.instanceIds[0] || "") : ""}
                    onSelect={(instanceId: string) => handleSetActiveInGroup(expandedGroupId!, instanceId)}
                    onClose={() => setExpandedGroupId(null)}
                />
            </div>
        </div>
    );
}
