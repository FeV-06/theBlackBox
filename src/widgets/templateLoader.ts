import { registerTemplateManifest } from "./registry";
import { useWidgetStore } from "@/store/useWidgetStore";
import { widgetManifest as apiWidgetManifest } from "./templates/api_widget/widget.manifest";
import { widgetManifest as textWidgetManifest } from "./templates/text_widget/widget.manifest";
import { widgetManifest as counterWidgetManifest } from "./templates/counter_widget/widget.manifest";

let loaded = false;

const TEMPLATE_MANIFESTS = [
    apiWidgetManifest,
    textWidgetManifest,
    counterWidgetManifest,
];

export function templateLoader(): void {
    if (loaded) return;

    for (const manifest of TEMPLATE_MANIFESTS) {
        try {
            // Local Static Map
            registerTemplateManifest(manifest);

            // Reactive Zustand Store (for runtime lookup)
            useWidgetStore.getState().addManifestToRegistry(manifest);

            if (process.env.NODE_ENV === "development") {
                console.debug(`[TemplateLoader] Registered builder template: ${manifest.id}`);
            }
        } catch (err) {
            console.error(`[TemplateLoader] Failed to register template "${manifest.id}":`, err);
        }
    }

    loaded = true;
}

export function _resetTemplateLoader(): void {
    loaded = false;
}
