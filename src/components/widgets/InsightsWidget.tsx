"use client";

import React, { useState, useMemo, useRef, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusStore } from "@/store/useFocusStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import type { WidgetInstance, TodoItem } from "@/types/widgetInstance";
import type { TimeRange } from "@/types/insights";
import { useDashboardContext } from "@/hooks/useDashboardContext";

// Data layer
import { extractFocusPoints, extractTaskStats, extractProjectStats, extractCombinedData } from "@/lib/insights/extractors";
import { getDaysInRange } from "@/lib/insights/aggregators";
import { formatDuration } from "@/lib/insights/formatters";
import { generateInsights as generateEngineInsights } from "@/lib/insights/insightEngine";
import type { InsightCard } from "@/types/insights";

// UI sub-components
import InsightsHeader from "@/components/insights/InsightsHeader";
import InsightsTabs from "@/components/insights/InsightsTabs";
import FocusInsights from "@/components/insights/FocusInsights";
import TaskInsights from "@/components/insights/TaskInsights";
import ProjectInsights from "@/components/insights/ProjectInsights";
import CombinedInsights from "@/components/insights/CombinedInsights";
import StatsRow from "@/components/insights/StatsRow";
import EmptyState from "@/components/insights/EmptyState";

type TabId = "focus" | "tasks" | "projects" | "combined";

function InsightsWidgetInner({ instance }: { instance: WidgetInstance }) {
    const sessions = useFocusStore((s) => s.sessions);
    const projects = useProjectStore((s) => s.projects);
    const allInstances = useWidgetStore((s) => s.instances);

    const [tab, setTab] = useState<TabId>("focus");
    const [range, setRange] = useState<TimeRange>("week");

    // Responsive sizing
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerH, setContainerH] = useState(400);
    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver((entries) => {
            const h = entries[0]?.contentRect?.height || 400;
            setContainerH(h);
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    const isCompact = containerH < 300;

    // Aggregate todos from all todo widget instances
    const allTodos = useMemo<TodoItem[]>(() => {
        const items: TodoItem[] = [];
        Object.values(allInstances).forEach((inst) => {
            if (inst.type === "todo" && inst.data?.todos) {
                items.push(...(inst.data.todos as TodoItem[]));
            }
        });
        return items;
    }, [allInstances]);

    // Data extraction (pure functions — no side effects)
    const days = useMemo(() => getDaysInRange(range), [range]);
    const focusPoints = useMemo(() => extractFocusPoints(sessions, days), [sessions, days]);
    const taskStats = useMemo(() => extractTaskStats(allTodos), [allTodos]);
    const projectStats = useMemo(() => extractProjectStats(projects), [projects]);
    const combinedData = useMemo(() => extractCombinedData(focusPoints, allTodos, days), [focusPoints, allTodos, days]);

    // Aggregated stats for header / stats row
    const totalFocusMinutes = useMemo(() => focusPoints.reduce((a, p) => a + p.minutes, 0), [focusPoints]);
    const avgFocusPerDay = useMemo(() => (days.length > 0 ? totalFocusMinutes / days.length : 0), [totalFocusMinutes, days]);
    const bestDay = useMemo(() => {
        return focusPoints.reduce(
            (best, p) => (p.minutes > best.minutes ? p : best),
            { date: "", minutes: 0 }
        ).date;
    }, [focusPoints]);

    // Use centralized Insight Engine
    const context = useDashboardContext();
    const engineInsights = useMemo(
        () => generateEngineInsights({ focusSessions: sessions, todos: allTodos, projects }, context),
        [sessions, allTodos, projects, context]
    );
    const insights: InsightCard[] = useMemo(
        () => engineInsights.map((ei) => ({
            text: ei.isPredictive ? ei.description : `${ei.title} — ${ei.description}`,
            type: ei.isPredictive ? "predictive" as const : (ei.type === "positive" ? "success" as const : ei.type === "warning" ? "warning" as const : "info" as const),
            isPredictive: ei.isPredictive,
        })),
        [engineInsights]
    );

    const focusDisplay = formatDuration(totalFocusMinutes);
    const hasData = sessions.length > 0 || allTodos.length > 0 || projects.length > 0;

    return (
        <div ref={containerRef} className="flex flex-col h-full w-full overflow-hidden transition-all duration-300 ease-out">
            {/* Header / Tabs — Pinned */}
            <div className="flex-none">
                <InsightsHeader range={range} setRange={setRange} />
                <InsightsTabs tab={tab} setTab={setTab} />
            </div>

            {/* Main scrollable/stretching content */}
            <div className="flex-1 min-h-0 relative px-2 overflow-hidden">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab}
                            className="h-full w-full"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {tab === "focus" && (
                                <FocusInsights
                                    data={focusPoints}
                                    totalMinutes={totalFocusMinutes}
                                    avgPerDay={avgFocusPerDay}
                                    bestDay={bestDay}
                                    isCompact={isCompact}
                                />
                            )}
                            {tab === "tasks" && (
                                <TaskInsights stats={taskStats} isCompact={isCompact} />
                            )}
                            {tab === "projects" && (
                                <ProjectInsights projectStats={projectStats} />
                            )}
                            {tab === "combined" && (
                                <CombinedInsights
                                    data={combinedData}
                                    insights={insights}
                                    isCompact={isCompact}
                                    focusDisplay={focusDisplay}
                                    tasksCompleted={taskStats.completed}
                                    avgProgress={projectStats.avgProgress}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Footer / Stats — Pinned */}
            <div className="flex-none">
                <StatsRow
                    focusDisplay={focusDisplay}
                    tasksCompleted={taskStats.completed}
                    completionPct={projectStats.avgProgress}
                />
            </div>
        </div>
    );
}

export default memo(InsightsWidgetInner);
