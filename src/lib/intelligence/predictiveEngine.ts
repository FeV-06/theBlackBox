import type { BehaviorPattern } from "./patternEngine";
import type { DashboardContextValue } from "@/hooks/useDashboardContext";

export type PredictiveInsightType = "focus_nudge" | "burst_nudge" | "recovery_nudge";

export type PredictiveInsight = {
    id: string;
    message: string;
    type: PredictiveInsightType;
    isPredictive: true; // Distinguishes from normal insights
};

// Cooldown map (in ms)
const COOLDOWNS_MS = {
    focus_nudge: 2 * 60 * 60 * 1000, // 2 hours
    burst_nudge: 1 * 60 * 60 * 1000, // 1 hour
    recovery_nudge: 6 * 60 * 60 * 1000, // 6 hours
};

const STORAGE_KEY = "tbb-nudge-cooldowns";

function getCooldowns(): Record<PredictiveInsightType, number> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {} as Record<PredictiveInsightType, number>;
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
            return parsed as Record<PredictiveInsightType, number>;
        }
        return {} as Record<PredictiveInsightType, number>;
    } catch {
        return {} as Record<PredictiveInsightType, number>;
    }
}

function updateCooldown(type: PredictiveInsightType) {
    try {
        const cooldowns = getCooldowns();
        cooldowns[type] = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cooldowns));
    } catch {
        // fail silently
    }
}

export function generatePredictiveInsights(
    patterns: BehaviorPattern[],
    context: DashboardContextValue
): PredictiveInsight[] {
    const results: PredictiveInsight[] = [];
    const now = Date.now();
    const cooldowns = getCooldowns();

    // 1. FOCUS NUDGE
    const focusPattern = patterns.find(p => p.type === "focus_hour");
    if (focusPattern && focusPattern.confidence >= 0.7 && focusPattern.meta?.hour !== undefined) {
        const peakHour = focusPattern.meta.hour as number;
        const currentHour = context.hour;
        const isWithinHour = Math.abs(currentHour - peakHour) <= 1 || Math.abs(currentHour - peakHour) >= 23;

        if (isWithinHour && !context.isFocusActive) {
            const lastShown = cooldowns["focus_nudge"] || 0;
            if (now - lastShown >= COOLDOWNS_MS.focus_nudge) {
                results.push({
                    id: "pred-focus-nudge",
                    type: "focus_nudge",
                    message: "You usually focus around this time",
                    isPredictive: true,
                });
                updateCooldown("focus_nudge");
            }
        }
    }

    // 2. BURST NUDGE
    const burstPattern = patterns.find(p => p.type === "productivity_burst");
    if (burstPattern && burstPattern.confidence >= 0.7) {
        const lastShown = cooldowns["burst_nudge"] || 0;
        if (now - lastShown >= COOLDOWNS_MS.burst_nudge) {
            results.push({
                id: "pred-burst-nudge",
                type: "burst_nudge",
                message: "You're in a productive streak — keep going",
                isPredictive: true,
            });
            updateCooldown("burst_nudge");
        }
    }

    // 3. RECOVERY NUDGE
    const recoveryPattern = patterns.find(p => p.type === "low_activity");
    if (recoveryPattern && recoveryPattern.confidence >= 0.7) {
        const lastShown = cooldowns["recovery_nudge"] || 0;
        if (now - lastShown >= COOLDOWNS_MS.recovery_nudge) {
            results.push({
                id: "pred-recovery-nudge",
                type: "recovery_nudge",
                message: "You've been inactive — start small (5 min focus)",
                isPredictive: true,
            });
            updateCooldown("recovery_nudge");
        }
    }

    return results;
}
