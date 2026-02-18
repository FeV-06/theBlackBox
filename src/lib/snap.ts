/**
 * Snaps a value to the nearest step (grid size).
 * Default step is 20px for TheBlackBox canvas.
 */
export function snap(value: number, step = 20): number {
    return Math.round(value / step) * step;
}
