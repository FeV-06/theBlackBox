"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, RefreshCw, ExternalLink, LogIn } from "lucide-react";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";

interface GmailData {
    unreadCount: number;
    last5Subjects: string[];
}

export default function GmailWidget() {
    const { isConnected, connectWithPopup, checkConnection } = useGoogleAuthStore();
    const [data, setData] = useState<GmailData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check connection on mount
    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/google/gmail/summary");
            if (res.status === 401) {
                setError("Session expired. Reconnect Google.");
                return;
            }
            if (!res.ok) throw new Error("API error");
            const json = await res.json();
            setData(json);
        } catch {
            setError("Failed to load emails");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isConnected) fetchSummary();
    }, [isConnected, fetchSummary]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Mail size={28} style={{ color: "var(--color-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Connect Google to see your inbox
                </p>
                <button onClick={connectWithPopup} className="btn-accent text-xs flex items-center gap-1.5 px-3 py-1.5">
                    <LogIn size={13} /> Connect Google
                </button>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-8">
                <RefreshCw size={18} className="animate-spin" style={{ color: "var(--color-accent)" }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-6 gap-2">
                <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>
                <button onClick={fetchSummary} className="btn-ghost text-xs">Retry</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Unread count */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(124,92,255,0.12)" }}
                    >
                        <Mail size={16} style={{ color: "var(--color-accent)" }} />
                    </div>
                    <div>
                        <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                            {data?.unreadCount ?? 0}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>unread</p>
                    </div>
                </div>
                <button
                    onClick={fetchSummary}
                    disabled={loading}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Last 5 subjects */}
            <div className="flex flex-col gap-1.5">
                {(data?.last5Subjects ?? []).map((subject, i) => (
                    <motion.a
                        key={i}
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg group transition-all hover:bg-white/[0.03]"
                    >
                        <span
                            className="flex-1 text-xs truncate"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            {subject}
                        </span>
                        <ExternalLink
                            size={11}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: "var(--color-text-muted)" }}
                        />
                    </motion.a>
                ))}
            </div>
        </div>
    );
}
