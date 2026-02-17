"use client";

import { useState } from "react";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useTodoStore } from "@/store/useTodoStore";
import { motion, AnimatePresence } from "framer-motion";

export default function TodoWidget() {
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
        <div className="flex flex-col gap-3">
            {/* Add input */}
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Add a task..."
                    className="flex-1 bg-white/[0.03] border border-[color:var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                />
                <button onClick={handleAdd} className="btn-accent px-3 py-2 flex items-center gap-1">
                    <Plus size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: "var(--color-accent)" }}
                    />
                </div>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {doneCount}/{todos.length}
                </span>
            </div>

            {/* Task list */}
            <div className="flex flex-col gap-1 max-h-48 overflow-auto">
                <AnimatePresence>
                    {todos.map((todo) => (
                        <motion.div
                            key={todo.id}
                            layout
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] group transition-colors"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                                style={{
                                    borderColor: todo.done ? "var(--color-accent)" : "rgba(255,255,255,0.15)",
                                    background: todo.done ? "var(--color-accent)" : "transparent",
                                }}
                            >
                                {todo.done && <CheckSquare size={12} className="text-white" />}
                            </button>
                            <span
                                className="flex-1 text-sm transition-all"
                                style={{
                                    color: todo.done ? "var(--color-text-muted)" : "var(--color-text-primary)",
                                    textDecoration: todo.done ? "line-through" : "none",
                                }}
                            >
                                {todo.text}
                            </span>
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 transition-all"
                                style={{ color: "var(--color-danger)" }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
