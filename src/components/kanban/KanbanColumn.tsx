"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import type { ProjectTask } from "@/types/widget";
import { useProjectStore } from "@/store/useProjectStore";

interface KanbanColumnProps {
    id: string; // column status: "todo" | "in_progress" | "done"
    title: string;
    tasks: ProjectTask[];
    projectId: string;
    projectColor: string;
}

export function KanbanColumn({ id, title, tasks, projectId, projectColor }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });
    const { createTask, recordWork } = useProjectStore();
    const [isAdding, setIsAdding] = useState(false);
    const [text, setText] = useState("");

    const taskIds = tasks.map(t => t.id);

    const handleAdd = () => {
        if (!text.trim()) {
            setIsAdding(false);
            return;
        }
        createTask(projectId, text.trim(), id as any);
        recordWork(projectId);
        setText("");
        setIsAdding(false);
    };

    return (
        <div className="flex flex-col gap-4 w-full min-w-0">
            <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                        {title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] font-medium text-white/40">
                        {tasks.length}
                    </span>
                </div>
                {id !== "done" && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <div
                ref={setNodeRef}
                className="flex flex-col gap-3 min-h-[220px] p-3 rounded-2xl border border-white/[0.05] bg-white/[0.01] relative group/column overflow-hidden transition-all duration-300"
            >
                {/* Background Accent Glow */}
                <div
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover/column:opacity-20 transition-opacity duration-700 pointer-events-none"
                    style={{ background: projectColor }}
                />

                {isAdding && (
                    <div className="flex flex-col gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.08] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-10">
                        <textarea
                            autoFocus
                            placeholder="What needs to be done?"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAdd();
                                } else if (e.key === "Escape") {
                                    setIsAdding(false);
                                    setText("");
                                }
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm resize-none min-h-[80px] leading-relaxed"
                            style={{ color: "var(--color-text-primary)" }}
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAdd}
                                    className="px-4 py-1.5 rounded-lg bg-[color:var(--color-accent)] text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-[color:var(--color-accent)]/20 hover:scale-105 transition-transform"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => { setIsAdding(false); setText(""); }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <span className="text-[10px] text-white/20 italic">Press Enter to save</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2.5 z-10">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        {tasks.map(task => (
                            <KanbanCard
                                key={task.id}
                                task={task}
                                projectId={projectId}
                                projectColor={projectColor}
                            />
                        ))}
                    </SortableContext>
                </div>

                {!isAdding && tasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/[0.03] rounded-xl py-12 gap-2 opacity-50 group/drop transition-all">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center scale-90 group-hover/drop:scale-100 transition-transform">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: projectColor }} />
                        </div>
                        <span className="text-[11px] font-medium tracking-wide uppercase text-white/20">Drop tasks here</span>
                    </div>
                )}

                {!isAdding && id !== "done" && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-auto flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/[0.04] text-[10px] uppercase font-bold tracking-widest text-white/20 hover:text-white transition-all border border-transparent hover:border-white/5"
                    >
                        <Plus size={12} className="shrink-0" /> Add Task
                    </button>
                )}
            </div>
        </div>
    );
}
