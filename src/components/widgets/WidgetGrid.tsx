"use client";

import { useMemo, useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWidgetStore } from "@/store/useWidgetStore";
import WidgetCard from "./WidgetCard";
import type { WidgetDefinition, WidgetId, TabId } from "@/types/widget";

// Widget imports
import QuoteClockWidget from "./QuoteClockWidget";
import TodoWidget from "./TodoWidget";
import HabitTrackerWidget from "./HabitTrackerWidget";
import GitHubWidget from "./GitHubWidget";
import WeatherWidget from "./WeatherWidget";
import QuickLinksWidget from "./QuickLinksWidget";
import FocusSummaryWidget from "./FocusSummaryWidget";
import ProjectsOverviewWidget from "./ProjectsOverviewWidget";
import CustomApiWidget from "./CustomApiWidget";
import GmailWidget from "./GmailWidget";

import {
    Clock,
    CheckSquare,
    Flame,
    Github,
    CloudSun,
    Link2,
    Timer,
    FolderKanban,
    Puzzle,
    Mail,
} from "lucide-react";

const WIDGET_DEFS: WidgetDefinition[] = [
    { id: "quote_clock", title: "Quote & Clock", icon: Clock, component: QuoteClockWidget, defaultEnabled: true },
    { id: "todo", title: "To-Do List", icon: CheckSquare, component: TodoWidget, defaultEnabled: true },
    { id: "habits", title: "Habit Tracker", icon: Flame, component: HabitTrackerWidget, defaultEnabled: true },
    { id: "github", title: "GitHub", icon: Github, component: GitHubWidget, defaultEnabled: true },
    { id: "weather", title: "Weather", icon: CloudSun, component: WeatherWidget, defaultEnabled: true },
    { id: "links", title: "Quick Links", icon: Link2, component: QuickLinksWidget, defaultEnabled: true },
    { id: "focus_summary", title: "Focus Summary", icon: Timer, component: FocusSummaryWidget, defaultEnabled: true },
    { id: "projects_overview", title: "Projects", icon: FolderKanban, component: ProjectsOverviewWidget, defaultEnabled: true },
    { id: "custom_api", title: "Custom API", icon: Puzzle, component: CustomApiWidget, defaultEnabled: true },
    { id: "gmail", title: "Gmail", icon: Mail, component: GmailWidget, defaultEnabled: true },
];

const widgetMap = new Map(WIDGET_DEFS.map((w) => [w.id, w]));

interface SortableWidgetProps {
    def: WidgetDefinition;
    onRemove: () => void;
    onNavigate?: (tab: TabId) => void;
}

function SortableWidget({ def, onRemove, onNavigate }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: def.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto" as const,
    };

    const Component = def.component;

    return (
        <div ref={setNodeRef} style={style}>
            <WidgetCard
                title={def.title}
                icon={def.icon}
                onRemove={onRemove}
                dragHandleProps={{ ...attributes, ...listeners }}
            >
                {def.id === "projects_overview" ? (
                    <ProjectsOverviewWidget onNavigate={onNavigate} />
                ) : (
                    <Component />
                )}
            </WidgetCard>
        </div>
    );
}

interface WidgetGridProps {
    onNavigate?: (tab: TabId) => void;
}

export default function WidgetGrid({ onNavigate }: WidgetGridProps) {
    const { order, enabled, reorder, setEnabled } = useWidgetStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const visibleWidgets = useMemo(
        () => order.filter((id) => enabled[id] && widgetMap.has(id)),
        [order, enabled]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = order.indexOf(active.id as WidgetId);
        const newIndex = order.indexOf(over.id as WidgetId);
        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = [...order];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, active.id as WidgetId);
        reorder(newOrder);
    };

    if (!mounted) return null;

    return (
        <DndContext id="tbb-widget-grid" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleWidgets} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {visibleWidgets.map((id) => {
                        const def = widgetMap.get(id)!;
                        return (
                            <SortableWidget
                                key={id}
                                def={def}
                                onRemove={() => setEnabled(id, false)}
                                onNavigate={onNavigate}
                            />
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export { WIDGET_DEFS };
