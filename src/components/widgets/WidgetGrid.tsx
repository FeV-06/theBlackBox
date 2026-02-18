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
import { WIDGET_REGISTRY, registryMap } from "@/lib/widgetRegistry";
import WidgetCard from "./WidgetCard";
import type { WidgetTypeDefinition, WidgetInstance } from "@/types/widgetInstance";
import type { TabId } from "@/types/widget";
import ProjectsOverviewWidget from "./ProjectsOverviewWidget";
import { AlertTriangle } from "lucide-react";




/* ─── Fallback widget for unknown types ─── */

function UnknownWidget({ instance }: { instance: WidgetInstance }) {
    return (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
            <AlertTriangle size={24} style={{ color: "var(--color-danger)" }} />
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Unknown widget type: <code>{instance.type}</code>
            </p>
        </div>
    );
}

/* ─── Sortable wrapper ─── */

interface SortableWidgetProps {
    instance: WidgetInstance;
    definition: WidgetTypeDefinition;
    onNavigate?: (tab: TabId) => void;
}

function SortableWidget({ instance, definition, onNavigate }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: instance.instanceId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto" as const,
    };

    const Component = definition.component;

    return (
        <div ref={setNodeRef} style={style}>
            <WidgetCard
                instance={instance}
                definition={definition}
                dragHandleProps={{ ...attributes, ...listeners }}
            >
                {instance.type === "projects_overview" ? (
                    <ProjectsOverviewWidget instance={instance} onNavigate={onNavigate} />
                ) : (
                    <Component instance={instance} />
                )}
            </WidgetCard>
        </div>
    );
}

/* ─── Grid ─── */

interface WidgetGridProps {
    onNavigate?: (tab: TabId) => void;
}

export default function WidgetGrid({ onNavigate }: WidgetGridProps) {
    const { instances, layout, reorder } = useWidgetStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const visibleItems = useMemo(() => {
        const result: { instance: WidgetInstance; definition: WidgetTypeDefinition }[] = [];
        for (const id of layout) {
            const inst = instances[id];
            if (!inst || !inst.enabled) continue;
            const def = registryMap.get(inst.type);
            if (!def) {
                console.warn(`[WidgetGrid] Widget type "${inst.type}" (instance "${id}") has no registered definition. Skipping.`);
                continue;
            }
            result.push({ instance: inst, definition: def });
        }
        return result;
    }, [layout, instances]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        reorder(active.id as string, over.id as string);
    };

    if (!mounted) return null;

    return (
        <DndContext id="tbb-widget-grid" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleItems.map((v) => v.instance.instanceId)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {visibleItems.map(({ instance, definition }) => (
                        <SortableWidget
                            key={instance.instanceId}
                            instance={instance}
                            definition={definition}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
