"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Minimal interface that any synced record must satisfy.
 * Intentionally avoids an index signature so concrete, strongly-typed
 * domain objects (like WidgetRow) can satisfy it without conflicts.
 */
type SyncableRecord = {
    id: string;
    updated_at?: string;
    deleted_at?: string | null;
};

interface SyncEngineOptions<T extends SyncableRecord> {
    /** The Supabase table to sync against */
    table: string;
    /** Device identifier for tracking edits (e.g. "web", "android") */
    deviceId?: string;
    /** Debounce delay in ms before pushing a write (default: 1500) */
    debounceMs?: number;
    /** Called when remote changes are received via Realtime */
    onRemoteChange?: (record: T) => void;
    /** Called when a remote delete (soft) is received */
    onRemoteDelete?: (id: string) => void;
}

/**
 * createSyncedStore
 *
 * A generic sync engine factory. Attach to any Zustand store to give it
 * transparent cloud-sync behaviour while keeping the local-first PWA experience.
 *
 * Usage:
 *   const sync = createSyncedStore<WidgetRow>({ table: "widgets", onRemoteChange: ... });
 *   sync.push(record);            // debounced UPSERT
 *   sync.remove(id);              // soft-delete
 *   const unsub = sync.subscribe();  // start Realtime listener
 */
export function createSyncedStore<T extends SyncableRecord>(
    options: SyncEngineOptions<T>
) {
    const {
        table,
        deviceId: baseDeviceId = "web",
        debounceMs = 1500,
        onRemoteChange,
        onRemoteDelete,
    } = options;

    const supabase = createClient();

    // Unique session ID for this specific tab/execution to distinguish from other "web" sessions
    const SYNC_SESSION_ID = typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const deviceId = `${baseDeviceId}:${SYNC_SESSION_ID}`;

    // Per-record debounce timers so rapidly changed records don't spam the DB
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    // In-memory queue for records changed while the device was offline
    const offlineQueue = new Map<string, T>();

    /** Flush a single record to Supabase. */
    async function flush(record: T) {
        console.debug(`[SyncEngine:${table}] Flushing record:`, record.id);
        const { error } = await supabase
            .from(table)
            .upsert({ ...record, device_id: deviceId });

        if (error) {
            console.error(`[SyncEngine:${table}] UPSERT failed for ID ${record.id}:`, error.message, error.details, error.hint);
            offlineQueue.set(record.id, record);
        } else {
            console.debug(`[SyncEngine:${table}] Successfully persisted:`, record.id);
            offlineQueue.delete(record.id);
        }
    }

    /** Flush the entire offline queue (called when connection is restored). */
    async function flushOfflineQueue() {
        if (offlineQueue.size === 0) return;
        const records = [...offlineQueue.values()];
        console.debug(`[SyncEngine:${table}] Flushing offline queue (${records.length} items)`);
        for (const record of records) {
            await flush(record);
        }
    }

    /** Push a record change (debounced). Safe to call on every local store update. */
    function push(record: T) {
        // Clear existing timer for this record
        const existing = timers.get(record.id);
        if (existing) clearTimeout(existing);

        // If offline, put directly in queue
        if (!navigator.onLine) {
            console.debug(`[SyncEngine:${table}] Offline, queueing:`, record.id);
            offlineQueue.set(record.id, record);
            return;
        }

        const timer = setTimeout(() => {
            timers.delete(record.id);
            flush(record);
        }, debounceMs);

        timers.set(record.id, timer);
    }

    /** Soft-delete a record (sets deleted_at, never hard-deletes). */
    async function remove(id: string) {
        // Cancel any pending push for this record
        const existing = timers.get(id);
        if (existing) {
            clearTimeout(existing);
            timers.delete(id);
        }

        const { error } = await supabase
            .from(table)
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.warn(`[SyncEngine:${table}] Soft-delete failed:`, error.message);
        }
    }

    /** Cancel a pending debounced push for a record (call this when a remote delete arrives). */
    function cancel(id: string) {
        const existing = timers.get(id);
        if (existing) {
            clearTimeout(existing);
            timers.delete(id);
        }
        offlineQueue.delete(id);
    }

    /** Cancel ALL pending timers and clear the queue. Call this when tearing down the engine. */
    function destroy() {
        for (const timer of timers.values()) clearTimeout(timer);
        timers.clear();
        offlineQueue.clear();
        console.debug(`[SyncEngine:${table}] Engine destroyed, all pending timers cancelled.`);
    }

    /**
     * Pull the latest state from Supabase for the currently logged-in user.
     * Returns records newer than `since`, or all records if not specified.
     * The caller is responsible for merging into local state using the
     * last_write_wins conflict resolution (compare updated_at timestamps).
     */
    async function pull(since?: string): Promise<T[]> {
        let query = supabase
            .from(table)
            .select("*")
            .is("deleted_at", null);

        if (since) {
            query = query.gt("updated_at", since);
        }

        const { data, error } = await query;

        if (error) {
            console.error(`[SyncEngine:${table}] Pull failed:`, error.message);
            return [];
        }

        return (data ?? []) as T[];
    }

    /**
     * Subscribe to Supabase Realtime changes on this table.
     * Returns an unsubscribe function.
     */
    function subscribe(): () => void {
        const channel = supabase
            .channel(`sync:${table}:${SYNC_SESSION_ID}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table },
                (payload) => {
                    const record = (payload.new ?? {}) as T & { device_id?: string };
                    const old = (payload.old ?? {}) as Partial<T>;

                    console.debug(`[SyncEngine:${table}] Realtime event:`, payload.eventType, record.id || old.id);

                    if (payload.eventType === "DELETE") {
                        if (old.id) onRemoteDelete?.(old.id);
                        return;
                    }

                    // Ignore changes from this specific session to avoid echo
                    if (record.device_id === deviceId) {
                        console.debug(`[SyncEngine:${table}] Ignoring echo from session:`, deviceId);
                        return;
                    }

                    // Soft-delete propagation
                    if (record.deleted_at && record.id) {
                        onRemoteDelete?.(record.id);
                        return;
                    }

                    onRemoteChange?.(record);
                }
            )
            .subscribe();

        // Wire up online event to flush queued writes
        const handleOnline = () => flushOfflineQueue();
        window.addEventListener("online", handleOnline);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener("online", handleOnline);
        };
    }

    return { push, remove, cancel, destroy, pull, subscribe, flushOfflineQueue };
}
