"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FocusSession } from "@/types/widget";
import { generateId } from "@/lib/utils";

interface FocusState {
    sessions: FocusSession[];
    isRunning: boolean;
    isPaused: boolean;
    startTime: number | null;
    elapsed: number; // seconds
    mode: "normal" | "pomodoro";
    pomodoroWork: number; // minutes
    pomodoroBreak: number; // minutes
    pomodoroPhase: "work" | "break";
    pomodoroCycles: number;
    startSession: () => void;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => void;
    tick: () => void;
    setMode: (mode: "normal" | "pomodoro") => void;
    setPomodoroWork: (mins: number) => void;
    setPomodoroBreak: (mins: number) => void;
    clearSessions: () => void;
}

export const useFocusStore = create<FocusState>()(
    persist(
        (set, get) => ({
            sessions: [],
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsed: 0,
            mode: "normal",
            pomodoroWork: 25,
            pomodoroBreak: 5,
            pomodoroPhase: "work",
            pomodoroCycles: 0,

            startSession: () =>
                set({
                    isRunning: true,
                    isPaused: false,
                    startTime: Date.now(),
                    elapsed: 0,
                    pomodoroPhase: "work",
                    pomodoroCycles: 0,
                }),

            pauseSession: () => set({ isPaused: true }),
            resumeSession: () => set({ isPaused: false }),

            stopSession: () => {
                const s = get();
                if (s.startTime && s.elapsed > 0) {
                    const session: FocusSession = {
                        id: generateId(),
                        startTime: s.startTime,
                        endTime: Date.now(),
                        duration: s.elapsed,
                        type: s.mode,
                    };
                    set((prev) => ({
                        sessions: [...prev.sessions, session],
                        isRunning: false,
                        isPaused: false,
                        startTime: null,
                        elapsed: 0,
                        pomodoroPhase: "work",
                    }));
                } else {
                    set({ isRunning: false, isPaused: false, startTime: null, elapsed: 0 });
                }
            },

            tick: () => {
                const s = get();
                if (!s.isRunning || s.isPaused) return;

                const newElapsed = s.elapsed + 1;

                if (s.mode === "pomodoro") {
                    const phaseLimit =
                        s.pomodoroPhase === "work"
                            ? s.pomodoroWork * 60
                            : s.pomodoroBreak * 60;

                    if (newElapsed >= phaseLimit) {
                        if (s.pomodoroPhase === "work") {
                            set({
                                elapsed: 0,
                                pomodoroPhase: "break",
                                pomodoroCycles: s.pomodoroCycles + 1,
                            });
                        } else {
                            set({ elapsed: 0, pomodoroPhase: "work" });
                        }
                        return;
                    }
                }

                set({ elapsed: newElapsed });
            },

            setMode: (mode) => set({ mode }),
            setPomodoroWork: (mins) => set({ pomodoroWork: mins }),
            setPomodoroBreak: (mins) => set({ pomodoroBreak: mins }),
            clearSessions: () => set({ sessions: [] }),
        }),
        {
            name: "tbb-focus",
            partialize: (state) => ({
                sessions: state.sessions,
                mode: state.mode,
                pomodoroWork: state.pomodoroWork,
                pomodoroBreak: state.pomodoroBreak,
            }),
        }
    )
);
