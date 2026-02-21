import type { BehaviorLog } from "./behaviorTracker";

export type BehaviorPatternType = "focus_hour" | "productivity_burst" | "low_activity";

export type BehaviorPattern = {
    type: BehaviorPatternType;
    confidence: number;
    meta?: Record<string, unknown>;
};

/**
 * Pure function: Detects behavioral patterns from raw logs.
 * Must NOT be called frequently (e.g. inside tight render loops) without memoization.
 */
export function detectPatterns(logs: BehaviorLog[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const now = Date.now();

    // 1. Peak Focus Hour
    // Group "focus_start" by hour (0–23)
    const focusStarts = logs.filter(log => log.type === "focus_start");
    if (focusStarts.length > 0) {
        const hourBuckets = new Array(24).fill(0);
        focusStarts.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            hourBuckets[hour]++;
        });

        let maxHour = 0;
        let maxCount = 0;
        for (let i = 0; i < 24; i++) {
            if (hourBuckets[i] > maxCount) {
                maxCount = hourBuckets[i];
                maxHour = i;
            }
        }

        if (maxCount >= 3) {
            patterns.push({
                type: "focus_hour",
                confidence: 0.8,
                meta: { hour: maxHour }
            });
        }
    }

    // 2. Productivity Burst
    // Sliding window of 2 hours for task completions
    const MS_PER_2_HOURS = 2 * 60 * 60 * 1000;
    const taskCompletes = logs.filter(log => log.type === "task_complete").sort((a, b) => a.timestamp - b.timestamp);

    let hasBurst = false;
    for (let i = 0; i < taskCompletes.length; i++) {
        let countInWindow = 1;
        const windowStart = taskCompletes[i].timestamp;

        // Look ahead
        for (let j = i + 1; j < taskCompletes.length; j++) {
            if (taskCompletes[j].timestamp - windowStart <= MS_PER_2_HOURS) {
                countInWindow++;
            } else {
                break; // Because array is sorted
            }
        }

        if (countInWindow >= 3) {
            hasBurst = true;
            break;
        }
    }

    if (hasBurst) {
        patterns.push({
            type: "productivity_burst",
            confidence: 0.85
        });
    }

    // 3. Low Activity
    // No focus_start AND no task_complete in last 24h
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const cutoff24h = now - MS_PER_DAY;

    const hasRecentActivity = logs.some(log =>
        (log.type === "focus_start" || log.type === "task_complete") && log.timestamp >= cutoff24h
    );

    if (!hasRecentActivity) {
        patterns.push({
            type: "low_activity",
            confidence: 0.9
        });
    }

    return patterns;
}
