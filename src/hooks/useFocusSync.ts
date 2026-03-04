"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useFocusStore } from "@/store/useFocusStore";
import { createSyncedStore } from "@/lib/sync/createSyncedStore";
import { sessionToRow, rowToSession, type FocusRow } from "@/lib/sync/focusSync";

export function useFocusSync() {
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!user) return;

        let prevSessions = useFocusStore.getState().sessions;
        const remoteAppliedIds = new Set<string>();

        const engine = createSyncedStore<FocusRow>({
            table: "focus_sessions",
            deviceId: "web",
            debounceMs: 2000,
            onRemoteChange: (row) => {
                const session = rowToSession(row);
                remoteAppliedIds.add(session.id);
                useFocusStore.setState((s) => {
                    const exists = s.sessions.some(ses => ses.id === session.id);
                    if (exists) return s;
                    return { sessions: [...s.sessions, session] };
                });
                remoteAppliedIds.delete(session.id);
            },
            onRemoteDelete: (id) => {
                engine.cancel(id);
                remoteAppliedIds.add(id);
                useFocusStore.setState((s) => ({
                    sessions: s.sessions.filter(ses => ses.id !== id)
                }));
                remoteAppliedIds.delete(id);
            }
        });

        // Pull initial state
        engine.pull().then(rows => {
            if (rows.length === 0) return;
            rows.forEach(r => remoteAppliedIds.add(r.id));
            useFocusStore.setState(s => {
                const existingIds = new Set(s.sessions.map(ses => ses.id));
                const newSessions = rows.map(rowToSession).filter(ses => !existingIds.has(ses.id));
                return { sessions: [...s.sessions, ...newSessions] };
            });
            rows.forEach(r => remoteAppliedIds.delete(r.id));
        });

        const unsubRealtime = engine.subscribe();

        /* ── Synchronous Zustand subscribe for push ── */
        const unsubStore = useFocusStore.subscribe((state) => {
            const currentSessions = state.sessions;
            const currentIds = new Set(currentSessions.map(s => s.id));

            for (const session of currentSessions) {
                if (remoteAppliedIds.has(session.id)) continue;
                const prev = prevSessions.find(s => s.id === session.id);
                if (session !== prev) {
                    engine.push(sessionToRow(session, user.id));
                }
            }

            for (const oldS of prevSessions) {
                if (!currentIds.has(oldS.id) && !remoteAppliedIds.has(oldS.id)) {
                    engine.remove(oldS.id);
                }
            }

            prevSessions = currentSessions;
        });

        return () => {
            engine.destroy();
            unsubRealtime();
            unsubStore();
        };
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
