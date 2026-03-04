"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { createSyncedStore } from "@/lib/sync/createSyncedStore";
import { createClient } from "@/lib/supabase/client";
import { instanceToRow, rowToInstance, type WidgetRow } from "@/lib/sync/widgetSync";

/**
 * useWidgetSync
 *
 * Headless hook: attaches the Supabase sync engine to the widget store.
 *
 * Push architecture (v2 — Zustand subscribe):
 *   Instead of a React useEffect observing state changes (which React schedules
 *   asynchronously and can race with remoteAppliedIds tracking), we use
 *   useWidgetStore.subscribe(). This runs SYNCHRONOUSLY on every state change,
 *   before React re-renders, with zero scheduler involvement.
 *
 *   - On sign-in: pulls all widgets from Supabase and merges (last_write_wins).
 *   - On local change: synchronous diff → debounced UPSERT.
 *   - On remote change: sets a flag BEFORE calling setState so the subscribe
 *     callback can ignore the resulting change.
 *   - On sign-out: tears down all subscriptions.
 */
export function useWidgetSync() {
    const user = useAuthStore((s) => s.user);
    const layoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!user) return;

        // ── Refs that live entirely outside React's lifecycle ──
        let prevInstances = useWidgetStore.getState().instances;
        // IDs currently being applied from a remote Realtime event.
        // Checked synchronously inside the subscribe callback.
        const remoteAppliedIds = new Set<string>();

        const engine = createSyncedStore<WidgetRow>({
            table: "widgets",
            deviceId: "web",
            debounceMs: 1500,

            onRemoteChange: (row) => {
                const incoming = rowToInstance(row);

                // Mark BEFORE setState so subscribe synchronously skips echo-push
                remoteAppliedIds.add(row.id);
                useWidgetStore.setState((s) => {
                    const isNew = !s.instances[row.id];
                    return {
                        instances: { ...s.instances, [row.id]: incoming },
                        layout: isNew && !s.layout.includes(row.id)
                            ? [...s.layout, row.id]
                            : s.layout,
                    };
                });
                remoteAppliedIds.delete(row.id);
            },

            onRemoteDelete: (id) => {
                engine.cancel(id);
                remoteAppliedIds.add(id);
                useWidgetStore.setState((s) => {
                    if (!s.instances[id]) return s;
                    const { [id]: _, ...rest } = s.instances;
                    return {
                        instances: rest,
                        layout: s.layout.filter((l) => l !== id),
                    };
                });
                remoteAppliedIds.delete(id);
            },
        });

        /* ── Initial pull — hydrate store from cloud ── */
        engine.pull().then(async (rows) => {
            if (rows.length === 0) return;

            const supabase = createClient();
            const { data: layoutRow } = await supabase
                .from("widget_layouts")
                .select("layout")
                .eq("user_id", user.id)
                .single();

            // Bulk-mark all hydrated IDs as remote so subscribe ignores them
            const hydrateIds = new Set(rows.map(r => r.id));
            hydrateIds.forEach(id => remoteAppliedIds.add(id));

            useWidgetStore.setState((s) => {
                const mergedInstances = { ...s.instances };
                const existingLayout = [...s.layout];

                for (const row of rows) {
                    const remote = rowToInstance(row);
                    // Server is source of truth on hydration — always apply remote
                    mergedInstances[row.id] = remote;
                    if (!existingLayout.includes(row.id)) {
                        existingLayout.push(row.id);
                    }
                }

                const remoteOrder: string[] | null = layoutRow?.layout ?? null;
                const finalLayout = remoteOrder && remoteOrder.length > 0
                    ? remoteOrder.filter((id) => !!mergedInstances[id])
                    : existingLayout;

                useSettingsStore.getState().setHasCompletedSetup(true);

                return { instances: mergedInstances, layout: finalLayout };
            });

            hydrateIds.forEach(id => remoteAppliedIds.delete(id));
        });

        /* ── Subscribe to Realtime changes ── */
        const unsubRealtime = engine.subscribe();

        /* ── Synchronous Zustand subscribe for push ──
         *
         * This fires SYNCHRONOUSLY whenever widgetStore state changes.
         * No React scheduler involved → no race conditions with remoteAppliedIds.
         */
        const unsubStore = useWidgetStore.subscribe((state, prev) => {
            if (!engine) return;

            const currentInstances = state.instances;
            const currentIds = new Set(Object.keys(currentInstances));

            // 1. Push additions and updates (skip remote-applied IDs)
            for (const id of state.layout) {
                if (remoteAppliedIds.has(id)) continue;
                const inst = currentInstances[id];
                if (!inst) continue;
                if (inst !== prevInstances[id]) {
                    engine.push(instanceToRow(inst, user.id));
                }
            }

            // 2. Push deletions
            for (const oldId of Object.keys(prevInstances)) {
                if (!currentIds.has(oldId) && !remoteAppliedIds.has(oldId)) {
                    engine.remove(oldId);
                }
            }

            prevInstances = currentInstances;
        });

        /* ── Layout order persistence (debounced) ── */
        const unsubLayout = useWidgetStore.subscribe((state) => {
            if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
            layoutDebounceRef.current = setTimeout(async () => {
                const supabase = createClient();
                await supabase
                    .from("widget_layouts")
                    .upsert({ user_id: user.id, layout: state.layout, updated_at: new Date().toISOString() });
            }, 2000);
        });

        return () => {
            engine.destroy();
            unsubRealtime();
            unsubStore();
            unsubLayout();
            if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
        };
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
