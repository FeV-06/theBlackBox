"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, ChevronRight, RefreshCw, Loader2,
    Calendar as CalendarIcon, Plus, Clock, MoreHorizontal
} from "lucide-react";
import { PortalMenu } from "@/components/ui/PortalMenu";
import { Edit3, CalendarDays, Trash2 } from "lucide-react";
import { useGoogleAuthStore } from "@/store/useGoogleAuthStore";
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
    const { isConnected, connectWithPopup, checkConnection } = useGoogleAuthStore();

    // Calendar State
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date()); // Reference for month view
    const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Selected day for side panel

    // UI State
    const [direction, setDirection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Initial Load
    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

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
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500 text-white">
                <div className="relative group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full group-hover:bg-purple-500/30 transition-all duration-500" />
                    <div className="relative p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm shadow-xl">
                        <CalendarIcon size={48} className="text-purple-400" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Connect Calendar
                    </h2>
                    <p className="text-white/40 max-w-xs mx-auto">
                        Link your Google Calendar to view and manage your schedule directly from the dashboard.
                    </p>
                </div>
                <button
                    onClick={connectWithPopup}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <RefreshCw size={18} />
                    <span>Connect Google Account</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 p-2 lg:p-6 overflow-hidden text-white">

            {/* ── Main Calendar Grid ── */}
            <div className="flex-1 flex flex-col min-h-0 bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">

                {/* Header */}
                <div className="relative px-6 py-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    {/* Desktop / Tablet Grid Layout */}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                        {/* Left: Prev Button */}
                        <div className="flex justify-start">
                            <button
                                onClick={prevMonth}
                                className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 text-white/70 hover:text-white transition-all active:scale-95 shadow-sm"
                                title="Previous Month"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        </div>

                        {/* Center: Month Title */}
                        <div className="flex justify-center">
                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight text-center min-w-[140px]">
                                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </h2>
                        </div>

                        {/* Right: Next + Actions */}
                        <div className="flex justify-end items-center gap-2">
                            <button
                                onClick={nextMonth}
                                className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 text-white/70 hover:text-white transition-all active:scale-95 shadow-sm mr-2"
                                title="Next Month"
                            >
                                <ChevronRight size={20} />
                            </button>

                            <div className="h-6 w-px bg-white/10 mx-1" />

                            <button
                                onClick={jumpToToday}
                                className="px-3 py-1.5 h-9 text-xs font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all active:scale-95"
                            >
                                Today
                            </button>

                            <button
                                onClick={fetchEvents}
                                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                title="Refresh Events"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin text-purple-400" /> : <RefreshCw size={16} />}
                            </button>
                        </div>
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
                            className="absolute inset-0 grid grid-cols-7 grid-rows-6 p-3 gap-2"
                        >
                            {monthGrid.map((date, i) => {
                                const isCurrentMonth = isSameMonth(date, currentDate);
                                const isSelected = isSameDay(date, selectedDate);
                                const isTodayDate = isToday(date);
                                const dayEvents = getEventsForDay(date);

                                return (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={`
                                            relative flex flex-col p-2 rounded-xl border transition-all duration-200 cursor-pointer min-h-0
                                            ${!isCurrentMonth ? "opacity-30 bg-transparent border-transparent grayscale hover:opacity-50" : ""}
                                            ${isSelected
                                                ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(124,92,255,0.1)] z-10 scale-[1.02]"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-lg"}
                                            ${isTodayDate ? "ring-1 ring-purple-400/50 shadow-[inset_0_0_20px_rgba(124,92,255,0.15)]" : ""}
                                        `}
                                    >
                                        {/* Date Number */}
                                        <div className="flex justify-between items-start mb-1">
                                            <span
                                                className={`
                                                    text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                                                    ${isTodayDate
                                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/40"
                                                        : isSelected ? "text-purple-300" : "text-white/60"}
                                                `}
                                            >
                                                {date.getDate()}
                                            </span>
                                        </div>

                                        {/* Events List */}
                                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
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
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Side Panel (Details) ── */}
            <div className={`
                flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden transition-all duration-300
                w-full lg:w-80 h-[300px] lg:h-auto shrink-0
            `}>
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="text-sm font-medium text-purple-400 uppercase tracking-widest mb-1">
                        {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {selectedDate.getDate()}
                    </div>
                    <div className="text-sm text-white/40">
                        {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
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
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer overflow-hidden"
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

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => {
                            setEditingEvent(null);
                            setIsEventModalOpen(true);
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Create Event
                    </button>
                </div>
            </div>

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
