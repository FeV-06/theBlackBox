"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProjectTask } from "@/types/widget";
import { Check, GripVertical, ChevronDown } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";

interface KanbanCardProps {
    task: ProjectTask;
    projectId: string;
    projectColor: string;
    isOverlay?: boolean;
}

function KanbanCardInner({ task, projectId, projectColor, isOverlay }: KanbanCardProps) {
    const { toggleTask, updateTask, deleteTask, toggleSubtask, toggleTaskExpand } = useProjectStore();
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);

    const expanded = task.isExpanded ?? true;
    const hasSubtasks = (task.subtasks?.length || 0) > 0;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, disabled: isOverlay });

    const style = isOverlay ? undefined : {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.4 : 1,
    };

    const isDone = task.status === "done";
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

    return (
        <div
            ref={isOverlay ? undefined : setNodeRef}
            style={style}
            className={`glass-card p-3.5 rounded-xl flex flex-col gap-3 transition-all duration-300 relative overflow-hidden group/card ${isOverlay ? "shadow-2xl scale-105 border-white/20 z-50 cursor-grabbing" : "hover:border-white/10"}`}
        >
            {/* Subtle Gradient Glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover/card:opacity-10 transition-opacity duration-300 pointer-events-none"
                style={{ background: `linear-gradient(45deg, ${projectColor}33, transparent)` }}
            />

            <div className="flex items-start gap-3 relative z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleTask(projectId, task.id); }}
                    className="w-4.5 h-4.5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-90"
                    style={{
                        borderColor: isDone ? projectColor : "rgba(255,255,255,0.15)",
                        background: isDone ? projectColor : "transparent",
                        boxShadow: isDone ? `0 0 12px ${projectColor}40` : "none"
                    }}
                >
                    {isDone && <Check size={12} className="text-white" />}
                </button>

                {editing ? (
                    <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" && editText.trim()) {
                                updateTask(projectId, task.id, { text: editText.trim() });
                                setEditing(false);
                            } else if (e.key === "Escape") {
                                setEditText(task.text);
                                setEditing(false);
                            } else if (e.key === "Backspace" && editText === "") {
                                deleteTask(projectId, task.id);
                                setEditing(false);
                            }
                        }}
                        onBlur={() => {
                            if (editText.trim()) updateTask(projectId, task.id, { text: editText.trim() });
                            setEditing(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex-1 text-[13px] bg-white/5 rounded px-2 py-0.5 outline-none border-b-2 border-transparent focus:border-[color:var(--color-accent)] transition-all"
                        style={{ color: "var(--color-text-primary)" }}
                    />
                ) : (
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditText(task.text);
                            setEditing(true);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex-1 text-[13px] font-medium leading-relaxed cursor-text outline-none"
                        style={{
                            color: isDone ? "var(--color-text-muted)" : "var(--color-text-primary)",
                            textDecoration: isDone ? "line-through" : "none"
                        }}
                    >
                        {task.text}
                    </span>
                )}

                {/* Actions group */}
                <div className="flex items-center gap-1">
                    {hasSubtasks && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskExpand(projectId, task.id);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="p-1 rounded-lg hover:bg-white/5 transition-all text-white/20 hover:text-white/60"
                        >
                            <ChevronDown
                                size={14}
                                style={{
                                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s ease"
                                }}
                            />
                        </button>
                    )}

                    <div
                        {...(isOverlay ? {} : attributes)}
                        {...(isOverlay ? {} : listeners)}
                        className={`text-white/10 hover:text-white/30 p-1.5 -mr-1 ${isOverlay ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}`}
                    >
                        <GripVertical size={14} />
                    </div>
                </div>
            </div>

            {/* Subtasks */}
            {hasSubtasks && expanded && (
                <div className="mt-1 flex flex-col gap-1.5 ml-7 relative z-10 border-l border-white/5 pl-3 py-1">
                    {task.subtasks.map((st) => (
                        <div
                            key={st.id}
                            className="flex items-center gap-2 text-[11px] group/subtask"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSubtask(projectId, task.id, st.id);
                                }}
                                className="accent-purple-500 w-3.5 h-3.5 cursor-pointer opacity-50 group-hover/subtask:opacity-100 transition-opacity"
                            />
                            <span
                                className={`transition-all ${st.completed ? "line-through opacity-30" : "opacity-60 group-hover/subtask:opacity-90"}`}
                                style={{ color: "var(--color-text-secondary)" }}
                            >
                                {st.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Mini progress bar */}
            {hasSubtasks && !expanded && (
                <div className="flex items-center gap-2 ml-7 mt-0.5 relative z-10">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            className="h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                            style={{
                                background: completedSubtasks === totalSubtasks ? projectColor : "rgba(255,255,255,0.2)"
                            }}
                        />
                    </div>
                    <span className="text-[9px] font-bold opacity-20">{completedSubtasks}/{totalSubtasks}</span>
                </div>
            )}
        </div>
    );
}

export const KanbanCard = memo(KanbanCardInner);
