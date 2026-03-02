"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useWidgetStore } from "@/store/useWidgetStore";
import { registryMap } from "@/lib/widgetRegistry";
import type { WidgetInstance } from "@/types/widgetInstance";
import MobileLaunchpad from "./MobileLaunchpad";
import MobileFocusCarousel from "./MobileFocusCarousel";
import type { TabId } from "@/types/widget";

interface MobileWidgetDeckProps {
    onNavigate?: (tab: TabId) => void;
}

export default function MobileWidgetDeck({ onNavigate }: MobileWidgetDeckProps) {
    const { instances, layout } = useWidgetStore();
    const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);

    // Derive the ordered flat list of visible, enabled widgets (no section_dividers — they're desktop-only spacers)
    const mobileWidgets: WidgetInstance[] = layout
        .map((id) => instances[id])
        .filter(
            (inst): inst is WidgetInstance =>
                !!inst &&
                inst.enabled &&
                inst.type !== "section_divider" &&
                !!registryMap.get(inst.type)
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
                    <MobileLaunchpad
                        key="launchpad"
                        widgets={mobileWidgets}
                        onFocus={handleFocus}
                    />
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
