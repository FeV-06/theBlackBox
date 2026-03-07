"use client";

import type { SchemaField } from "@/widgets/types";

export const visualSchema: Record<string, SchemaField> = {
    title: { type: "string", label: "Widget Title", category: "visual" },
    icon: {
        type: "select",
        label: "Icon",
        category: "visual",
        options: [
            { label: "None", value: "none" },
            { label: "Star", value: "star" },
            { label: "Clock", value: "clock" },
            { label: "GitHub", value: "github" },
            { label: "Chart", value: "chart" },
            { label: "Bolt", value: "bolt" },
            { label: "Activity", value: "activity" },
            { label: "Database", value: "database" }
        ]
    },
    accentColor: { type: "color", label: "Accent Color", category: "visual" },
    background: {
        type: "select",
        label: "Background Style",
        category: "visual",
        options: [
            { label: "Glassmorphism", value: "glass" },
            { label: "Solid Color", value: "solid" },
            { label: "Transparent", value: "transparent" }
        ]
    },
    textAlign: {
        type: "select",
        label: "Text Alignment",
        category: "visual",
        options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" }
        ]
    },
    fontSize: {
        type: "select",
        label: "Font Size",
        category: "visual",
        options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" }
        ]
    }
};

export const defaultVisualConfig = {
    title: "",
    icon: "none",
    accentColor: "#10b981",
    background: "glass",
    textAlign: "center",
    fontSize: "medium"
};
