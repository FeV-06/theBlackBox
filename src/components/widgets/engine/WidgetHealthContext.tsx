import { createContext, useContext } from "react";

export type HealthStatusType = 'loading' | 'success' | 'error' | 'stale';

interface WidgetHealthContextValue {
    reportHealth: (status: HealthStatusType, message?: string) => void;
}

export const WidgetHealthContext = createContext<WidgetHealthContextValue | null>(null);

/**
 * useWidgetHealth
 * 
 * Provides widgets with a way to report their health/status back to the dashboard.
 * Separated into a standalone context file to prevent circular dependencies between 
 * WidgetRuntime and the Widget Registry.
 */
export const useWidgetHealth = () => {
    const ctx = useContext(WidgetHealthContext);
    if (!ctx) {
        // Return a dummy implementation when used outside WidgetRuntime (like in previews/builder)
        return {
            reportHealth: (status: HealthStatusType, message?: string) => {
                if (process.env.NODE_ENV === 'development') {
                    // console.debug(`[WidgetHealth] Dummy report: ${status} ${message || ''}`);
                }
            }
        };
    }
    return ctx;
};
