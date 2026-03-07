import { useState, useMemo, lazy, Suspense, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetManifest, WidgetComponentProps } from "@/widgets/types";
import type { WidgetInstance, WidgetType } from "@/types/widgetInstance";
import { generateWidgetId } from "@/widgets/uuidv7";
import { SchemaForm } from "./SchemaForm";
import { createClient } from "@/lib/supabase/client";
import { useWidgetStore } from "@/store/useWidgetStore";
import { runtimeLoader, _resetRuntimeLoader } from "@/widgets/runtimeLoader";
import { templateLoader, _resetTemplateLoader } from "@/widgets/templateLoader";
import { getTemplateManifest, widgetTemplateRegistry } from "@/widgets/registry";
import { PortalSelect } from "@/components/ui/PortalSelect";
import { fetchData } from "@/widgets/utils/fetchData";
import { widgetPresets, WidgetPreset } from "@/widgets/presets/widgetPresets";
import WidgetCard from "../WidgetCard";
import { LayoutGrid, Sparkles, Terminal, Play, AlertCircle } from "lucide-react";
import { JsonInspector } from "./JsonInspector";

const DEFAULT_W = 360;
const DEFAULT_H = 260;

// Cache for lazy preview components
const previewCache = new Map<string, React.LazyExoticComponent<any>>();

function getPreviewComponent(manifest: WidgetManifest) {
    if (!previewCache.has(manifest.id)) {
        previewCache.set(manifest.id, lazy(manifest.component));
    }
    return previewCache.get(manifest.id)!;
}

interface WidgetBuilderProps {
    onClose?: () => void;
}

export function WidgetBuilder({ onClose }: WidgetBuilderProps) {
    const [selectedType, setSelectedType] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [created, setCreated] = useState(false);
    const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

    // Response Inspector State
    const [inspectorLoading, setInspectorLoading] = useState(false);
    const [inspectorResult, setInspectorResult] = useState<any>(null);
    const [inspectorError, setInspectorError] = useState<string | null>(null);
    const [inspectorCooldown, setInspectorCooldown] = useState(0);

    const cooldownTimerRef = useRef<any>(null);

    const registerExternalWidget = useWidgetStore((s) => s.registerExternalWidget);
    const layout = useWidgetStore((s) => s.layout);

    // Ensure templates are loaded
    useState(() => {
        templateLoader();
    });

    useEffect(() => {
        if (inspectorCooldown > 0) {
            cooldownTimerRef.current = setTimeout(() => {
                setInspectorCooldown(c => Math.max(0, c - 1000));
            }, 1000);
        }
        return () => clearTimeout(cooldownTimerRef.current);
    }, [inspectorCooldown]);

    const manifests = useMemo<WidgetManifest[]>(
        () => Array.from(widgetTemplateRegistry.values()).sort((a, b) => a.name.localeCompare(b.name)),
        []
    );

    const selectedManifest = selectedType ? getTemplateManifest(selectedType) : null;

    const handleApplyPreset = (preset: WidgetPreset) => {
        setSelectedType(preset.template);
        const manifest = getTemplateManifest(preset.template);
        setPreviewValues({
            ...(manifest?.defaultConfig ?? {}),
            ...preset.config
        });
        setCreateError(null);
        setInspectorResult(null);
    };

    const handleTypeChange = (val: string) => {
        setSelectedType(val);
        const manifest = getTemplateManifest(val);
        setPreviewValues(manifest?.defaultConfig ?? {});
        setCreateError(null);
        setInspectorResult(null);
    };

    const handleRunInspector = async () => {
        if (inspectorCooldown > 0 || !previewValues.url) return;

        setInspectorLoading(true);
        setInspectorError(null);
        setInspectorCooldown(2000);

        try {
            const data = await fetchData({
                url: previewValues.url as string,
                method: (previewValues.method as string) || "GET",
                headers: previewValues.headers as string,
                body: previewValues.body as string
            });
            setInspectorResult(data);
        } catch (err: any) {
            setInspectorError(err.message || "Fetch failed");
        } finally {
            setInspectorLoading(false);
        }
    };

    const handleCreate = async (formValues: Record<string, unknown>) => {
        if (!selectedManifest) return;
        setIsSubmitting(true);
        setCreateError(null);

        const widgetId = generateWidgetId();
        const now = Date.now();
        const index = layout.length;
        const defaultX = 20 + (index % 2) * 420;
        const defaultY = 20 + Math.floor(index / 2) * 300;

        const inst: WidgetInstance = {
            instanceId: widgetId,
            type: selectedManifest.id as WidgetType,
            title: (formValues.title as string) || selectedManifest.name,
            enabled: true,
            createdAt: now,
            updatedAt: now,
            config: formValues,
            layout: { x: defaultX, y: defaultY, w: DEFAULT_W, h: DEFAULT_H },
        };

        try {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;

            if (userId) {
                const { error: dbError } = await supabase.from("widgets").insert({
                    id: widgetId,
                    user_id: userId,
                    type: selectedManifest.id,
                    version: 1,
                    title: inst.title,
                    enabled: true,
                    is_locked: false,
                    is_collapsed: false,
                    z_index: layout.length + 1,
                    layout_x: defaultX,
                    layout_y: defaultY,
                    layout_w: DEFAULT_W,
                    layout_h: DEFAULT_H,
                    config: formValues,
                    data: {},
                });

                if (dbError) {
                    console.error("[WidgetBuilder] Supabase insert error:", dbError.message);
                    setCreateError(`Sync warning: ${dbError.message}. Widget added locally only.`);
                }
            }

            registerExternalWidget(inst);
            setCreated(true);
            setTimeout(() => onClose?.(), 800);
        } catch (err) {
            console.error("[WidgetBuilder] Unexpected error:", err);
            setCreateError("Something went wrong creating the widget. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const PreviewComponent = (selectedManifest ? getPreviewComponent(selectedManifest) : null) as any;

    return (
        <div className="flex flex-col gap-8 p-8 w-full max-w-[1280px] mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
                        Widget Designer
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)] tracking-wider uppercase opacity-60">
                        Craft Your Perfect Dashboard Experience
                    </p>
                </div>
                {onClose && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                _resetRuntimeLoader();
                                _resetTemplateLoader();
                                runtimeLoader();
                                templateLoader();
                            }}
                            className="bg-white/5 border border-white/10 hover:border-white/20 text-[var(--color-text-muted)] hover:text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer font-bold"
                        >
                            Sync Engine
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer shadow-lg"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12 items-start">
                {/* Left: Configuration Form */}
                <div className="flex flex-col gap-8">
                    {/* Presets Library */}
                    <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={14} className="text-amber-400" />
                            <label className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">
                                Quick Start Presets
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {widgetPresets.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleApplyPreset(preset)}
                                    className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/10 text-left transition-all group/preset"
                                >
                                    <div className="text-[11px] font-bold text-white/90 group-hover/preset:text-white">{preset.name}</div>
                                    <div className="text-[9px] text-white/30 truncate">{preset.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Widget Selection */}
                    <div className="flex flex-col gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl">
                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
                            Template Catalog
                        </label>
                        <PortalSelect
                            value={selectedType}
                            onChange={handleTypeChange}
                            placeholder="Select a template base..."
                            options={manifests.map(m => ({ label: m.name, value: m.id }))}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedManifest ? (
                            <motion.div
                                key={selectedType}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col gap-8"
                            >
                                <div className="flex flex-col gap-6 p-8 rounded-3xl bg-[var(--color-bg-elevated)]/40 border border-white/5 shadow-2xl backdrop-blur-3xl">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-lg font-bold text-white">
                                            Configuration
                                        </h3>
                                        <p className="text-xs text-white/40 leading-relaxed">
                                            {selectedManifest.description || "Tune the visual and functional parameters of your widget."}
                                        </p>
                                    </div>



                                    <div className="h-px bg-white/5" />
                                    <SchemaForm
                                        schema={selectedManifest.configSchema ?? {}}
                                        defaultValues={previewValues}
                                        onChange={setPreviewValues}
                                        onValidatedSubmit={handleCreate}
                                        submitLabel={`Deploy to Canvas`}
                                        isSubmitting={isSubmitting}
                                        onCancel={onClose}
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01]"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 shadow-inner">
                                    <LayoutGrid size={32} />
                                </div>
                                <p className="text-sm text-white/30 text-center font-medium max-w-[240px] leading-relaxed">
                                    Select a widget template from the catalog above to start designing.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Live Preview */}
                <div className="lg:sticky lg:top-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                Live Interactive Preview
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/30 uppercase">
                                Real-time Sync
                            </div>
                        </div>
                    </div>

                    <div className="relative group/preview min-h-[500px] rounded-[2.5rem] bg-[#0A0A0F] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex items-center justify-center p-12 overflow-hidden">
                        {/* Background Ambiance */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[100px] rounded-full -mr-48 -mt-48 transition-all duration-700 group-hover/preview:opacity-20 opacity-0" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/10 blur-[100px] rounded-full -ml-48 -mb-48 transition-all duration-700 group-hover/preview:opacity-20 opacity-0" />

                        {selectedManifest && PreviewComponent ? (
                            <motion.div
                                key={selectedType}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full transition-transform duration-500 hover:scale-[1.02]"
                                style={{ width: DEFAULT_W, height: DEFAULT_H }}
                            >
                                <WidgetCard
                                    instance={{
                                        instanceId: "preview",
                                        type: selectedManifest.id as WidgetType,
                                        title: (previewValues.title as string) || selectedManifest.name,
                                        enabled: true,
                                        createdAt: Date.now(),
                                        updatedAt: Date.now(),
                                        config: previewValues,
                                        layout: { x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H }
                                    }}
                                    definition={{
                                        type: selectedManifest.id as WidgetType,
                                        defaultTitle: selectedManifest.name,
                                        icon: LayoutGrid,
                                        component: () => null,
                                        allowMultiple: true,
                                        defaultConfig: {}
                                    }}
                                >
                                    <Suspense fallback={
                                        <div className="flex items-center justify-center h-full">
                                            <div className="w-8 h-8 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin" />
                                        </div>
                                    }>
                                        <PreviewComponent previewConfig={previewValues} />
                                    </Suspense>
                                </WidgetCard>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 opacity-10 scale-150">
                                <LayoutGrid size={64} strokeWidth={1} />
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {created && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-6 rounded-3xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-bold shadow-2xl backdrop-blur-md"
                            >
                                <span className="mr-2">✨</span> Widget Successfully Deployed
                            </motion.div>
                        )}
                        {createError && !created && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-bold shadow-2xl backdrop-blur-md"
                            >
                                <span className="mr-2">⚠️</span> {createError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Response Inspector Area */}
                    {selectedType === "api-widget" && (
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Terminal size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Response Deep Inspector</span>
                                </div>
                                <button
                                    onClick={handleRunInspector}
                                    disabled={inspectorLoading || inspectorCooldown > 0 || !previewValues.url}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-95"
                                >
                                    {inspectorLoading ? (
                                        <span className="w-3 h-3 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                                    ) : (
                                        <Play size={10} fill="currentColor" />
                                    )}
                                    {inspectorCooldown > 0 ? `Retry in ${Math.ceil(inspectorCooldown / 1000)}s` : "Live Fetch Test"}
                                </button>
                            </div>

                            {inspectorError && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs">
                                    <AlertCircle size={16} />
                                    <span>{inspectorError}</span>
                                </div>
                            )}

                            {inspectorResult && !inspectorError && (
                                <JsonInspector
                                    data={inspectorResult}
                                    onPathSelect={(path: string) => {
                                        setPreviewValues(prev => ({ ...prev, field: path }));
                                        // Optional toast or feedback
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

