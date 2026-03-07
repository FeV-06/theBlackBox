import type { WidgetManifest } from "../../types";
import { visualSchema, defaultVisualConfig } from "../shared/visualSchema";

export const widgetManifest: WidgetManifest = {
    id: "text-widget",
    name: "Notes Widget",
    component: () => import("./component"),
    configSchema: {
        ...visualSchema,
        content: { type: "textarea", label: "Text Content", category: "data" },
        editable: { type: "boolean", label: "Inline Editing", category: "data" },
        format: {
            type: "select",
            label: "Format",
            category: "data",
            options: [
                { label: "Plain Text", value: "plain" },
                { label: "Markdown", value: "markdown" }
            ]
        }
    },
    defaultConfig: {
        ...defaultVisualConfig,
        content: "Write something...",
        editable: false,
        format: "plain"
    }
};
