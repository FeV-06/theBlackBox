"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export function ThemeProvider() {
    const theme = useSettingsStore((s) => s.commandPaletteTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    return null;
}
