"use client";

import { useState, useEffect } from "react";

/**
 * Returns the current computed value of --color-accent CSS variable.
 * Updates when the data-theme attribute changes.
 */
export function useAccentColor(): string {
    const [accent, setAccent] = useState("#7C5CFF");

    useEffect(() => {
        const update = () => {
            const computed = getComputedStyle(document.documentElement)
                .getPropertyValue("--color-accent")
                .trim();
            if (computed) setAccent(computed);
        };

        update();

        // Watch for theme changes via MutationObserver on data-theme
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    return accent;
}

/**
 * Converts a hex color to an rgba string at the given alpha.
 */
export function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
