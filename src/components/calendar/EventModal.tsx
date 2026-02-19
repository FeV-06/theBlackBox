import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar as CalendarIcon, Clock, MapPin, AlignLeft } from "lucide-react";
import { type CalendarEvent, extractLocalTime, combineLocalDateTime, getBrowserTimeZone } from "@/lib/calendarTime";
import { GOOGLE_COLOR_MAP } from "@/lib/googleCalendarColors";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Partial<CalendarEvent>) => void;
    onDelete?: (eventId: string) => void;
    initialDate?: string; // YYYY-MM-DD
    editingEvent?: CalendarEvent | null;
}

export default function EventModal({ isOpen, onClose, onSave, onDelete, initialDate, editingEvent }: EventModalProps) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [date, setDate] = useState("");
    const [sTime, setSTime] = useState("09:00");
    const [eTime, setETime] = useState("10:00");
    const [allDay, setAllDay] = useState(false);
    const [colorId, setColorId] = useState<string>("7"); // Default Peacock
    const [location, setLocation] = useState("");

    // Reset form when opening
    useEffect(() => {
        if (!isOpen) return;

        if (editingEvent) {
            setTitle(editingEvent.summary);
            setDesc(editingEvent.description || "");
            setLocation(editingEvent.location || "");

            // Extract date and times
            const isAD = editingEvent.start.length === 10;
            setAllDay(isAD);

            if (isAD) {
                setDate(editingEvent.start);
                setSTime("09:00");
                setETime("10:00");
            } else {
                setDate(editingEvent.start.split("T")[0]);
                // Use extractLocalTime to avoid UTC shift
                setSTime(extractLocalTime(editingEvent.start, editingEvent.startTimeZone));
                setETime(extractLocalTime(editingEvent.end, editingEvent.endTimeZone));
            }
            setColorId(editingEvent.colorId || "7");
        } else {
            // New Event
            setTitle("");
            setDesc("");
            setLocation("");
            setDate(initialDate || new Date().toLocaleDateString("en-CA")); // Use local date string if initialDate is missing
            setSTime("09:00");
            setETime("10:00");
            setAllDay(false);
            setColorId("7");
        }
    }, [isOpen, editingEvent, initialDate]);

    const handleSave = () => {
        if (!title.trim() || !date) return;

        const tz = getBrowserTimeZone();
        let startIso: string;
        let endIso: string;

        if (allDay) {
            startIso = date; // YYYY-MM-DD
            endIso = date;
            // For all-day events, we should ideally send date-only, but our API schema expects dateTime & timeZone.
            // Sending YYYY-MM-DD with timeZone to Google might fail if they expect dateTime?
            // Actually, for all-day, we can send date-only "start: { date: '...' }".
            // But our current POST route constructs "start: { dateTime: ... }".
            // To be safe and compliant with "create pipeline fix", let's send midnight local time.
            startIso = combineLocalDateTime(date, "00:00");
            endIso = combineLocalDateTime(date, "23:59");
        } else {
            // Combine date + time => "YYYY-MM-DDTHH:mm:00" (No Z, no offset)
            startIso = combineLocalDateTime(date, sTime);
            endIso = combineLocalDateTime(date, eTime);
        }

        // Pass explicit timeZone so API can attach it
        onSave({
            summary: title,
            description: desc,
            start: startIso,
            end: endIso,
            colorId,
            location,
            // We force cast/add this property because our API route strictly needs it
            // @ts-ignore
            timeZone: tz,
        } as Partial<CalendarEvent>);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-md bg-[#121212]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <h2 className="text-lg font-semibold text-white/90">
                                    {editingEvent ? "Edit Event" : "Create Event"}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* Title Input */}
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Add title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-transparent text-xl font-medium placeholder:text-white/20 text-white border-none focus:ring-0 p-0"
                                />

                                {/* Date & Time */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-white/70">
                                        <CalendarIcon size={16} className="text-purple-400" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-transparent border-none text-white font-medium focus:ring-0 p-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Clock size={16} className="text-purple-400" />
                                        <div className="flex items-center gap-2 flex-1">
                                            {!allDay && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={sTime}
                                                        onChange={(e) => setSTime(e.target.value)}
                                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-purple-500/50 outline-none transition-colors"
                                                    />
                                                    <span className="text-white/30">-</span>
                                                    <input
                                                        type="time"
                                                        value={eTime}
                                                        onChange={(e) => setETime(e.target.value)}
                                                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-purple-500/50 outline-none transition-colors"
                                                    />
                                                </>
                                            )}
                                            <label className="flex items-center gap-2 ml-auto cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={allDay}
                                                    onChange={(e) => setAllDay(e.target.checked)}
                                                    className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30"
                                                />
                                                <span className="text-sm text-white/60">All Day</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-white/70">
                                        <MapPin size={16} className="text-purple-400" />
                                        <input
                                            type="text"
                                            placeholder="Add location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="flex-1 bg-transparent border-none text-white focus:ring-0 p-0 placeholder:text-white/40"
                                        />
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(GOOGLE_COLOR_MAP).map(([id, color]) => (
                                            <button
                                                key={id}
                                                onClick={() => setColorId(id)}
                                                className={`w-6 h-6 rounded-full transition-all duration-200 ${colorId === id ? "ring-2 ring-white scale-110" : "hover:scale-110"}`}
                                                style={{ backgroundColor: color.background }}
                                                title={`Color ${id}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="flex gap-3">
                                    <AlignLeft size={16} className="text-white/30 mt-1" />
                                    <textarea
                                        placeholder="Add description"
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/80 placeholder:text-white/20 focus:border-purple-500/50 outline-none min-h-[80px] resize-none"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                                {editingEvent ? (
                                    <button
                                        onClick={() => editingEvent?.id && onDelete?.(editingEvent.id)}
                                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete Event"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
