"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays, Plus, Trash2, Edit3, ChevronLeft, ChevronRight,
    LogIn, RefreshCw, Loader2,
} from "lucide-react";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";

interface GoogleEvent {
    id: string;
    summary: string;
    description: string;
    start: string;
    end: string;
}

const COLORS = ["#7C5CFF", "#4ADE80", "#F87171", "#FBBF24", "#38BDF8", "#E879F9"];

export default function CalendarTab() {
    const { isConnected, connectWithPopup, checkConnection } = useGoogleAuthStore();

    const [events, setEvents] = useState<GoogleEvent[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [selDate, setSelDate] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editEvent, setEditEvent] = useState<GoogleEvent | null>(null);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [sTime, setSTime] = useState("09:00");
    const [eTime, setETime] = useState("10:00");
    const [color, setColor] = useState(COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { checkConnection(); }, [checkConnection]);

    const fetchEvents = useCallback(async () => {
        if (!isConnected) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/google/calendar/events");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setEvents(data.events ?? []);
        } catch {
            setError("Failed to load calendar events");
        } finally {
            setLoading(false);
        }
    }, [isConnected]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Calendar math
    const daysIn = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const mName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const prevM = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
    const nextM = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

    const eventsForDate = (ds: string) =>
        events.filter((e) => {
            const eDate = e.start.slice(0, 10);
            return eDate === ds;
        });

    const dayEvents = selDate ? eventsForDate(selDate) : [];

    const reset = () => {
        setTitle(""); setDesc(""); setSTime("09:00"); setETime("10:00");
        setColor(COLORS[0]); setEditEvent(null); setShowForm(false);
    };

    const handleSave = async () => {
        if (!title.trim() || !selDate) return;
        setSaving(true);
        try {
            const start = `${selDate}T${sTime}:00`;
            const end = `${selDate}T${eTime}:00`;

            if (editEvent) {
                // Update
                const res = await fetch(`/api/google/calendar/events/${editEvent.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ summary: title.trim(), description: desc.trim(), start, end }),
                });
                if (!res.ok) throw new Error("Update failed");
            } else {
                // Create
                const res = await fetch("/api/google/calendar/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ summary: title.trim(), description: desc.trim(), start, end }),
                });
                if (!res.ok) throw new Error("Create failed");
            }
            reset();
            await fetchEvents();
        } catch {
            setError("Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (eventId: string) => {
        try {
            const res = await fetch(`/api/google/calendar/events/${eventId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            await fetchEvents();
        } catch {
            setError("Failed to delete event");
        }
    };

    const handleEdit = (ev: GoogleEvent) => {
        setTitle(ev.summary);
        setDesc(ev.description);
        const s = ev.start.length > 10 ? ev.start.slice(11, 16) : "09:00";
        const e = ev.end.length > 10 ? ev.end.slice(11, 16) : "10:00";
        setSTime(s);
        setETime(e);
        setEditEvent(ev);
        setShowForm(true);
    };

    // ─── Not connected state ───
    if (!isConnected) {
        return (
            <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Calendar</h1>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Connect Google to manage your calendar</p>
                    </div>
                </div>
                <div className="glass-card p-8 flex flex-col items-center gap-4">
                    <CalendarDays size={40} style={{ color: "var(--color-text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Connect your Google account to sync your calendar</p>
                    <button onClick={connectWithPopup} className="btn-accent flex items-center gap-2 px-4 py-2">
                        <LogIn size={16} /> Connect Google
                    </button>
                </div>
            </div>
        );
    }

    // ─── Connected state ───
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Calendar</h1>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Google Calendar — synced</p>
                </div>
                <button onClick={fetchEvents} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-xs">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {error && (
                <div className="glass-card p-3 mb-4 text-xs" style={{ color: "var(--color-danger)", borderColor: "rgba(248,113,113,0.2)" }}>
                    {error}
                    <button onClick={() => setError("")} className="ml-2 underline">dismiss</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Month grid */}
                <div className="lg:col-span-2 glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevM} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "var(--color-text-secondary)" }}><ChevronLeft size={18} /></button>
                        <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{mName}</h3>
                        <button onClick={nextM} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "var(--color-text-secondary)" }}><ChevronRight size={18} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                            <div key={d} className="text-center text-xs py-2 font-medium" style={{ color: "var(--color-text-muted)" }}>{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysIn }).map((_, i) => {
                            const day = i + 1; const ds = dateStr(day); const isT = ds === today; const isS = ds === selDate;
                            const cnt = eventsForDate(ds).length;
                            return (
                                <button key={day} onClick={() => setSelDate(ds)}
                                    className="relative h-10 rounded-lg text-sm transition-all hover:bg-white/[0.04] flex flex-col items-center justify-center"
                                    style={{
                                        background: isS ? "rgba(124,92,255,0.15)" : isT ? "rgba(124,92,255,0.06)" : "transparent",
                                        color: isS || isT ? "var(--color-accent)" : "var(--color-text-primary)", fontWeight: isT ? 600 : 400
                                    }}>
                                    {day}
                                    {cnt > 0 && <div className="flex gap-0.5 mt-0.5">{Array.from({ length: Math.min(cnt, 3) }).map((_, j) => (
                                        <div key={j} className="w-1 h-1 rounded-full" style={{ background: "var(--color-accent)" }} />
                                    ))}</div>}
                                </button>
                            );
                        })}
                    </div>
                    {loading && (
                        <div className="flex items-center justify-center mt-4 gap-2" style={{ color: "var(--color-text-muted)" }}>
                            <Loader2 size={14} className="animate-spin" /> <span className="text-xs">Loading events...</span>
                        </div>
                    )}
                </div>

                {/* Day panel */}
                <div className="glass-card p-5">
                    {selDate ? (<>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                                {new Date(selDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </h3>
                            <button onClick={() => { reset(); setShowForm(true); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "var(--color-accent)" }}><Plus size={16} /></button>
                        </div>

                        {/* Event form */}
                        <AnimatePresence>{showForm && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-2 mb-4 p-3 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
                                    className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[color:var(--color-accent)]" style={{ color: "var(--color-text-primary)" }} />
                                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description"
                                    className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none" style={{ color: "var(--color-text-primary)" }} />
                                <div className="flex gap-2">
                                    <input type="time" value={sTime} onChange={e => setSTime(e.target.value)} className="flex-1 bg-transparent border border-[color:var(--color-border)] rounded-lg px-2 py-1 text-xs outline-none" style={{ color: "var(--color-text-primary)", colorScheme: "dark" }} />
                                    <input type="time" value={eTime} onChange={e => setETime(e.target.value)} className="flex-1 bg-transparent border border-[color:var(--color-border)] rounded-lg px-2 py-1 text-xs outline-none" style={{ color: "var(--color-text-primary)", colorScheme: "dark" }} />
                                </div>
                                <div className="flex gap-1.5">{COLORS.map(c => (
                                    <button key={c} onClick={() => setColor(c)} className="w-5 h-5 rounded-full" style={{ background: c, outline: color === c ? "2px solid white" : "none", outlineOffset: 2 }} />
                                ))}</div>
                                <div className="flex gap-2">
                                    <button onClick={handleSave} disabled={saving} className="btn-accent text-xs px-3 py-1 flex items-center gap-1">
                                        {saving && <Loader2 size={12} className="animate-spin" />}
                                        {editEvent ? "Update" : "Add"}
                                    </button>
                                    <button onClick={reset} className="btn-ghost text-xs px-3 py-1">Cancel</button>
                                </div>
                            </motion.div>
                        )}</AnimatePresence>

                        {/* Day events list */}
                        <div className="flex flex-col gap-2">
                            {dayEvents.length === 0 && !showForm && <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>No events</p>}
                            {dayEvents.map(ev => {
                                const startTime = ev.start.length > 10 ? ev.start.slice(11, 16) : "all-day";
                                const endTime = ev.end.length > 10 ? ev.end.slice(11, 16) : "";
                                return (
                                    <div key={ev.id} className="flex items-start gap-2 p-3 rounded-xl group" style={{ background: "rgba(255,255,255,0.02)" }}>
                                        <div className="w-1 h-8 rounded-full mt-0.5" style={{ background: COLORS[0] }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{ev.summary}</p>
                                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{startTime}{endTime ? ` – ${endTime}` : ""}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(ev)} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}><Edit3 size={12} /></button>
                                            <button onClick={() => handleDelete(ev.id)} className="p-1 rounded hover:bg-white/5" style={{ color: "var(--color-danger)" }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <CalendarDays size={32} className="mb-3" style={{ color: "var(--color-text-muted)" }} />
                            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Select a date</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
