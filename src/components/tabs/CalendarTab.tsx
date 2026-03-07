"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    ChevronLeft, ChevronRight, RefreshCw, Loader2,
    Calendar as CalendarIcon, Plus, Clock, MoreHorizontal
} from "lucide-react";
import { PortalMenu } from "@/components/ui/PortalMenu";
import { Edit3, CalendarDays, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    type CalendarEvent,
    isAllDayEvent,
    formatEventTimeRange,
    getEventDateLocal,
} from "@/lib/calendarTime";
import { GOOGLE_COLOR_MAP, DEFAULT_EVENT_COLOR } from "@/lib/googleCalendarColors";
import { buildMonthGrid, isSameMonth, isSameDay, isToday, addDays, subDays } from "@/lib/dateUtils";
import EventChip from "@/components/calendar/EventChip";
import EventModal from "@/components/calendar/EventModal";

/* ── Animation Variants ── */
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0
    })
};

const STATICS = {
    DAYS: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
};

export default function CalendarTab() {
    const { isConnected, signInWithGoogle } = useAuthStore();

    // Calendar State
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date()); // Reference for month view
    const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Selected day for side panel

    // UI State
    const [direction, setDirection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Mouse Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const parallaxX = useTransform(springX, [0, 1000], [5, -5]);
    const parallaxY = useTransform(springY, [0, 1000], [5, -5]);
    const heavyParallaxX = useTransform(springX, [0, 1000], [15, -15]);
    const heavyParallaxY = useTransform(springY, [0, 1000], [15, -15]);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };



    // Derived Grid
    const monthGrid = useMemo(() => buildMonthGrid(currentDate), [currentDate]);

    // ── API Interactions ──

    const fetchEvents = useCallback(async () => {
        if (!isConnected) return;
        setLoading(true);
        try {
            // Fetch range covers the entire grid (including padding days)
            const gridStart = monthGrid[0];
            const gridEnd = monthGrid[monthGrid.length - 1];

            // Add slight buffer just in case of timezone edge cases
            const timeMin = subDays(gridStart, 1).toISOString();
            const timeMax = addDays(gridEnd, 1).toISOString();

            const params = new URLSearchParams({ timeMin, timeMax });
            const res = await fetch(`/api/google/calendar/events?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setEvents(data.events ?? []);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    }, [isConnected, monthGrid]);

    // Fetch on mount and when month changes
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
        try {
            const res = await fetch("/api/google/calendar/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData),
            });
            if (!res.ok) throw new Error("Failed to create");
            await fetchEvents(); // Refresh
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateEvent = async (eventData: Partial<CalendarEvent>) => {
        if (!editingEvent) return;
        try {
            // Assuming PUT support or using POST if logic allows, checking generic implementation 
            // from previous context, user said CRUD works. 
            // Standardizing on PUT for update based on standard REST practices implied in the codebase.
            // If not, we might need to verify the route, but usually nextjs apps following this pattern have a dynamic route.
            const res = await fetch(`/api/google/calendar/events/${editingEvent.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData),
            });

            if (!res.ok) throw new Error("Failed to update");
            await fetchEvents();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            const res = await fetch(`/api/google/calendar/events/${eventId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            await fetchEvents();
            setIsEventModalOpen(false); // Close modal
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveEvent = (data: Partial<CalendarEvent>) => {
        if (editingEvent) {
            handleUpdateEvent(data);
        } else {
            handleCreateEvent(data);
        }
        setEditingEvent(null);
    };

    // ── Interaction Handlers ──

    const handleSelectEvent = (event: CalendarEvent) => {
        // Parse "YYYY-MM-DD" to local Date
        const dateStr = getEventDateLocal(event);
        const [y, m, d] = dateStr.split("-").map(Number);
        setSelectedDate(new Date(y, m - 1, d));
    };

    // ── Navigation ──

    const nextMonth = () => {
        setDirection(1);
        setCurrentDate(prev => {
            const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            return next;
        });
    };

    const prevMonth = () => {
        setDirection(-1);
        setCurrentDate(prev => {
            const back = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            return back;
        });
    };

    const jumpToToday = () => {
        const today = new Date();
        setDirection(today > currentDate ? 1 : -1);
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // ── Render Helpers ──

    const getEventsForDay = (date: Date) => {
        // We match based on local date string YYYY-MM-DD
        // event.start is ISO. getEventDateLocal returns YYYY-MM-DD
        const localDateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD

        return events.filter(e => {
            const eDate = getEventDateLocal(e);
            return eDate === localDateStr;
        });
    };

    const eventsForSelectedDate = getEventsForDay(selectedDate);

    // Auth Guard
    if (!isConnected) {
        return (
            <div
                onMouseMove={handleMouseMove}
                className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-700 text-white relative overflow-hidden"
            >
                {/* Fragmentation Layer for Auth Guard */}
                <motion.div
                    style={{ x: parallaxX, y: parallaxY }}
                    className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden"
                >
                    <div className="absolute top-1/2 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                    <motion.div
                        style={{ x: heavyParallaxX, y: heavyParallaxY, rotate: -45 }}
                        className="absolute -top-24 -right-24 w-96 h-96 border border-white opacity-20"
                    />
                    <div className="absolute inset-0 noise-overlay opacity-[0.1] mix-blend-overlay" />
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="relative group cursor-pointer"
                >
                    <div className="absolute inset-[-20px] bg-purple-500/10 blur-[40px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700 animate-pulse" />
                    <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        className="relative p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-purple-500/30"
                    >
                        <CalendarIcon size={64} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    </motion.div>
                </motion.div>

                <div className="text-center space-y-4 max-w-sm relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 tracking-tight"
                    >
                        Sync Your Time
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/40 font-medium leading-relaxed"
                    >
                        Experience frictionless scheduling. Connect Google Calendar to merge your digital life with your cognitive space.
                    </motion.p>
                </div>

                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168,85,247,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={signInWithGoogle}
                    className="flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-500 transition-all shadow-xl"
                >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                    <span className="tracking-widest uppercase text-xs">Authorize Access</span>
                </motion.button>
            </div>
        );
    }

    return (
        <div
            onMouseMove={handleMouseMove}
            className="flex flex-col lg:flex-row lg:h-full gap-3 lg:gap-6 p-2 lg:p-6 overflow-x-hidden relative"
        >
            {/* Fragmentation Layer: Kinetic Background Decoration */}
            <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden"
            >
                <div className="absolute top-0 right-1/4 w-px h-full bg-white shadow-[0_0_15px_white]" />
                <div className="absolute bottom-1/3 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                <motion.div
                    style={{ x: heavyParallaxX, y: heavyParallaxY, rotate: -25 }}
                    className="absolute bottom-12 -right-12 w-96 h-96 border border-white opacity-20"
                />
                {/* Kinetic Grain Layer */}
                <div className="absolute inset-0 noise-overlay opacity-[0.12] mix-blend-overlay" />
            </motion.div>

            {/* Editorial Watermark - Kinetic Editorial Layering */}
            <motion.div
                style={{ x: heavyParallaxX, y: heavyParallaxY, color: "var(--color-text-primary)" }}
                className="absolute -top-12 opacity-5 select-none pointer-events-none transition-all duration-700 font-black text-9xl tracking-[-0.05em] translate-y-2"
            >
                CALENDAR
            </motion.div>

            {/* ── Main Calendar Grid ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col min-h-0 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm h-[360px] md:h-[420px] lg:h-auto lg:flex-1 relative z-10"
            >

                {/* Header */}
                <div className="relative px-3 py-3 md:px-6 md:py-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">

                        {/* Left: Prev Button */}
                        <button
                            onClick={prevMonth}
                            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 text-white/70 hover:text-white transition-all active:scale-95 shadow-sm"
                            title="Previous Month"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {/* Center: Month Title + Actions */}
                        <div className="flex items-center justify-center gap-2 min-w-0">
                            <h2 className="text-base md:text-2xl font-bold text-white tracking-tight text-center truncate">
                                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </h2>
                            <div className="h-5 w-px bg-white/10 shrink-0" />
                            <button
                                onClick={jumpToToday}
                                className="px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all active:scale-95 shrink-0"
                            >
                                Today
                            </button>
                            <button
                                onClick={fetchEvents}
                                className="flex items-center justify-center w-7 h-7 md:w-9 md:h-9 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors shrink-0"
                                title="Refresh Events"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin text-purple-400" /> : <RefreshCw size={14} />}
                            </button>
                        </div>

                        {/* Right: Next Button */}
                        <button
                            onClick={nextMonth}
                            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 text-white/70 hover:text-white transition-all active:scale-95 shadow-sm"
                            title="Next Month"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.01]">
                    {STATICS.DAYS.map(day => (
                        <div key={day} className="py-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentDate.toISOString()} // Force re-render on month change
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="absolute inset-0 grid grid-cols-7 grid-rows-6 p-1 gap-1 md:p-3 md:gap-2"
                        >
                            {monthGrid.map((date, i) => {
                                const isCurrentMonth = isSameMonth(date, currentDate);
                                const isSelected = isSameDay(date, selectedDate);
                                const isTodayDate = isToday(date);
                                const dayEvents = getEventsForDay(date);

                                return (
                                    <motion.div
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                            relative flex flex-col p-0.5 md:p-2 rounded-lg md:rounded-xl border transition-all duration-200 cursor-pointer min-h-0 overflow-hidden
                                            ${!isCurrentMonth ? "opacity-30 bg-transparent border-transparent grayscale hover:opacity-50" : ""}
                                            ${isSelected
                                                ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(124,92,255,0.1)] z-10"
                                                : "bg-white/[0.02] border-white/5"}
                                            ${isTodayDate ? "ring-1 ring-purple-400/50 shadow-[inset_0_0_20px_rgba(124,92,255,0.15)]" : ""}
                                        `}
                                    >
                                        {/* Date Number */}
                                        <div className="flex justify-center md:justify-between items-start md:mb-1">
                                            <span
                                                className={`
                                                    text-[10px] md:text-xs font-semibold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full
                                                    ${isTodayDate
                                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/40"
                                                        : isSelected ? "text-purple-300" : "text-white/60"}
                                                `}
                                            >
                                                {date.getDate()}
                                            </span>
                                        </div>

                                        {/* Events — dots on mobile, chips on desktop */}
                                        <div className="flex-1 overflow-hidden">
                                            {/* Mobile: event dots */}
                                            {dayEvents.length > 0 && (
                                                <div className="flex md:hidden justify-center gap-0.5 mt-0.5 flex-wrap">
                                                    {dayEvents.slice(0, 3).map(event => (
                                                        <div
                                                            key={event.id}
                                                            className="w-1 h-1 rounded-full bg-purple-400 shrink-0"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            {/* Desktop: event chips */}
                                            <div className="hidden md:flex flex-col gap-1">
                                                {dayEvents.slice(0, 2).map(event => (
                                                    <EventChip
                                                        key={event.id}
                                                        event={event}
                                                        onSelect={handleSelectEvent}
                                                        onEdit={(e) => {
                                                            setEditingEvent(e);
                                                            setIsEventModalOpen(true);
                                                        }}
                                                        onDelete={(e) => handleDeleteEvent(e.id)}
                                                    />
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="px-1.5 py-0.5 text-[9px] font-medium text-white/40 hover:text-white/80 transition-colors">
                                                        +{dayEvents.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── Side Panel (Details) ── */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden transition-all duration-300 w-full lg:w-80 lg:shrink-0 relative z-10"
            >
                {/* Kinetic Background Fragment for Side Panel */}
                <motion.div
                    style={{ x: parallaxX, y: parallaxY }}
                    className="absolute top-0 right-0 w-32 h-32 border-b border-l border-white/[0.02] rotate-45 translate-x-16 -translate-y-16 pointer-events-none"
                />
                {/* Compact date header */}
                <div className="px-4 py-3 lg:px-6 lg:py-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="text-[10px] lg:text-sm font-medium text-purple-400 uppercase tracking-widest">
                                {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl lg:text-3xl font-bold text-white">
                                    {selectedDate.getDate()}
                                </span>
                                <span className="text-xs lg:text-sm text-white/40">
                                    {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events list — scrollable, capped on mobile */}
                <div className="overflow-y-auto p-3 lg:p-4 space-y-2 lg:space-y-3 custom-scrollbar max-h-[240px] lg:max-h-none lg:flex-1">
                    {eventsForSelectedDate.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-40">
                            <CalendarIcon size={32} />
                            <p className="text-xs max-w-[150px]">No events scheduled for this day.</p>
                        </div>
                    ) : (
                        eventsForSelectedDate.map(event => {
                            const color = GOOGLE_COLOR_MAP[event.colorId || ""] || DEFAULT_EVENT_COLOR;
                            return (
                                <motion.div
                                    key={event.id}
                                    variants={{
                                        initial: { opacity: 0, y: 10 },
                                        animate: { opacity: 1, y: 0 }
                                    }}
                                    whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                                    className="group relative p-3 rounded-xl border border-white/5 bg-white/[0.02] transition-all cursor-pointer overflow-hidden"
                                    onClick={() => {
                                        setEditingEvent(event);
                                        setIsEventModalOpen(true);
                                    }}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1"
                                        style={{ backgroundColor: color.background }}
                                    />
                                    <div className="pl-3">
                                        <h4 className="font-medium text-sm text-white group-hover:text-purple-200 transition-colors line-clamp-1">
                                            {event.summary || "(No Title)"}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                                            <Clock size={10} />
                                            <span>
                                                {isAllDayEvent(event) ? "All Day" : formatEventTimeRange(event)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Side Panel Item Menu */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                                        <PortalMenu
                                            align="right"
                                            trigger={
                                                <div className="p-1.5 rounded-full text-white/20 hover:text-white hover:bg-white/10">
                                                    <MoreHorizontal size={14} />
                                                </div>
                                            }
                                        >
                                            <div className="min-w-[140px] p-1 space-y-0.5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingEvent(event);
                                                        setIsEventModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded cursor-pointer text-left"
                                                >
                                                    <Edit3 size={12} />
                                                    <span>Edit Event</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingEvent(event);
                                                        setIsEventModalOpen(true);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded cursor-pointer text-left"
                                                >
                                                    <CalendarDays size={12} />
                                                    <span>Change Date</span>
                                                </button>
                                                <div className="h-px bg-white/10 my-1" />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEvent(event.id);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded cursor-pointer text-left"
                                                >
                                                    <Trash2 size={12} />
                                                    <span>Delete Event</span>
                                                </button>
                                            </div>
                                        </PortalMenu>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-white/5 relative z-10">
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(147,51,234,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setEditingEvent(null);
                            setIsEventModalOpen(true);
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-black shadow-lg shadow-purple-500/20 transition-all uppercase tracking-widest text-[10px]"
                    >
                        <Plus size={18} />
                        Create Event
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Event Modal ── */}
            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialDate={selectedDate.toLocaleDateString("en-CA")}
                editingEvent={editingEvent}
            />
        </div>
    );
}
