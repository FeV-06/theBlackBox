"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { X, ChevronDown } from "lucide-react";
import { registryMap } from "@/lib/widgetRegistry";
import type { WidgetInstance } from "@/types/widgetInstance";
import type { TabId } from "@/types/widget";
import ProjectsOverviewWidget from "../ProjectsOverviewWidget";

interface MobileFocusCarouselProps {
    widgets: WidgetInstance[];
    initialIndex: number;
    onDismiss: () => void;
    onNavigate?: (tab: TabId) => void;
}

export default function MobileFocusCarousel({
    widgets,
    initialIndex,
    onDismiss,
    onNavigate,
}: MobileFocusCarouselProps) {
    const [jumpOpen, setJumpOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const swiperRef = useRef<SwiperType | null>(null);

    // ── Keyboard auto-open guard ──
    const lastPointerDownTime = useRef<number>(0);

    const handleCarouselPointerDown = useCallback(() => {
        lastPointerDownTime.current = Date.now();
    }, []);

    const handleFocusCapture = useCallback((e: React.FocusEvent) => {
        const target = e.target as HTMLElement;
        const isTextInput =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable;
        if (!isTextInput) return;
        if (Date.now() - lastPointerDownTime.current > 300) {
            e.stopPropagation();
            target.blur();
        }
    }, []);

    // ── Jump dropdown close on outside tap ──
    useEffect(() => {
        if (!jumpOpen) return;
        const handler = (e: PointerEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setJumpOpen(false);
            }
        };
        window.addEventListener("pointerdown", handler);
        return () => window.removeEventListener("pointerdown", handler);
    }, [jumpOpen]);

    const handleJump = useCallback((index: number) => {
        setJumpOpen(false);
        swiperRef.current?.slideTo(index);
    }, []);

    // ── Scroll-aware swipe-down dismiss ──
    // Walk ALL scrollable ancestors from the touch target upward.
    // Kanban columns are nested inside the data-scroll-lock wrapper — checking
    // only the wrapper's scrollTop misses them completely.
    const touchStartY = useRef(0);
    const touchDeltaY = useRef(0);
    const [dragY, setDragY] = useState(0);
    const isDragging = useRef(false);
    /** true if ANY scrollable ancestor had scrollTop > 0 when the finger landed */
    const touchStartedInScrolledContent = useRef(false);
    const carouselRootRef = useRef<HTMLDivElement>(null);

    /** Walk up from `el` to `stopAt`, return true if any element is scrolled down */
    const hasScrolledAncestor = useCallback((el: HTMLElement): boolean => {
        let node: HTMLElement | null = el;
        const stop = carouselRootRef.current;
        while (node && node !== stop) {
            if (node.scrollTop > 0 && node.scrollHeight > node.clientHeight) return true;
            node = node.parentElement;
        }
        return false;
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        touchDeltaY.current = 0;
        isDragging.current = false;
        // Record at finger-down whether the user is inside scrolled content.
        // This is the source of truth — checked once, never re-calculated mid-gesture.
        touchStartedInScrolledContent.current = hasScrolledAncestor(e.target as HTMLElement);
    }, [hasScrolledAncestor]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const dy = e.touches[0].clientY - touchStartY.current;

        if (dy <= 0) { setDragY(0); return; }

        // Finger landed inside scrolled content → never dismiss
        if (touchStartedInScrolledContent.current) { setDragY(0); return; }

        // Also check live state: the browser may have scrolled content between
        // touchStart and first touchMove (e.g. momentum carry-over)
        if (hasScrolledAncestor(e.target as HTMLElement)) { setDragY(0); return; }

        isDragging.current = true;
        touchDeltaY.current = dy;
        setDragY(dy * 0.55);
    }, [hasScrolledAncestor]);

    const handleTouchEnd = useCallback(() => {
        if (isDragging.current && touchDeltaY.current > 80) {
            onDismiss();
        } else {
            setDragY(0);
        }
        isDragging.current = false;
    }, [onDismiss]);


    // ── Pre-filter: no nulls inside <Swiper> ──
    const validWidgets = widgets.filter((inst) => !!registryMap.get(inst.type));

    // ── Active label ──
    const activeWidget = validWidgets[activeIndex];
    const activeLabel = activeWidget
        ? (activeWidget.title || registryMap.get(activeWidget.type)?.defaultTitle || "")
        : "";

    return (
        <motion.div
            ref={carouselRootRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22 } }}
            className="absolute inset-0 flex flex-col"
            style={{ background: "var(--color-bg)", overflow: "hidden" }}
            onPointerDownCapture={handleCarouselPointerDown}
            onFocusCapture={handleFocusCapture}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ── Top Bar ── */}
            <motion.div
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.1, duration: 0.28 } }}
                className="flex-shrink-0 flex items-center justify-between px-4 pt-10 pb-2 z-40"
            >
                {/* Dismiss button */}
                <motion.button
                    onTap={onDismiss}
                    whileTap={{ scale: 0.88 }}
                    className="flex items-center justify-center w-9 h-9 rounded-full"
                    style={{
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border)",
                        WebkitTapHighlightColor: "transparent",
                    }}
                    aria-label="Back to Launchpad"
                >
                    <X className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} strokeWidth={2} />
                </motion.button>

                {/* Active widget name */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={activeIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                        exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                        className="text-[14px] font-medium tracking-tight truncate max-w-[48%] text-center"
                        style={{ color: "var(--color-text-muted)" }}
                    >
                        {activeLabel}
                    </motion.p>
                </AnimatePresence>

                {/* Jump dropdown */}
                <div ref={dropdownRef} className="relative">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onTap={() => setJumpOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium"
                        style={{
                            background: "var(--color-bg-elevated)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        <span>Jump</span>
                        <motion.span
                            animate={{ rotate: jumpOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                        </motion.span>
                    </motion.button>

                    <AnimatePresence>
                        {jumpOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl z-50"
                                style={{
                                    background: "var(--color-bg-elevated)",
                                    border: "1px solid var(--color-border-hover)",
                                    backdropFilter: "blur(24px)",
                                }}
                            >
                                <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase"
                                    style={{ color: "var(--color-text-muted)" }}>
                                    Jump to
                                </p>
                                <div className="max-h-60 overflow-y-auto overscroll-contain">
                                    {validWidgets.map((inst, idx) => {
                                        const def = registryMap.get(inst.type)!;
                                        const Icon = def.icon;
                                        const isActive = idx === activeIndex;
                                        return (
                                            <button
                                                key={inst.instanceId}
                                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
                                                onClick={() => handleJump(idx)}
                                            >
                                                <Icon
                                                    className="w-3.5 h-3.5 flex-shrink-0"
                                                    style={{ color: isActive ? "var(--color-accent)" : "var(--color-text-muted)" }}
                                                    strokeWidth={1.8}
                                                />
                                                <span
                                                    className="text-[13px] truncate"
                                                    style={{ color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: isActive ? 500 : 400 }}
                                                >
                                                    {inst.title || def.defaultTitle}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="h-2" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── Dot Indicators ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.18 } }}
                className="flex-shrink-0 flex justify-center gap-1.5 pt-1 pb-2"
            >
                {validWidgets.map((_, idx) => (
                    <motion.button
                        key={idx}
                        onTap={() => handleJump(idx)}
                        animate={{
                            width: idx === activeIndex ? 18 : 6,
                            background: idx === activeIndex ? "var(--color-accent)" : "rgba(255,255,255,0.25)",
                        }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="h-1.5 rounded-full"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    />
                ))}
            </motion.div>

            {/* ── Swiper Carousel (with drag-Y resistance) ── */}
            <div
                className="flex-1 min-h-0"
                style={{
                    transform: `translateY(${dragY}px)`,
                    transition: isDragging.current ? "none" : "transform 0.28s cubic-bezier(0.25,1,0.5,1)",
                    opacity: Math.max(0, 1 - dragY / 220),
                }}
            >
                <Swiper
                    initialSlide={initialIndex}
                    spaceBetween={0}
                    slidesPerView={1}
                    onSwiper={(swiper) => { swiperRef.current = swiper; }}
                    onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                    style={{ height: "100%" }}
                >
                    {validWidgets.map((inst) => {
                        const def = registryMap.get(inst.type)!;
                        const Component = def.component;

                        return (
                            <SwiperSlide key={inst.instanceId} style={{ height: "100%" }}>
                                {/* data-scroll-lock: gesture system checks scrollTop here
                                    before deciding to dismiss the carousel */}
                                <div
                                    data-scroll-lock
                                    className="h-full mx-3 mb-3 rounded-2xl overflow-y-auto overscroll-contain"
                                    style={{
                                        background: "var(--color-bg-card)",
                                        border: "1px solid var(--color-border)",
                                    }}
                                >
                                    {inst.type === "projects_overview" ? (
                                        <ProjectsOverviewWidget instance={inst} onNavigate={onNavigate} />
                                    ) : (
                                        <Component instance={inst} />
                                    )}
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            {/* ── Drag handle pill + swipe hint ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.4 } }}
                className="flex-shrink-0 flex flex-col items-center gap-1 pb-3 pointer-events-none"
            >
                <div
                    className="w-10 h-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                />
                <p className="text-[10px] tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                    Pull down to close
                </p>
            </motion.div>
        </motion.div>
    );
}
