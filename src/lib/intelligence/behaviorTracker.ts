export type BehaviorEvent =
    | "focus_start"
    | "focus_end"
    | "task_complete"
    | "task_add"
    | "project_update";

export type BehaviorLog = {
    type: BehaviorEvent;
    timestamp: number;
};

const STORAGE_KEY = "tbb-behavior-logs";
const MAX_ENTRIES = 200;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getBehaviorLogs(): BehaviorLog[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as BehaviorLog[];
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

export function logBehavior(event: BehaviorEvent) {
    try {
        const logs = getBehaviorLogs();
        const now = Date.now();
        const cutoff = now - MAX_AGE_MS;

        // Add new, then filter and truncate
        logs.push({ type: event, timestamp: now });

        const validLogs = logs
            .filter(log => log.timestamp >= cutoff)
            .slice(-MAX_ENTRIES);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(validLogs));
    } catch {
        // Fail silently - purely analytical tracking
        console.warn("[BehaviorTracker] Failed to record behavior logic.");
    }
}
