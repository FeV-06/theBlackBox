import { useState } from "react";
import { WidgetBuilder } from "@/components/widgets/builder/WidgetBuilder";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Monitor, Smartphone, Upload, X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTemplateManifest } from "@/widgets/registry";
import { useWidgetStore } from "@/store/useWidgetStore";
import { generateWidgetId } from "@/widgets/uuidv7";
import { createClient } from "@/lib/supabase/client";
import { validateWidgetConfig } from "@/widgets/utils/schemaValidator";

/**
 * WidgetsTab
 * 
 * A dedicated tab for creating and managing custom widgets.
 */
export default function WidgetsTab() {
    const isMobile = useMediaQuery("(max-width: 1024px)");
    const [importOpen, setImportOpen] = useState(false);
    const [importJson, setImportJson] = useState("");
    const [importError, setImportError] = useState<string | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);

    const registerExternalWidget = useWidgetStore((s) => s.registerExternalWidget);
    const layout = useWidgetStore((s) => s.layout);

    const handleImport = async () => {
        setImportError(null);
        setImportLoading(true);

        try {
            const data = JSON.parse(importJson);
            // 1. Structure Check
            if (!data.type || !data.config) {
                throw new Error("Missing 'type' or 'config' in JSON payload.");
            }

            const manifest = getTemplateManifest(data.type);
            if (!manifest) {
                throw new Error(`Template '${data.type}' not found.`);
            }

            // 2. Schema Validation
            const validation = validateWidgetConfig(data.config, manifest.configSchema ?? {});
            if (!validation.valid) {
                throw new Error(`Configuration Error: ${validation.errors.join(" ")}`);
            }

            const widgetId = generateWidgetId();
            const now = Date.now();
            const index = layout.length;
            const defaultX = 20 + (index % 2) * 420;
            const defaultY = 20 + Math.floor(index / 2) * 300;

            const inst = {
                instanceId: widgetId,
                type: data.type,
                title: data.meta?.name || manifest.name,
                enabled: true,
                createdAt: now,
                updatedAt: now,
                config: data.config,
                layout: { x: defaultX, y: defaultY, w: 360, h: 260 },
            };

            // Attempt Supabase sync
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;

            if (userId) {
                await supabase.from("widgets").insert({
                    id: widgetId,
                    user_id: userId,
                    type: data.type,
                    version: data.version || 1,
                    title: inst.title,
                    enabled: true,
                    config: data.config,
                    layout_x: defaultX,
                    layout_y: defaultY,
                    layout_w: 360,
                    layout_h: 260,
                });
            }

            registerExternalWidget(inst as any);
            setImportSuccess(true);
            setTimeout(() => {
                setImportOpen(false);
                setImportSuccess(false);
                setImportJson("");
            }, 1000);
        } catch (err: any) {
            setImportError(err.message || "Failed to parse widget JSON.");
        } finally {
            setImportLoading(false);
        }
    };

    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center animate-fade-in group">
                <div className="relative mb-6">
                    <Monitor className="text-[var(--color-text-muted)] opacity-20" size={84} />
                    <Smartphone className="absolute -bottom-2 -right-2 text-[var(--color-accent)] animate-bounce" size={42} />
                </div>

                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                    Desktop Optimized Feature
                </h2>

                <p className="max-w-xs text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">
                    The Widget Builder requires the precision of a desktop environment to configure layouts and pixel-perfect positioning effectively.
                </p>

                <div className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                    Switch to Desktop to Build
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-8 max-w-[1280px] mx-auto animate-fade-in">
            <header className="flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-[var(--color-accent-glow)] text-[var(--color-accent)]">
                            <Monitor size={20} />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                            Widget Builder
                        </h1>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">
                        Design and configure custom widgets with our no-code editor.
                    </p>
                </div>

                <button
                    onClick={() => setImportOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all cursor-pointer font-bold text-[11px] uppercase tracking-widest"
                >
                    <Upload size={14} />
                    Import JSON
                </button>
            </header>

            <div className="glass-card overflow-hidden">
                <WidgetBuilder />
            </div>

            <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-md">
                <div className="flex items-start gap-4">
                    <div className="text-2xl mt-1">💡</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                            Pro Tip: High Precision Editing
                        </h4>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            Newly created widgets are added to your primary dashboard with default dimensions. Once created, head back to
                            the <strong className="text-[var(--color-text-primary)]">Dashboard</strong> tab to drag, snap, and resize them
                            across the infinite grid.
                        </p>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <AnimatePresence>
                {importOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0A0A0F] border border-white/10 rounded-[2.5rem] shadow-[0_50px_150px_rgba(0,0,0,1)] w-full max-w-xl p-8 flex flex-col gap-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Upload size={20} className="text-emerald-400" />
                                        Import Widget
                                    </h2>
                                    <p className="text-xs text-white/30 uppercase tracking-widest font-bold">
                                        Paste serialized JSON payload
                                    </p>
                                </div>
                                <button onClick={() => setImportOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-white/40">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative group">
                                <textarea
                                    value={importJson}
                                    onChange={(e) => setImportJson(e.target.value)}
                                    placeholder='{ "type": "api-widget", "config": { ... } }'
                                    className="w-full h-64 p-6 rounded-3xl bg-black/60 border border-white/5 font-mono text-[11px] text-emerald-400/80 outline-none focus:border-emerald-500/30 transition-all custom-scrollbar overflow-auto resize-none"
                                />
                                {importJson && (
                                    <button
                                        onClick={() => setImportJson("")}
                                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {importError && (
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{importError}</span>
                                </div>
                            )}

                            {importSuccess && (
                                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-3">
                                    <Check size={16} className="shrink-0" />
                                    <span>Widget Imported Successfully!</span>
                                </div>
                            )}

                            <button
                                onClick={handleImport}
                                disabled={!importJson || importLoading || importSuccess}
                                className="w-full py-4 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                            >
                                {importLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Initialize Instance
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
