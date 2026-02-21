"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useFocusStore } from "@/store/useFocusStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import type { TodoItem } from "@/types/widgetInstance";
import type { FocusSession } from "@/types/widget";
import { getBehaviorLogs } from "@/lib/intelligence/behaviorTracker";
import { detectPatterns, type BehaviorPattern } from "@/lib/intelligence/patternEngine";

export interface DashboardContextValue {
    hour: number;
    overdueTodos: number;
    todayTodos: number;
    highPriorityTodos: number;
    isFocusActive: boolean;
    stalledProjects: number;
    focusSessionsToday: number;
    totalTodos: number;
    completedTodos: number;
    patterns: BehaviorPattern[];
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    // Basic Time State - initialize to a stable value for SSR matching
    const [hour, setHour] = useState(12);

    useEffect(() => {
        setHour(new Date().getHours());
    }, []);

    // Setup 1-minute interval for time updates to prevent heavy re-renders
    useEffect(() => {
        const interval = setInterval(() => {
            const currentHour = new Date().getHours();
            if (currentHour !== hour) {
                setHour(currentHour);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [hour]);

    // Store Subscriptions
    const isFocusActive = useFocusStore((s) => s.isRunning && !s.isPaused);
    const sessions = useFocusStore((s) => s.sessions);
    const projects = useProjectStore((s) => s.projects);
    const instances = useWidgetStore((s) => s.instances);

    // Compute Derived Values efficiently (Memoized per dependency array)
    const contextValue = useMemo(() => {
        let overdueTodos = 0;
        let todayTodos = 0;
        let highPriorityTodos = 0;
        let totalTodos = 0;
        let completedTodos = 0;

        const todayStr = new Date().toISOString().slice(0, 10);

        // 1. Compute Todo Stats
        Object.values(instances).forEach((inst) => {
            if (inst.type === "todo" && inst.data?.todos) {
                const todos = inst.data.todos as TodoItem[];
                todos.forEach((t) => {
                    totalTodos++;
                    if (t.completed) {
                        completedTodos++;
                        return; // skip other counts if completed
                    }
                    if (t.dueDate) {
                        if (t.dueDate < todayStr) overdueTodos++;
                        else if (t.dueDate === todayStr) todayTodos++;
                    }
                    if (t.priority === "high") highPriorityTodos++;
                });
            }
        });

        // 2. Compute Focus Stats
        const focusSessionsToday = sessions.filter(
            (s) => new Date(s.startTime).toISOString().slice(0, 10) === todayStr
        ).length;

        // 3. Compute Project Stats
        let stalledProjects = 0;
        const MS_PER_DAY = 1000 * 60 * 60 * 24;
        const now = Date.now();

        projects.forEach(p => {
            // Check for uncompleted tasks
            const hasIncomplete = p.tasks.some(t => t.status !== "done" || t.subtasks?.some(st => !st.completed));
            if (!hasIncomplete) return;

            // Check if last worked date is older than 3 days
            if (p.lastWorkedDate) {
                const lastWorked = new Date(p.lastWorkedDate).getTime();
                const daysSince = Math.floor((now - lastWorked) / MS_PER_DAY);
                if (daysSince > 3) stalledProjects++;
            } else {
                // If never worked on and created > 3 days ago
                const daysSince = Math.floor((now - p.createdAt) / MS_PER_DAY);
                if (daysSince > 3) stalledProjects++;
            }
        });

        // 4. Compute Patterns
        const patterns = detectPatterns(getBehaviorLogs());

        return {
            hour,
            overdueTodos,
            todayTodos,
            highPriorityTodos,
            isFocusActive,
            stalledProjects,
            focusSessionsToday,
            totalTodos,
            completedTodos,
            patterns
        };
    }, [hour, instances, isFocusActive, sessions, projects]);

    return (
        <DashboardContext.Provider value={contextValue}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboardContext() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboardContext must be used within a DashboardProvider");
    }
    return context;
}
