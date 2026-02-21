import { useMemo } from "react";
import type { WidgetInstance } from "@/types/widgetInstance";
import { useDashboardContext } from "./useDashboardContext";
import { computeWidgetPriority, PriorityResult } from "@/lib/intelligence/priorityEngine";

export function useWidgetPriority(instance: WidgetInstance): PriorityResult {
    const context = useDashboardContext();

    // Memoize the priority score so it only recalculates if the specific widget data changes
    // or the global intelligence context ticks.
    return useMemo(() => {
        return computeWidgetPriority(instance, context);
    }, [instance, context]);
}
