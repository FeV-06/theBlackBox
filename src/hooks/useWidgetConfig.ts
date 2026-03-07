"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import { useWidgetStore } from "@/store/useWidgetStore";

const DEBOUNCE_MS = 100;

/**
 * useWidgetConfig — localized widget state accessor with debounced sync.
 *
 * Widgets must use this hook instead of accessing the Zustand store directly.
 * This provides:
 *  - Localized subscriptions: only re-renders when THIS widget's config changes
 *  - Debounced persistence: batches rapid config changes to avoid sync engine floods
 *  - Encapsulated access: widgets cannot reach other store slices
 */
const EMPTY_CONFIG: Record<string, unknown> = {};

export function useWidgetConfig(widgetId?: string): {
    config: Record<string, unknown>;
    updateConfig: (partial: Record<string, unknown>) => void;
} {
    // 1. Subscribe to the source of truth (Zustand)
    const storeConfig = useWidgetStore(
        useCallback(
            (s) => (widgetId ? s.instances[widgetId]?.config : undefined) ?? EMPTY_CONFIG,
            [widgetId]
        )
    );

    const { updateInstanceConfig } = useWidgetStore.getState();

    // 2. Local State for Optimistic UI (Instant Feedback)
    const [localState, setLocalState] = useState<Record<string, unknown>>({});

    // Debounce timer ref
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<Record<string, unknown>>({});

    // 3. Merge local overrides on top of store config
    const config = useMemo(() => ({
        ...storeConfig,
        ...localState
    }), [storeConfig, localState]);

    const updateConfig = useCallback(
        (partial: Record<string, unknown>) => {
            if (!widgetId) return;

            // 🚀 STEP 1: Update local state immediately for instant UI response
            setLocalState(prev => ({ ...prev, ...partial }));

            // 🚀 STEP 2: Accumulate and debounce the real store update
            pendingRef.current = { ...pendingRef.current, ...partial };

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                updateInstanceConfig(widgetId!, pendingRef.current);
                pendingRef.current = {};
                timerRef.current = null;

                // Clear local overrides once the store has confirmed the update
                setLocalState({});
            }, DEBOUNCE_MS);
        },
        [widgetId, updateInstanceConfig]
    );

    return { config, updateConfig };
}
