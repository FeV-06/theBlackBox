"use client";

import { useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { Project, ProjectTask } from "@/types/widget";
import { useProjectStore } from "@/store/useProjectStore";

interface KanbanBoardProps {
    project: Project;
    hideCompleted: boolean;
}

const COLUMNS = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
];

export default function KanbanBoard({ project, hideCompleted }: KanbanBoardProps) {
    const { moveTaskStatus, moveTaskBetweenColumns } = useProjectStore();
    const [activeId, setActiveId] = useState<string | null>(null);

    const tasksByColumn = useMemo(() => {
        let tasks = project.tasks;
        if (hideCompleted) {
            tasks = tasks.filter(t => t.status !== "done");
        }

        const grouped: Record<string, ProjectTask[]> = {
            todo: [],
            in_progress: [],
            done: []
        };

        tasks.forEach(t => {
            if (grouped[t.status]) {
                grouped[t.status].push(t);
            } else {
                grouped.todo.push(t); // fallback
            }
        });

        // Sort each column by `order`
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        return grouped;
    }, [project.tasks, hideCompleted]);

    const activeTask = useMemo(() => {
        if (!activeId) return null;
        return project.tasks.find(t => t.id === activeId);
    }, [activeId, project.tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // minimum drag distance before activation
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeTask = project.tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        const activeStatus = activeTask.status;

        // Find the target column/status
        const overColumn = COLUMNS.find(c => c.id === overId);
        const overTask = project.tasks.find(t => t.id === overId);
        const overStatus = overColumn ? (overColumn.id as any) : (overTask ? overTask.status : null);

        if (!overStatus || activeStatus === overStatus) return;

        // Moving to a different column: move to end of new column temporarily
        // This allows dnd-kit's SortableContext to "pick up" the task in the new list
        const targetTasks = tasksByColumn[overStatus];
        moveTaskBetweenColumns(project.id, activeId, overStatus, targetTasks.length);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = project.tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        const activeStatus = activeTask.status;

        // Reordering within the (possibly newly assigned) column
        const overTask = project.tasks.find(t => t.id === overId);
        if (overTask) {
            const overStatus = overTask.status;
            if (activeStatus === overStatus) {
                const targetColumnTasks = tasksByColumn[overStatus];
                const oldIndex = targetColumnTasks.findIndex(t => t.id === activeId);
                const newIndex = targetColumnTasks.findIndex(t => t.id === overId);

                if (oldIndex !== newIndex) {
                    moveTaskBetweenColumns(project.id, activeId, overStatus as any, newIndex);
                }
            }
        } else {
            // Check if we dropped on a column/container
            const overColumn = COLUMNS.find(c => c.id === overId);
            if (overColumn && activeStatus !== overColumn.id) {
                const targetLength = tasksByColumn[overColumn.id].length;
                moveTaskBetweenColumns(project.id, activeId, overColumn.id as any, targetLength);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full pb-8">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        tasks={tasksByColumn[col.id]}
                        projectId={project.id}
                        projectColor={project.color}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId && activeTask ? <KanbanCard task={activeTask} projectId={project.id} projectColor={project.color} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
