import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WidgetConfigSchema, SchemaField, SchemaFieldType } from "@/widgets/types";
import { SchemaFieldRenderer } from "./SchemaFieldRenderer";
import { AlertCircle } from "lucide-react";

interface SchemaFormProps {
    schema: WidgetConfigSchema;
    defaultValues?: Record<string, unknown>;
    onChange?: (values: Record<string, unknown>) => void;
    onValidatedSubmit: (values: Record<string, unknown>) => void;
    submitLabel?: string;
    isSubmitting?: boolean;
    onCancel?: () => void;
}

type ValidationErrors = Record<string, string>;

function resolveSpec(field: SchemaFieldType | SchemaField): SchemaField {
    return typeof field === "string" ? { type: field } : field;
}

function validateValues(
    schema: WidgetConfigSchema,
    values: Record<string, unknown>
): ValidationErrors {
    const errors: ValidationErrors = {};
    for (const [key, field] of Object.entries(schema)) {
        const spec = resolveSpec(field);
        const value = values[key];

        if (spec.required && (value === undefined || value === null || value === "")) {
            errors[key] = `${spec.label ?? key} is required.`;
            continue;
        }

        if (spec.type === "number" && value !== undefined && value !== "" && isNaN(Number(value))) {
            errors[key] = `${spec.label ?? key} must be a valid number.`;
            continue;
        }

        if (spec.type === "select" && spec.options && value !== undefined) {
            const allowed = spec.options.map((o) => o.value);
            if (!allowed.includes(String(value))) {
                errors[key] = `${spec.label ?? key} must be one of: ${allowed.join(", ")}.`;
            }
        }
    }
    return errors;
}

/**
 * SchemaForm generates a dynamic form from a widget manifest's configSchema.
 * Now categorized with tabs for better organization.
 */
export function SchemaForm({
    schema,
    defaultValues = {},
    onChange,
    onValidatedSubmit,
    submitLabel = "Create Widget",
    isSubmitting = false,
    onCancel,
}: SchemaFormProps) {
    const schemaKeys = Object.keys(schema);

    // Group fields by category
    const categories = useMemo(() => {
        const groups: Record<string, string[]> = {};
        for (const [key, field] of Object.entries(schema)) {
            const spec = resolveSpec(field);
            const cat = spec.category || "general";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(key);
        }
        return groups;
    }, [schema]);

    const categoryList = Object.keys(categories);
    const [activeTab, setActiveTab] = useState(categoryList[0] || "general");

    // Build initial state
    const initialValues: Record<string, unknown> = useMemo(() => {
        const init: Record<string, unknown> = {};
        for (const key of schemaKeys) {
            const spec = resolveSpec(schema[key]);
            if (defaultValues[key] !== undefined) {
                init[key] = defaultValues[key];
            } else if (spec.type === "boolean") {
                init[key] = false;
            } else if (spec.type === "number") {
                init[key] = 0;
            } else {
                init[key] = "";
            }
        }
        return init;
    }, [schema, schemaKeys, defaultValues]);

    const [values, setValues] = useState<Record<string, unknown>>(initialValues);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const handleChange = useCallback((key: string, value: unknown) => {
        setValues((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const nextErrors = { ...prev };
            delete nextErrors[key];
            return nextErrors;
        });
    }, []);

    // Sync external defaultValues changes (e.g. from picker)
    useEffect(() => {
        if (defaultValues && Object.keys(defaultValues).length > 0) {
            setValues(v => {
                const next = { ...v };
                let changed = false;
                for (const [key, val] of Object.entries(defaultValues)) {
                    if (next[key] !== val) {
                        next[key] = val;
                        changed = true;
                    }
                }
                return changed ? next : v;
            });
        }
    }, [defaultValues]);

    useEffect(() => {
        if (onChange) {
            onChange(values);
        }
    }, [values, onChange]);

    const handleSubmit = () => {
        const validationErrors = validateValues(schema, values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // Switch to the first category that has an error
            const firstErrorKey = Object.keys(validationErrors)[0];
            const firstErrorCat = resolveSpec(schema[firstErrorKey]).category || "general";
            setActiveTab(firstErrorCat);
            return;
        }
        onValidatedSubmit(values);
    };

    // Calculate errors per category for tab indicators
    const categoryErrors = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const [key, error] of Object.entries(errors)) {
            if (error) {
                const cat = resolveSpec(schema[key]).category || "general";
                counts[cat] = (counts[cat] || 0) + 1;
            }
        }
        return counts;
    }, [errors, schema]);

    return (
        <div className="flex flex-col gap-6">
            {/* Tab Navigation */}
            {categoryList.length > 1 && (
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
                    {categoryList.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`
                                relative flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                                flex items-center justify-center gap-2 cursor-pointer
                                ${activeTab === cat ? 'text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}
                            `}
                        >
                            {activeTab === cat && (
                                <motion.div
                                    layoutId="active-tab-bg"
                                    className="absolute inset-0 bg-white/10 rounded-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-10">{cat}</span>
                            {categoryErrors[cat] > 0 && (
                                <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                                    {categoryErrors[cat]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <div className="min-h-[200px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-5"
                    >
                        {categories[activeTab]?.map((key) => (
                            <SchemaFieldRenderer
                                key={key}
                                fieldKey={key}
                                field={schema[key]}
                                value={values[key]}
                                onChange={handleChange}
                                error={errors[key]}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-white/[0.05]">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/40 hover:text-white text-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                        Discard
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-[2] px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer ${isSubmitting
                        ? 'bg-white/5 text-white/20'
                        : 'bg-[var(--color-accent)] text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--color-accent-glow)]'
                        }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Deploying...
                        </span>
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </div>
    );
}
