"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { CheckSquare, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Calendar, CalendarCheck, CalendarClock, Loader2, AlertTriangle } from "lucide-react";
import { useWidgetStore } from "@/store/useWidgetStore";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetInstance, TodoItem } from "@/types/widgetInstance";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTodoItem({
    todo,
    instanceId,
    isManualSort,
}: {
    todo: TodoItem;
    instanceId: string;
    isManualSort: boolean;
}) {
    const { toggleTodo, deleteTodo, updateTodo } = useWidgetStore();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: todo.id,
        disabled: !isManualSort,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    // Safely format local date string (e.g. "YYYY-MM-DD")
    let dateLabel = "";
    if (todo.dueDate) {
        const parts = todo.dueDate.split("-");
        if (parts.length === 3) {
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const isToday =
                dateObj.getDate() === today.getDate() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getFullYear() === today.getFullYear();
            const isTomorrow =
                dateObj.getDate() === tomorrow.getDate() &&
                dateObj.getMonth() === tomorrow.getMonth() &&
                dateObj.getFullYear() === tomorrow.getFullYear();

            if (isToday) dateLabel = "Today";
            else if (isTomorrow) dateLabel = "Tomorrow";
            else dateLabel = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        }
    }

    const priorityColors = {
        low: "bg-white/5 text-white/40",
        medium: "bg-yellow-500/20 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.2)]",
        high: "bg-red-500/20 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    };

    let SyncIcon = null;
    let syncTooltip = "";
    let syncIconClass = "text-white/40";

    if (todo.syncStatus === "pending") {
        SyncIcon = Loader2;
        syncTooltip = "Syncing...";
        syncIconClass = "animate-spin text-white/40";
    } else if (todo.syncStatus === "error") {
        SyncIcon = AlertTriangle;
        syncTooltip = "Sync failed";
        syncIconClass = "text-red-400";
    } else if (todo.isSynced && todo.syncStatus === "success") {
        SyncIcon = CalendarCheck;
        syncTooltip = "Synced with Google Calendar";
        syncIconClass = "text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.2)]";
    } else if (!todo.isSynced && todo.dueDate) {
        SyncIcon = CalendarClock;
        syncTooltip = "Not synced";
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: todo.completed ? 0.5 : 1, scale: todo.completed ? 0.98 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all border border-transparent 
        ${isDragging ? "bg-white/10 shadow-lg border-white/20" : "hover:bg-white/[0.04] hover:border-white/[0.05]"} group relative`}
        >
            <div
                className={`cursor-grab active:cursor-grabbing p-1 -ml-1 text-white/20 hover:text-white/50 ${isManualSort ? "visible" : "invisible w-0 p-0"
                    }`}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={14} />
            </div>

            <button
                onClick={() => toggleTodo(instanceId, todo.id)}
                className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all"
                style={{
                    borderColor: todo.completed ? "var(--color-accent)" : "rgba(255,255,255,0.2)",
                    background: todo.completed ? "var(--color-accent)" : "transparent",
                }}
            >
                {todo.completed && <CheckSquare size={10} className="text-white" />}
            </button>

            <div className="flex-1 flex flex-col min-w-0">
                <input
                    value={todo.text}
                    onChange={(e) => updateTodo(instanceId, todo.id, { text: e.target.value })}
                    className="text-xs transition-all truncate bg-transparent outline-none m-0 p-0 flex-1 min-w-0"
                    style={{
                        color: todo.completed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                        textDecoration: todo.completed ? "line-through" : "none",
                    }}
                />
                <div className="flex items-center gap-2 mt-0.5">
                    <button
                        onClick={() => {
                            const nextOrder: Record<string, "low" | "medium" | "high"> = {
                                low: "medium",
                                medium: "high",
                                high: "low",
                            };
                            updateTodo(instanceId, todo.id, { priority: nextOrder[todo.priority] });
                        }}
                        className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded transition-all ${priorityColors[todo.priority]
                            }`}
                    >
                        {todo.priority}
                    </button>

                    <div className="relative flex items-center">
                        <input
                            type="date"
                            value={todo.dueDate || ""}
                            onChange={(e) => updateTodo(instanceId, todo.id, { dueDate: e.target.value || undefined })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors ${todo.dueDate ? "text-white/40 bg-white/5" : "text-white/20 hover:text-white/40 opacity-0 group-hover:opacity-100"}`}>
                            <Calendar size={8} />
                            {dateLabel || "Set Date"}
                        </div>
                    </div>

                    {SyncIcon && (
                        <div className="group/sync relative flex items-center justify-center">
                            <SyncIcon size={10} className={syncIconClass} />
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white/90 text-[10px] whitespace-nowrap rounded opacity-0 pointer-events-none group-hover/sync:opacity-100 transition-opacity z-50 shadow-xl border border-white/10">
                                {syncTooltip}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={() => deleteTodo(instanceId, todo.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
            >
                <Trash2 size={12} />
            </button>
        </motion.div>
    );
}

export default function TodoWidget({ instance }: { instance: WidgetInstance }) {
    const { addTodo, reorderTodos, setTodoSortMode } = useWidgetStore();
    const [input, setInput] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const todos = instance.data?.todos || [];
    const sortMode = instance.data?.sortMode || "manual";

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAdd = () => {
        const text = input.trim();
        if (!text) return;
        addTodo(instance.instanceId, text);
        setInput("");
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id && over) {
            const oldIndex = todos.findIndex((t) => t.id === active.id);
            const newIndex = todos.findIndex((t) => t.id === over.id);
            reorderTodos(instance.instanceId, arrayMove(todos, oldIndex, newIndex));
        }
    };

    const activeTodos = useMemo(() => {
        const active = todos.filter((t) => !t.completed);
        if (sortMode === "manual") return active;

        return active.sort((a, b) => {
            if (sortMode === "priority") {
                const pOrder = { high: 3, medium: 2, low: 1 };
                return pOrder[b.priority] - pOrder[a.priority];
            }
            if (sortMode === "dueDate") {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            }
            return 0;
        });
    }, [todos, sortMode]);

    const completedTodos = useMemo(() => todos.filter((t) => t.completed), [todos]);
    const progress = todos.length > 0 ? (completedTodos.length / todos.length) * 100 : 0;

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden text-white w-full relative">
            {/* Header / Config */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${progress}%`, background: "var(--color-accent)" }}
                        />
                    </div>
                    <span className="text-[10px] font-bold opacity-40 shrink-0">
                        {completedTodos.length}/{todos.length}
                    </span>
                </div>
                <select
                    value={sortMode}
                    onChange={(e) => setTodoSortMode(instance.instanceId, e.target.value as any)}
                    className="bg-transparent text-[10px] opacity-50 hover:opacity-100 outline-none cursor-pointer"
                >
                    <option value="manual" className="bg-[#111] text-white">Manual Sort</option>
                    <option value="priority" className="bg-[#111] text-white">By Priority</option>
                    <option value="dueDate" className="bg-[#111] text-white">By Due Date</option>
                </select>
            </div>

            {/* Add Input */}
            <div className="flex gap-2 shrink-0">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Add a task..."
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.05] rounded-lg px-3 py-2 text-xs outline-none focus:border-[color:var(--color-accent)] focus:bg-white/[0.02] transition-colors"
                />
                <button
                    onClick={handleAdd}
                    className="btn-accent px-3 py-2 flex items-center justify-center gap-1 rounded-lg"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Tasks List Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1 pb-2 min-h-0">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={activeTodos.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <AnimatePresence>
                            {activeTodos.map((todo) => (
                                <SortableTodoItem
                                    key={todo.id}
                                    todo={todo}
                                    instanceId={instance.instanceId}
                                    isManualSort={sortMode === "manual"}
                                />
                            ))}
                        </AnimatePresence>
                    </SortableContext>
                </DndContext>

                {/* Empty State */}
                {activeTodos.length === 0 && completedTodos.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2 mt-4">
                        <CheckSquare size={24} />
                        <p className="text-[10px] uppercase font-bold tracking-widest">No tasks yet</p>
                    </div>
                )}

                {/* Completed Tasks Accordion */}
                {completedTodos.length > 0 && (
                    <div className="mt-2 text-white">
                        <button
                            onClick={() => setShowCompleted((s) => !s)}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-40 hover:opacity-80 transition-opacity py-1 px-1 mb-1"
                        >
                            {showCompleted ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            Completed ({completedTodos.length})
                        </button>
                        <AnimatePresence>
                            {showCompleted && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden flex flex-col gap-1"
                                >
                                    {completedTodos.map((todo) => (
                                        <SortableTodoItem
                                            key={todo.id}
                                            todo={todo}
                                            instanceId={instance.instanceId}
                                            isManualSort={false} // NEVER drag completed
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
