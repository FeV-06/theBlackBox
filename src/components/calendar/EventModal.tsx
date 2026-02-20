import { useEffect, useState } from "react";
import { Trash2, Calendar as CalendarIcon, Clock, MapPin, AlignLeft } from "lucide-react";
import { type CalendarEvent, extractLocalTime, combineLocalDateTime, getBrowserTimeZone } from "@/lib/calendarTime";
import { GOOGLE_COLOR_MAP } from "@/lib/googleCalendarColors";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
            startIso = combineLocalDateTime(date, "00:00");
            endIso = combineLocalDateTime(date, "23:59");
        } else {
            startIso = combineLocalDateTime(date, sTime);
            endIso = combineLocalDateTime(date, eTime);
        }

        onSave({
            summary: title,
            description: desc,
            start: startIso,
            end: endIso,
            colorId,
            location,
            // @ts-ignore
            timeZone: tz,
        } as Partial<CalendarEvent>);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-[#121212]/95 border-white/10 backdrop-blur-xl p-0 gap-0">
                <DialogHeader className="px-6 pt-5 pb-4 border-b border-white/5 bg-white/[0.02]">
                    <DialogTitle className="text-lg font-semibold text-white/90">
                        {editingEvent ? "Edit Event" : "Create Event"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/40">
                        {editingEvent ? "Modify event details below" : "Fill in the details for your new event"}
                    </DialogDescription>
                </DialogHeader>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Title Input */}
                    <input
                        autoFocus
                        type="text"
                        placeholder="Add title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-xl font-medium placeholder:text-white/20 text-white border-none focus:ring-0 p-0 outline-none"
                    />

                    {/* Date & Time */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-white/70">
                            <CalendarIcon size={16} className="text-purple-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none text-white font-medium focus:ring-0 p-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:invert outline-none"
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
                                className="flex-1 bg-transparent border-none text-white focus:ring-0 p-0 placeholder:text-white/40 outline-none"
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
                <DialogFooter className="px-6 py-4 border-t border-white/5 bg-white/[0.02] sm:justify-between">
                    {editingEvent ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editingEvent?.id && onDelete?.(editingEvent.id)}
                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            title="Delete Event"
                        >
                            <Trash2 size={18} />
                        </Button>
                    ) : (
                        <div />
                    )}

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                        >
                            Save
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
