"use client";

import { useEffect, useRef } from "react";
import { useFocusStore } from "@/store/useFocusStore";

export default function FocusTimerManager() {
    const { isRunning, isPaused, tick } = useFocusStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning && !isPaused) {
            // Clear any existing interval before starting a new one
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(tick, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isPaused, tick]);

    return null; // This component doesn't render anything
}
