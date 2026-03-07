"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { useWidgetStore } from "@/store/useWidgetStore";
import { registryMap } from "@/lib/widgetRegistry";
import type { WidgetInstance } from "@/types/widgetInstance";
import MobileLaunchpad from "./MobileLaunchpad";
import MobileFocusCarousel from "./MobileFocusCarousel";
import type { TabId } from "@/types/widget";
import { widgetTemplateRegistry } from "@/widgets/registry";

interface MobileWidgetDeckProps {
    onNavigate?: (tab: TabId) => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

export default function MobileWidgetDeck({ onNavigate }: MobileWidgetDeckProps) {
    const { instances, layout, canvases, activeCanvasId, switchCanvas } = useWidgetStore();
    const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);

    // Derive the ordered flat list of visible, enabled widgets (no section_dividers — they're desktop-only spacers)
    const mobileWidgets: WidgetInstance[] = layout
        .map((id) => instances[id])
        .filter(
            (inst): inst is WidgetInstance =>
                !!inst &&
                inst.enabled &&
                inst.type !== "section_divider" &&
                (!!registryMap.get(inst.type) || !!widgetTemplateRegistry.get(inst.type))
        );

    const handleFocus = useCallback((id: string) => {
        setFocusedWidgetId(id);
    }, []);

    const handleDismiss = useCallback(() => {
        setFocusedWidgetId(null);
    }, []);

    const focusedIndex = focusedWidgetId
        ? mobileWidgets.findIndex((w) => w.instanceId === focusedWidgetId)
        : -1;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ background: "var(--color-bg)" }}>
            <AnimatePresence mode="wait">
                {focusedWidgetId === null ? (
                    <motion.div
                        key={`launchpad-container-${activeCanvasId}`}
                        className="w-full h-full absolute inset-0"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
                            const swipe = swipePower(offset.x, velocity.x);

                            if (swipe < -swipeConfidenceThreshold) {
                                // Swipe left -> Next canvas
                                const currentIndex = canvases.findIndex(c => c.id === activeCanvasId);
                                const nextIndex = (currentIndex + 1) % canvases.length;
                                switchCanvas(canvases[nextIndex].id);
                            } else if (swipe > swipeConfidenceThreshold) {
                                // Swipe right -> Previous canvas
                                const currentIndex = canvases.findIndex(c => c.id === activeCanvasId);
                                const nextIndex = (currentIndex - 1 + canvases.length) % canvases.length;
                                switchCanvas(canvases[nextIndex].id);
                            }
                        }}
                    >
                        <MobileLaunchpad
                            key="launchpad"
                            widgets={mobileWidgets}
                            onFocus={handleFocus}
                            canvasName={canvases.find(c => c.id === activeCanvasId)?.name}
                            canvasesCount={canvases.length}
                            currentCanvasIndex={canvases.findIndex(c => c.id === activeCanvasId)}
                        />
                    </motion.div>
                ) : (
                    <MobileFocusCarousel
                        key={`carousel-${focusedWidgetId}`}
                        widgets={mobileWidgets}
                        initialIndex={Math.max(0, focusedIndex)}
                        onDismiss={handleDismiss}
                        onNavigate={onNavigate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
