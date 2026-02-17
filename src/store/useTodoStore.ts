"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Todo } from "@/types/widget";
import { generateId } from "@/lib/utils";

interface TodoState {
    todos: Todo[];
    addTodo: (text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearCompleted: () => void;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set) => ({
            todos: [],
            addTodo: (text) =>
                set((s) => ({
                    todos: [
                        ...s.todos,
                        { id: generateId(), text, done: false, createdAt: Date.now() },
                    ],
                })),
            toggleTodo: (id) =>
                set((s) => ({
                    todos: s.todos.map((t) =>
                        t.id === id ? { ...t, done: !t.done } : t
                    ),
                })),
            deleteTodo: (id) =>
                set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
            clearCompleted: () =>
                set((s) => ({ todos: s.todos.filter((t) => !t.done) })),
        }),
        { name: "tbb-todos" }
    )
);
