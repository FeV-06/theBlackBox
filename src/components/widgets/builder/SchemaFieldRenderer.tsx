"use client";

import type { SchemaField, SchemaFieldType, WidgetConfigSchema } from "@/widgets/types";
import { PortalSelect } from "@/components/ui/PortalSelect";

interface FieldRendererProps {
    fieldKey: string;
    field: SchemaFieldType | SchemaField;
    value: unknown;
    onChange: (key: string, value: unknown) => void;
    error?: string;
}

/**
 * Maps a single configSchema field to the appropriate UI input.
 *
 * Supported types:
 *   string   → text input
 *   number   → number input
 *   boolean  → toggle checkbox
 *   select   → dropdown
 *   textarea → multiline text
 *   url      → url input
 */
export function SchemaFieldRenderer({ fieldKey, field, value, onChange, error }: FieldRendererProps) {
    const spec: SchemaField = typeof field === "string" ? { type: field } : field;
    const { type, label, placeholder, options = [], required } = spec;

    const displayLabel = label ?? fieldKey;
    const id = `widget-field-${fieldKey}`;

    return (
        <div className="flex flex-col gap-2 group/field">
            {type !== "boolean" && (
                <label
                    htmlFor={id}
                    className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1"
                >
                    {displayLabel}
                    {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {(type === "string" || type === "url") && (
                    <input
                        id={id}
                        type={type === "url" ? "url" : "text"}
                        value={String(value ?? "")}
                        placeholder={placeholder}
                        onChange={(e) => onChange(fieldKey, e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-accent-glow)] ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
                            }`}
                    />
                )}

                {type === "number" && (
                    <input
                        id={id}
                        type="number"
                        value={String(value ?? "")}
                        placeholder={placeholder}
                        onChange={(e) => onChange(fieldKey, e.target.valueAsNumber || 0)}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-accent-glow)] ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
                            }`}
                    />
                )}

                {type === "textarea" && (
                    <textarea
                        id={id}
                        value={String(value ?? "")}
                        placeholder={placeholder}
                        rows={3}
                        onChange={(e) => onChange(fieldKey, e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-card)] text-[var(--color-text-primary)] text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-accent-glow)] resize-none ${error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
                            }`}
                    />
                )}

                {type === "select" && (
                    <PortalSelect
                        value={String(value ?? (options.length > 0 ? options[0].value : ""))}
                        onChange={(val) => onChange(fieldKey, val)}
                        options={options}
                        placeholder="Select value..."
                    />
                )}

                {type === "color" && (
                    <div className="flex items-center gap-3 w-full px-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] group-focus-within/field:ring-2 group-focus-within/field:ring-[var(--color-accent-glow)] transition-all">
                        <input
                            id={id}
                            type="color"
                            value={String(value ?? "#6366f1")}
                            onChange={(e) => onChange(fieldKey, e.target.value)}
                            className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer overflow-hidden p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                        />
                        <input
                            type="text"
                            value={String(value ?? "#6366f1")}
                            onChange={(e) => onChange(fieldKey, e.target.value)}
                            className="bg-transparent text-sm font-mono text-[var(--color-text-primary)] outline-none w-full"
                        />
                    </div>
                )}
            </div>

            {type === "boolean" && (
                <label
                    htmlFor={id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] cursor-pointer transition-all hover:border-[var(--color-border-hover)]"
                >
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {displayLabel}
                        </span>
                        {required && <span className="text-[10px] text-[var(--color-danger)]">Required</span>}
                    </div>

                    <div
                        onClick={() => onChange(fieldKey, !value)}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${value ? 'bg-[var(--color-accent)]' : 'bg-white/10'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? 'left-6' : 'left-1'
                                }`}
                        />
                    </div>
                </label>
            )}

            {error && (
                <p className="text-[10px] text-[var(--color-danger)] font-medium ml-1 animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}
