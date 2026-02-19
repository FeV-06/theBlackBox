import { motion } from "framer-motion";
import { MoreHorizontal, Edit3, CalendarDays, Trash2 } from "lucide-react";
import { type CalendarEvent, isAllDayEvent, extractTimeHHMM } from "@/lib/calendarTime";
import { GOOGLE_COLOR_MAP, DEFAULT_EVENT_COLOR } from "@/lib/googleCalendarColors";
import { PortalMenu } from "@/components/ui/PortalMenu";

interface EventChipProps {
    event: CalendarEvent;
    onSelect: (event: CalendarEvent) => void;
    onEdit: (event: CalendarEvent) => void;
    onDelete: (event: CalendarEvent) => void;
}

export default function EventChip({ event, onSelect, onEdit, onDelete }: EventChipProps) {
    const colorEntry = GOOGLE_COLOR_MAP[event.colorId || ""] || DEFAULT_EVENT_COLOR;
    const isAllDay = isAllDayEvent(event);

    // Time label: "14:00" or empty for all day
    const timeLabel = isAllDay ? "" : extractTimeHHMM(event.start, event.startTimeZone);

    return (
        <motion.div
            layoutId={`event-${event.id}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(event);
            }}
            className="group relative flex items-center gap-1.5 px-1.5 py-0.5 rounded-md cursor-pointer overflow-hidden transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
            style={{
                backgroundColor: `${colorEntry.background}15`, // 15% opacity background
                border: `1px solid ${colorEntry.background}30`, // 30% opacity border
            }}
            whileHover={{ y: -1 }}
        >
            {/* Left Accent Bar */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ backgroundColor: colorEntry.background }}
            />

            {/* Content */}
            <div className="flex items-center gap-1.5 pl-1.5 min-w-0 flex-1">
                {timeLabel && (
                    <span
                        className="text-[9px] font-medium opacity-80 shrink-0"
                        style={{ color: colorEntry.background }}
                    >
                        {timeLabel}
                    </span>
                )}

                <span
                    className="text-[10px] font-medium truncate leading-tight"
                    style={{ color: colorEntry.background }}
                >
                    {event.summary || "(No Title)"}
                </span>
            </div>

            {/* Actions Menu (Visible on Hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <PortalMenu
                    align="right"
                    trigger={
                        <div className="p-0.5 rounded hover:bg-black/10 text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10">
                            <MoreHorizontal size={12} />
                        </div>
                    }
                >
                    <div className="min-w-[140px] p-1 space-y-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(event);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded cursor-pointer text-left"
                        >
                            <Edit3 size={12} />
                            <span>Edit Event</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(event); // Opens modal where date can be changed
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
                                onDelete(event);
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
}
