"use client";

import { useState } from "react";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useTodoStore } from "@/store/useTodoStore";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetInstance } from "@/types/widgetInstance";

export default function TodoWidget({ instance }: { instance: WidgetInstance }) {
    const { todos, addTodo, toggleTodo, deleteTodo } = useTodoStore();
    const [input, setInput] = useState("");

    const doneCount = todos.filter((t) => t.done).length;
    const progress = todos.length > 0 ? (doneCount / todos.length) * 100 : 0;

    const handleAdd = () => {
        const text = input.trim();
        if (!text) return;
        addTodo(text);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Add input */}
            <div className="flex gap-2 shrink-0">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Add a task..."
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={handleAdd} className="btn-accent px-3 py-2 flex items-center gap-1 rounded-lg">
                    <Plus size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: "var(--color-accent)" }}
                    />
                </div>
                <span className="text-[10px] font-bold opacity-40 shrink-0">
                    {doneCount}/{todos.length}
                </span>
            </div>

            {/* Task list */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                <AnimatePresence initial={false}>
                    {todos.map((todo) => (
                        <motion.div
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.02] group transition-colors border border-transparent hover:border-white/[0.03]"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all"
                                style={{
                                    borderColor: todo.done ? "var(--color-accent)" : "rgba(255,255,255,0.1)",
                                    background: todo.done ? "var(--color-accent)" : "transparent",
                                }}
                            >
                                {todo.done && <CheckSquare size={10} className="text-white" />}
                            </button>
                            <span
                                className="flex-1 text-xs transition-all truncate"
                                style={{
                                    color: todo.done ? "var(--color-text-muted)" : "var(--color-text-primary)",
                                    textDecoration: todo.done ? "line-through" : "none",
                                    opacity: todo.done ? 0.4 : 1,
                                }}
                            >
                                {todo.text}
                            </span>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {todos.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-2">
                        <CheckSquare size={24} />
                        <p className="text-[10px] uppercase font-bold tracking-widest">No tasks yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
