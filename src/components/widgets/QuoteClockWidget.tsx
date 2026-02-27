"use client";

import { useState, useEffect } from "react";
import { Clock, Quote } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { fetchQuote } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetInstance } from "@/types/widgetInstance";
import { SkeletonLines } from "@/components/ui/Skeleton";

export default function QuoteClockWidget({ instance }: { instance: WidgetInstance }) {
    const [time, setTime] = useState("");
    const [date, setDate] = useState("");
    const [quoteStr, setQuoteStr] = useState("");
    const [loading, setLoading] = useState(true);
    const vibe = useSettingsStore((s) => s.quoteVibe);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                })
            );
            setDate(
                now.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                })
            );
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchQuote(vibe).then((q) => {
            setQuoteStr(q);
            setLoading(false);
        });
    }, [vibe]);

    const [text, author] = quoteStr.split(" — ");

    return (
        <div className="flex flex-col gap-3 @md:gap-4 @xl:gap-6 h-full @container">
            <div className="flex items-baseline gap-3">
                <span className="text-3xl @md:text-4xl @xl:text-5xl font-bold tracking-tight transition-all" style={{ color: "var(--color-accent)" }}>
                    {time}
                </span>
            </div>
            <p className="text-sm @md:text-base @xl:text-lg transition-all" style={{ color: "var(--color-text-secondary)" }}>
                {date}
            </p>
            <div
                className="mt-2 pt-3 min-h-[72px]"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <SkeletonLines lines={3} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="quote"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-1 @md:gap-2 @xl:gap-3"
                        >
                            <p className="text-sm @md:text-base @xl:text-lg italic leading-relaxed line-clamp-3 transition-all" style={{ color: "var(--color-text-secondary)" }}>
                                &ldquo;{text}&rdquo;
                            </p>
                            {author && (
                                <p className="text-xs @md:text-sm @xl:text-base font-medium truncate opacity-60 transition-all" style={{ color: "var(--color-text-primary)" }}>
                                    — {author}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

QuoteClockWidget.widgetIcon = Clock;
QuoteClockWidget.widgetTitle = "Quote & Clock";
