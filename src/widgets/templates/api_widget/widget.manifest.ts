import type { WidgetManifest } from "../../types";
import { visualSchema, defaultVisualConfig } from "../shared/visualSchema";

export const widgetManifest: WidgetManifest = {
    id: "api-widget",
    name: "Data Widget",
    component: () => import("./component"),
    configSchema: {
        ...visualSchema,
        url: { type: "string", label: "API URL", category: "data" },
        method: {
            type: "select",
            label: "HTTP Method",
            category: "data",
            options: [
                { label: "GET", value: "GET" },
                { label: "POST", value: "POST" }
            ]
        },
        headers: { type: "textarea", label: "Request Headers (JSON)", category: "data" },
        body: { type: "textarea", label: "Request Body (JSON)", category: "data" },
        field: { type: "string", label: "JSON Field (supports dot notation)", category: "data" },
        transform: {
            type: "select",
            label: "Value Transform",
            category: "logic",
            options: [
                { label: "None", value: "none" },
                { label: "Percentage (*100)", value: "percentage" },
                { label: "Round", value: "round" },
                { label: "Multiply (*)", value: "multiply" },
                { label: "Divide (/)", value: "divide" }
            ]
        },
        display: {
            type: "select",
            label: "Display Mode",
            category: "visual",
            options: [
                { label: "Normal Text", value: "text" },
                { label: "Styled Badge", value: "badge" },
                { label: "Progress Bar (0-100)", value: "progress" }
            ]
        },
        prefix: { type: "string", label: "Value Prefix", category: "visual" },
        suffix: { type: "string", label: "Value Suffix", category: "visual" },
        decimals: { type: "number", label: "Decimal Precision", category: "visual" },
        refresh: { type: "number", label: "Refresh Interval (seconds)", category: "data" },
        refreshMode: {
            type: "select",
            label: "Refresh Mode",
            category: "data",
            options: [
                { label: "Manual", value: "manual" },
                { label: "Interval", value: "interval" }
            ]
        },
        thresholdLow: { type: "number", label: "Low Threshold (Red)", category: "logic" },
        thresholdHigh: { type: "number", label: "High Threshold (Green)", category: "logic" }
    },
    defaultConfig: {
        ...defaultVisualConfig,
        method: "GET",
        refresh: 60,
        refreshMode: "interval",
        display: "text",
        transform: "none",
        decimals: 0
    }
};

