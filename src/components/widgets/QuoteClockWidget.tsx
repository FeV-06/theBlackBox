"use client";

import { useState, useEffect } from "react";
import { Clock, Quote } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { fetchQuote } from "@/lib/utils";

export default function QuoteClockWidget() {
    const [time, setTime] = useState("");
    const [date, setDate] = useState("");
    const [quote, setQuote] = useState("");
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
        fetchQuote(vibe).then(setQuote);
    }, [vibe]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-accent)" }}>
                    {time}
                </span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {date}
            </p>
            <div
                className="mt-2 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
                <p className="text-sm italic leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    &ldquo;{quote || "Loading..."}&rdquo;
                </p>
            </div>
        </div>
    );
}

QuoteClockWidget.widgetIcon = Clock;
QuoteClockWidget.widgetTitle = "Quote & Clock";
