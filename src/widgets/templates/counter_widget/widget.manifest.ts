import type { WidgetManifest } from "../../types";
import { visualSchema, defaultVisualConfig } from "../shared/visualSchema";

export const widgetManifest: WidgetManifest = {
    id: "counter-widget",
    name: "Tracker Widget",
    component: () => import("./component"),
    configSchema: {
        ...visualSchema,
        label: { type: "string", label: "Counter Label", category: "visual" },
        step: { type: "number", label: "Increment Step", category: "logic" },
        goal: { type: "number", label: "Goal Value", category: "data" },
        min: { type: "number", label: "Minimum Value", category: "data" },
        max: { type: "number", label: "Maximum Value", category: "data" },
        resetInterval: {
            type: "select",
            label: "Reset Interval",
            category: "logic",
            options: [
                { label: "Never", value: "never" },
                { label: "Daily", value: "daily" },
                { label: "Weekly", value: "weekly" }
            ]
        }
    },
    defaultConfig: {
        ...defaultVisualConfig,
        label: "Counter",
        step: 1,
        value: 0,
        goal: 0,
        min: 0,
        max: 9999,
        resetInterval: "never",
        lastResetAt: Date.now()
    }
};
