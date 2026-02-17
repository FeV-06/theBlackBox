"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays, Plus, Trash2, Edit3, ChevronLeft, ChevronRight,
    LogIn, RefreshCw, Loader2, Pencil, MapPin, RotateCcw,
} from "lucide-react";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";
import {
    type CalendarEvent,
    isAllDayEvent,
    getEventDateLocal,
    formatEventTimeRange,
    extractTimeHHMM,
    buildDateTimeISO,
    getBrowserTimeZone,
} from "@/lib/calendarTime";
import {
    type GoogleColorMap,
    getEventColorStyle,
    getEventBarColor,
    getEventDotColor,
    getColorPickerOptions,
} from "@/lib/calendarColors";

/* ── helpers ── */
const fmtDateLabel = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
        day: "numeric", month: "short", year: "numeric",
    });

const fmtLongDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
    });

export default function CalendarTab() {
    const { isConnected, connectWithPopup, checkConnection } = useGoogleAuthStore();

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [colorMap, setColorMap] = useState<GoogleColorMap | null>(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth());
    const [selDate, setSelDate] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

    // Form fields
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [sTime, setSTime] = useState("09:00");
    const [eTime, setETime] = useState("10:00");
    const [selColorId, setSelColorId] = useState<string | undefined>(undefined);

    // Edit-specific: original context + move-to date
    const [origDate, setOrigDate] = useState<string | null>(null);
    const [origSTime, setOrigSTime] = useState("");
    const [origETime, setOrigETime] = useState("");
    const [moveDate, setMoveDate] = useState<string>("");
    const [calChangedHint, setCalChangedHint] = useState(false);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { checkConnection(); }, [checkConnection]);

    const fetchColors = useCallback(async () => {
        try {
            const res = await fetch("/api/google/calendar/colors");
            if (!res.ok) return;
            const data = await res.json();
            setColorMap(data.event ?? null);
        } catch { /* non-critical */ }
    }, []);

    const fetchEvents = useCallback(async () => {
        if (!isConnected) return;
        setLoading(true);
        setError("");
        try {
            const gridStart = new Date(year, month, 1);
            gridStart.setDate(gridStart.getDate() - gridStart.getDay());
            const gridEnd = new Date(year, month + 1, 0);
            gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()) + 1);
            const params = new URLSearchParams({
                timeMin: gridStart.toISOString(),
                timeMax: gridEnd.toISOString(),
            });
            const res = await fetch(`/api/google/calendar/events?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setEvents(data.events ?? []);
        } catch {
            setError("Failed to load calendar events");
        } finally {
            setLoading(false);
        }
    }, [isConnected, year, month]);

    useEffect(() => {
        if (isConnected) { fetchEvents(); fetchColors(); }
    }, [isConnected, fetchEvents, fetchColors]);

    // Calendar math
    const daysIn = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const mName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const prevM = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
    const nextM = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

    const eventsForDate = (ds: string) => events.filter((ev) => getEventDateLocal(ev) === ds);
    const dayEvents = selDate ? eventsForDate(selDate) : [];
    const colorOptions = getColorPickerOptions(colorMap);

    // When editing: compute final save date (moveDate for edits, selDate for creates)
    const isEditing = !!editEvent;
    const saveDate = isEditing ? moveDate : selDate;

    // Detect calendar selection change while editing
    const handleDateSelect = useCallback((ds: string) => {
        if (isEditing && showForm && ds !== moveDate) {
            setCalChangedHint(true);
        }
        setSelDate(ds);
    }, [isEditing, showForm, moveDate]);

    const reset = () => {
        setTitle(""); setDesc(""); setSTime("09:00"); setETime("10:00");
        setSelColorId(undefined); setEditEvent(null); setShowForm(false);
        setOrigDate(null); setOrigSTime(""); setOrigETime("");
        setMoveDate(""); setCalChangedHint(false);
    };

    const handleSave = async () => {
        if (!title.trim() || !saveDate) return;
        setSaving(true);
        try {
            const tz = getBrowserTimeZone();
            const start = buildDateTimeISO(saveDate, sTime, tz);
            const end = buildDateTimeISO(saveDate, eTime, tz);
            const payload: Record<string, unknown> = {
                summary: title.trim(), description: desc.trim(), start, end, timeZone: tz,
            };
            if (selColorId) payload.colorId = selColorId;

            if (editEvent) {
                const res = await fetch(`/api/google/calendar/events/${editEvent.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Update failed");
            } else {
                const res = await fetch("/api/google/calendar/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
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

    const handleEdit = (ev: CalendarEvent) => {
        const evDate = getEventDateLocal(ev);
        const evSTime = extractTimeHHMM(ev.start, ev.startTimeZone);
        const evETime = extractTimeHHMM(ev.end, ev.endTimeZone);
        setTitle(ev.summary);
        setDesc(ev.description);
        setSTime(evSTime);
        setETime(evETime);
        setSelColorId(ev.colorId);
        setOrigDate(evDate);
        setOrigSTime(evSTime);
        setOrigETime(evETime);
        setMoveDate(evDate);
        setCalChangedHint(false);
        setEditEvent(ev);
        setShowForm(true);
    };

    // Memoized preview label
    const previewDateLabel = useMemo(() => {
        if (!saveDate) return "";
        return fmtDateLabel(saveDate);
    }, [saveDate]);

    // ─── Not connected ───
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

    // ─── Connected ───
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
                            const dateEvents = eventsForDate(ds);
                            const cnt = dateEvents.length;
                            return (
                                <button key={day} onClick={() => handleDateSelect(ds)}
                                    className="relative h-10 rounded-lg text-sm transition-all hover:bg-white/[0.04] flex flex-col items-center justify-center"
                                    style={{
                                        background: isS ? "rgba(124,92,255,0.15)" : isT ? "rgba(124,92,255,0.06)" : "transparent",
                                        color: isS || isT ? "var(--color-accent)" : "var(--color-text-primary)", fontWeight: isT ? 600 : 400
                                    }}>
                                    {day}
                                    {cnt > 0 && (
                                        <div className="flex gap-0.5 mt-0.5">
                                            {dateEvents.slice(0, 3).map((ev, j) => (
                                                <div key={j} className="w-1 h-1 rounded-full" style={{ background: getEventDotColor(ev.colorId, colorMap) }} />
                                            ))}
                                        </div>
                                    )}
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
                                {fmtLongDate(selDate)}
                            </h3>
                            <button onClick={() => { reset(); setShowForm(true); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "var(--color-accent)" }}><Plus size={16} /></button>
                        </div>

                        {/* ── Event form ── */}
                        <AnimatePresence>{showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-3 mb-4 overflow-hidden"
                            >
                                {/* ── Sticky Edit Context Banner ── */}
                                {isEditing && origDate && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl p-4 backdrop-blur-xl"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(124,92,255,0.08), rgba(124,92,255,0.02))",
                                            border: "1px solid rgba(124,92,255,0.25)",
                                            boxShadow: "0 0 20px rgba(124,92,255,0.08)",
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Pencil size={14} style={{ color: "#7C5CFF" }} />
                                            <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                                                Editing Event: <span style={{ color: "#7C5CFF" }}>{editEvent?.summary}</span>
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                                📅 Original Date: <span style={{ color: "var(--color-text-primary)" }}>{fmtDateLabel(origDate)}</span>
                                            </span>
                                            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                                ⏱️ Original Time: <span style={{ color: "var(--color-text-primary)" }}>{origSTime} – {origETime}</span>
                                            </span>
                                        </div>

                                        {/* Calendar selection changed hint */}
                                        {calChangedHint && selDate !== moveDate && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-xs italic mt-2"
                                                style={{ color: "rgba(251,191,36,0.9)" }}
                                            >
                                                You selected {fmtDateLabel(selDate!)} on the calendar. Click &quot;Use Selected Date&quot; to move this event.
                                            </motion.p>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── Form fields ── */}
                                <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
                                        className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[color:var(--color-accent)]" style={{ color: "var(--color-text-primary)" }} />
                                    <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description"
                                        className="bg-transparent border border-[color:var(--color-border)] rounded-lg px-3 py-1.5 text-xs outline-none" style={{ color: "var(--color-text-primary)" }} />
                                    <div className="flex gap-2">
                                        <input type="time" value={sTime} onChange={e => setSTime(e.target.value)} className="flex-1 bg-transparent border border-[color:var(--color-border)] rounded-lg px-2 py-1 text-xs outline-none" style={{ color: "var(--color-text-primary)", colorScheme: "dark" }} />
                                        <input type="time" value={eTime} onChange={e => setETime(e.target.value)} className="flex-1 bg-transparent border border-[color:var(--color-border)] rounded-lg px-2 py-1 text-xs outline-none" style={{ color: "var(--color-text-primary)", colorScheme: "dark" }} />
                                    </div>
                                    {/* Color picker */}
                                    {colorOptions.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs mr-1" style={{ color: "var(--color-text-muted)" }}>Color:</span>
                                            <button onClick={() => setSelColorId(undefined)}
                                                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                                                style={{ background: "linear-gradient(135deg, #7C5CFF, #5B3FCC)", outline: selColorId === undefined ? "2px solid white" : "none", outlineOffset: 2 }}
                                                title="Default" />
                                            {colorOptions.map(opt => (
                                                <button key={opt.id} onClick={() => setSelColorId(opt.id)}
                                                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                                                    style={{ background: opt.background, outline: selColorId === opt.id ? "2px solid white" : "none", outlineOffset: 2 }}
                                                    title={`Color ${opt.id}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Move Event To (edit only) ── */}
                                {isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-xl p-3"
                                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    >
                                        <div className="mb-2">
                                            <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Move Event To</p>
                                            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                                                Change the event&apos;s date explicitly. Won&apos;t change unless you confirm.
                                            </p>
                                        </div>

                                        {/* Date input */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <CalendarDays size={14} style={{ color: "var(--color-text-muted)" }} />
                                            <input
                                                type="date"
                                                value={moveDate}
                                                onChange={e => { setMoveDate(e.target.value); setCalChangedHint(false); }}
                                                className="flex-1 bg-transparent rounded-xl px-3 py-1.5 text-xs outline-none"
                                                style={{
                                                    color: "var(--color-text-primary)",
                                                    colorScheme: "dark",
                                                    background: "rgba(255,255,255,0.03)",
                                                    border: "1px solid rgba(255,255,255,0.06)",
                                                }}
                                            />
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { if (selDate) { setMoveDate(selDate); setCalChangedHint(false); } }}
                                                className="flex-1 text-xs px-3 py-1.5 rounded-xl font-medium transition-all hover:scale-[1.02]"
                                                style={{
                                                    background: "linear-gradient(135deg, rgba(124,92,255,0.25), rgba(124,92,255,0.15))",
                                                    color: "#EDEBFF",
                                                    border: "1px solid rgba(124,92,255,0.35)",
                                                }}
                                            >
                                                Use Selected Date
                                            </button>
                                            <button
                                                onClick={() => { if (origDate) { setMoveDate(origDate); setCalChangedHint(false); } }}
                                                className="flex-1 text-xs px-3 py-1.5 rounded-xl font-medium transition-all hover:scale-[1.02] hover:border-[color:var(--color-accent)]"
                                                style={{
                                                    background: "transparent",
                                                    color: "var(--color-text-secondary)",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                }}
                                            >
                                                <RotateCcw size={10} className="inline mr-1" />
                                                Reset to Original
                                            </button>
                                        </div>

                                        {/* Preview row */}
                                        <motion.div
                                            key={saveDate}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-1.5 mt-2.5 pt-2"
                                            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                                        >
                                            <MapPin size={12} style={{ color: "#7C5CFF" }} />
                                            <span className="text-xs" style={{ color: "rgba(124,92,255,0.85)" }}>
                                                Event will be saved on: <span className="font-medium" style={{ color: "#7C5CFF" }}>{previewDateLabel}</span>
                                            </span>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* ── Save / Cancel ── */}
                                <div className="flex gap-2">
                                    <button onClick={handleSave} disabled={saving} className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1">
                                        {saving && <Loader2 size={12} className="animate-spin" />}
                                        {editEvent ? "Update" : "Add"}
                                    </button>
                                    <button onClick={reset} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                                </div>
                            </motion.div>
                        )}</AnimatePresence>

                        {/* ── Day events list ── */}
                        <div className="flex flex-col gap-2">
                            {dayEvents.length === 0 && !showForm && <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>No events</p>}
                            {dayEvents.map(ev => {
                                const timeLabel = formatEventTimeRange(ev);
                                const colorStyle = getEventColorStyle(ev.colorId, colorMap);
                                const barColor = getEventBarColor(ev.colorId, colorMap);
                                return (
                                    <div key={ev.id}
                                        className="flex items-start gap-2 p-3 rounded-xl group transition-colors"
                                        style={{ background: colorStyle.backgroundColor, border: `1px solid ${colorStyle.borderColor}` }}
                                    >
                                        <div className="w-1 h-8 rounded-full mt-0.5 flex-shrink-0" style={{ background: barColor }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{ev.summary}</p>
                                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{timeLabel}</p>
                                        </div>
                                        {!isAllDayEvent(ev) && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(ev)} className="p-1 rounded hover:bg-white/10" style={{ color: "var(--color-text-muted)" }}><Edit3 size={12} /></button>
                                                <button onClick={() => handleDelete(ev.id)} className="p-1 rounded hover:bg-white/10" style={{ color: "var(--color-danger)" }}><Trash2 size={12} /></button>
                                            </div>
                                        )}
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
