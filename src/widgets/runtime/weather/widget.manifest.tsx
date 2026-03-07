import type { WidgetManifest, WidgetComponentProps } from "../../types";
import { useWidgetStore } from "@/store/useWidgetStore";
import React from "react";

export const widgetManifest: WidgetManifest = {
    id: "weather",
    name: "Weather",
    description: "Real-time weather data and 7-day forecast for any city.",
    component: async () => {
        const { default: Weather } = await import("@/components/widgets/WeatherWidget");
        return {
            default: function WrappedWeather({ widgetId }: WidgetComponentProps) {
                const instance = useWidgetStore(
                    (s) => widgetId ? s.instances[widgetId] : null
                );
                if (!instance) return <div className="p-4 text-xs opacity-50">Weather Preview</div>;
                return <Weather instance={instance} />;
            }
        };
    },
    configSchema: {
        unit: {
            type: "select",
            label: "Temperature Unit",
            options: [
                { label: "Celsius (°C)", value: "celsius" },
                { label: "Fahrenheit (°F)", value: "fahrenheit" }
            ]
        }
    },
    defaultConfig: {
        unit: "celsius"
    }
};
