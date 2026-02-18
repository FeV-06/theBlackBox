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

const CANVAS_MIN_HEIGHT = 1400;
const CANVAS_MIN_WIDTH = 1200;
const CANVAS_PADDING_PX = 800;

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

/* ── Auto-Scroll Constants ── */
const SCROLL_EDGE_THRESHOLD = 90;
const SCROLL_MAX_SPEED = 22;

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
    const canvasRef = useRef<HTMLDivElement>(null);

    /* ── Active Widget State per Group ── */
    const [activeInGroup, setActiveInGroup] = useState<Record<string, string>>({});

    // Animation direction for slides
    const [cycleDirection, setCycleDirection] = useState<Record<string, 1 | -1>>({});

    // Modal state
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

    // Alignment guide state
    const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });
    const [guidesVisible, setGuidesVisible] = useState(false);

    // Auto-scroll refs
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const scrollDirectionRef = useRef<"up" | "down" | null>(null);
    const scrollRafRef = useRef<number | null>(null);

    // Resolve scroll container once on mount (now guaranteed to work with h-screen)
    useEffect(() => {
        if (canvasRef.current) {
            scrollRef.current = canvasRef.current.closest("main") as HTMLDivElement | null;
        }
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

    /* ── Grouping Algorithm (Connected Components) ── */
    const groups = useMemo(() => {
        // Split instances: only those NOT disabled for grouping participate
        const groupable = visibleInstances.filter(i => !i.groupDisabled);
        const standalone = visibleInstances.filter(i => i.groupDisabled);

        const nodes = groupable.map(i => i.instanceId);
        const adj: Record<string, string[]> = {};
        nodes.forEach(id => adj[id] = []);

        for (let i = 0; i < groupable.length; i++) {
            for (let j = i + 1; j < groupable.length; j++) {
                const A = groupable[i];
                const B = groupable[j];
                const AL = A.layout!;
                const BL = B.layout!;

                const rectA = { left: AL.x, top: AL.y, right: AL.x + AL.w, bottom: AL.y + AL.h, w: AL.w, h: AL.h };
                const rectB = { left: BL.x, top: BL.y, right: BL.x + BL.w, bottom: BL.y + BL.h, w: BL.w, h: BL.h };

                const similarSize = Math.abs(rectA.w - rectB.w) <= WIDTH_SIMILARITY_PX &&
                    Math.abs(rectA.h - rectB.h) <= HEIGHT_SIMILARITY_PX;

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

    /* ── Dynamic Canvas Size ── */
    const { canvasHeight } = useMemo(() => {
        let maxBottom = 0;
        visibleInstances.forEach(inst => {
            const bottom = inst.layout!.y + inst.layout!.h;
            if (bottom > maxBottom) maxBottom = bottom;
        });

        return {
            canvasHeight: Math.max(CANVAS_MIN_HEIGHT, maxBottom + CANVAS_PADDING_PX),
        };
    }, [visibleInstances]);

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

        // Auto-align: Snap next active widget to current active widget's position to prevent drift
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

        // Persistent unlinking
        unlinkFromStack(instanceId);

        // Deterministic separation (width + 260px)
        const offset = inst.layout.w + 260;
        updateInstanceLayout(instanceId, {
            x: snap(inst.layout.x + offset),
            y: snap(inst.layout.y),
        });

        // Ensure it becomes standalone immediately by removing from activeInGroup state
        setActiveInGroup(prev => {
            const copy = { ...prev };
            delete copy[groupId];
            return copy;
        });
    }, [instances, updateInstanceLayout, unlinkFromStack]);

    /* ── Clear Guides Helper ── */
    const clearGuides = useCallback(() => {
        setGuidesVisible(false);
        // Delay actual clear to allow fade-out
        setTimeout(() => setGuides({ vertical: [], horizontal: [] }), 150);
    }, []);

    /* ── Auto-Scroll Helpers ── */
    const autoScrollLoop = useCallback(() => {
        if (!scrollRef.current || !scrollDirectionRef.current) return;
        const speed = scrollDirectionRef.current === "down" ? SCROLL_MAX_SPEED : -SCROLL_MAX_SPEED;
        scrollRef.current.scrollTop += speed;
        scrollRafRef.current = requestAnimationFrame(autoScrollLoop);
    }, []);

    const startAutoScroll = useCallback((dir: "up" | "down") => {
        if (scrollDirectionRef.current === dir) return;
        scrollDirectionRef.current = dir;
        if (!scrollRafRef.current) {
            scrollRafRef.current = requestAnimationFrame(autoScrollLoop);
        }
    }, [autoScrollLoop]);

    const stopAutoScroll = useCallback(() => {
        scrollDirectionRef.current = null;
        if (scrollRafRef.current) {
            cancelAnimationFrame(scrollRafRef.current);
            scrollRafRef.current = null;
        }
    }, []);

    // Cleanup auto-scroll on unmount
    useEffect(() => {
        return () => stopAutoScroll();
    }, [stopAutoScroll]);

    /* ── Render Logic ── */
    return (
        <div
            ref={canvasRef}
            className="relative w-full pb-[600px] overflow-visible"
            style={{
                height: canvasHeight,
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
                        height: canvasHeight,
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
                            bounds={canvasRef.current || 'parent'}
                            size={{ width: activeInstance.layout.w, height: activeInstance.layout.h }}
                            position={{ x: anchorX, y: anchorY }}
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
                            onDrag={(e, d) => {
                                const w = activeInstance.layout!.w;
                                const h = activeInstance.layout!.h;
                                const activeRect: WidgetRect = {
                                    id: activeId,
                                    left: d.x,
                                    top: d.y,
                                    right: d.x + w,
                                    bottom: d.y + h,
                                    centerX: d.x + w / 2,
                                    centerY: d.y + h / 2,
                                    w,
                                    h,
                                };
                                const result = computeDragAlignment(activeRect, otherRects);
                                setGuides({ vertical: result.verticalGuides, horizontal: result.horizontalGuides });
                                setGuidesVisible(result.verticalGuides.length > 0 || result.horizontalGuides.length > 0);
                                // Auto-scroll: use pointer Y against viewport edges
                                if (dashboardEditMode) {
                                    const mouseY = (e as MouseEvent).clientY;
                                    const distTop = mouseY;
                                    const distBottom = window.innerHeight - mouseY;
                                    if (distTop < SCROLL_EDGE_THRESHOLD) {
                                        startAutoScroll("up");
                                    } else if (distBottom < SCROLL_EDGE_THRESHOLD) {
                                        startAutoScroll("down");
                                    } else {
                                        stopAutoScroll();
                                    }
                                }
                            }}
                            onDragStop={(e, d) => {
                                const w = activeInstance.layout!.w;
                                const h = activeInstance.layout!.h;
                                const activeRect: WidgetRect = {
                                    id: activeId,
                                    left: d.x,
                                    top: d.y,
                                    right: d.x + w,
                                    bottom: d.y + h,
                                    centerX: d.x + w / 2,
                                    centerY: d.y + h / 2,
                                    w,
                                    h,
                                };
                                // Step 1: Extract current active layout
                                const oldX = activeInstance.layout!.x;
                                const oldY = activeInstance.layout!.y;

                                // Step 2: Snap only the dropped position of the active widget
                                const snappedNewX = snap(d.x);
                                const snappedNewY = snap(d.y);

                                // Step 3: Compute translation delta safely
                                const dx = snappedNewX - oldX;
                                const dy = snappedNewY - oldY;

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
                                // (This guarantees alignment even if not stacked)
                                updateInstanceLayout(activeId, {
                                    x: Math.max(0, snappedNewX),
                                    y: Math.max(0, snappedNewY),
                                });

                                clearGuides();
                                stopAutoScroll();
                            }}
                            onResize={(e, direction, ref, delta, pos) => {
                                const newW = ref.offsetWidth;
                                const newH = ref.offsetHeight;
                                const result = computeResizeAlignment(activeId, pos.x, pos.y, newW, newH, otherRects);
                                setGuides({ vertical: result.verticalGuides, horizontal: result.horizontalGuides });
                                setGuidesVisible(result.verticalGuides.length > 0 || result.horizontalGuides.length > 0);
                            }}
                            onResizeStop={(e, direction, ref, delta, pos) => {
                                const newW = ref.offsetWidth;
                                const newH = ref.offsetHeight;
                                const result = computeResizeAlignment(activeId, pos.x, pos.y, newW, newH, otherRects);
                                updateInstanceLayout(activeId, {
                                    w: snap(result.snappedW),
                                    h: snap(result.snappedH),
                                    x: snap(pos.x),
                                    y: snap(pos.y),
                                });
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
    );
}
