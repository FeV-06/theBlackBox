"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    MeasuringStrategy
} from "@dnd-kit/core";
import type { Modifier } from "@dnd-kit/core";
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
    const boardRef = useRef<HTMLDivElement>(null);

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

    /**
     * Custom modifier to compensate for ancestor CSS transforms (react-rnd).
     * react-rnd positions widgets via transform: translate(x, y).
     * dnd-kit's DragOverlay uses position: fixed and doesn't account for
     * these ancestor transforms, causing an offset equal to the widget's
     * canvas position. We accumulate ALL ancestor transforms and subtract them.
     */
    const adjustForAncestorTransform: Modifier = useCallback(({ transform: dragTransform }) => {
        if (!boardRef.current) return dragTransform;

        let totalTx = 0;
        let totalTy = 0;

        // Walk up the ENTIRE DOM tree and accumulate all CSS transforms
        let el: HTMLElement | null = boardRef.current.parentElement;
        while (el) {
            const cs = window.getComputedStyle(el);
            const tf = cs.transform;
            if (tf && tf !== "none") {
                // Parse the matrix: matrix(a, b, c, d, tx, ty)
                const match = tf.match(/matrix.*\((.+)\)/);
                if (match) {
                    const values = match[1].split(",").map(Number);
                    totalTx += values[4] || 0;
                    totalTy += values[5] || 0;
                }
            }
            el = el.parentElement;
        }

        // No transforms found — no compensation needed (e.g. Projects tab)
        if (totalTx === 0 && totalTy === 0) return dragTransform;

        return {
            ...dragTransform,
            x: dragTransform.x - totalTx,
            y: dragTransform.y - totalTy,
        };
    }, []);

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

        // Read FRESH task data from the store — the memoized tasksByColumn
        // may be stale if handleDragOver already moved the task mid-drag.
        const freshProject = useProjectStore.getState().projects.find(p => p.id === project.id);
        if (!freshProject) return;

        const freshTask = freshProject.tasks.find(t => t.id === activeId);
        if (!freshTask) return;

        const activeStatus = freshTask.status;

        // Build fresh column grouping
        const freshColumn = freshProject.tasks
            .filter(t => t.status === activeStatus)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Reordering within the (possibly newly assigned) column
        const overTask = freshProject.tasks.find(t => t.id === overId);
        if (overTask && overTask.status === activeStatus) {
            const oldIndex = freshColumn.findIndex(t => t.id === activeId);
            const newIndex = freshColumn.findIndex(t => t.id === overId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                moveTaskBetweenColumns(project.id, activeId, activeStatus as any, newIndex);
            }
        } else if (!overTask) {
            // Dropped on a column container
            const overColumn = COLUMNS.find(c => c.id === overId);
            if (overColumn && activeStatus !== overColumn.id) {
                const targetLength = freshProject.tasks.filter(t => t.status === overColumn.id).length;
                moveTaskBetweenColumns(project.id, activeId, overColumn.id as any, targetLength);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            measuring={{
                droppable: {
                    strategy: MeasuringStrategy.Always,
                },
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div ref={boardRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full pb-8">
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

            <DragOverlay dropAnimation={null} modifiers={[adjustForAncestorTransform]}>
                {activeId && activeTask ? <KanbanCard task={activeTask} projectId={project.id} projectColor={project.color} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

