import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import ReactMarkdown from "react-markdown";
import { debounce } from "lodash";
import { iconMap } from "../shared/iconRegistry";
import type { WidgetComponentProps } from "../../types";

export default function TextWidgetComponent({ widgetId, previewConfig }: WidgetComponentProps) {
    const { config: storeConfig, updateConfig } = useWidgetConfig(widgetId);
    const config = previewConfig || storeConfig;

    const {
        content = "",
        editable = false,
        format = "plain",
        title = "Notes",
        icon = "none",
        textAlign = "left",
        fontSize = "medium",
        background = "glass",
        accentColor
    } = config as any;

    const [localContent, setLocalContent] = useState(content);
    const [isEditing, setIsEditing] = useState(false);

    // Update local state when remote config changes (if not currently focused)
    useEffect(() => {
        if (!isEditing) {
            setLocalContent(content);
        }
    }, [content, isEditing]);

    const debouncedUpdate = useMemo(
        () => debounce((val: string) => {
            if (!previewConfig) {
                updateConfig({ content: val });
            }
        }, 500),
        [updateConfig, previewConfig]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setLocalContent(val);
        debouncedUpdate(val);
    };

    const bgClass = {
        glass: "bg-white/[0.03] backdrop-blur-md border-white/10",
        solid: "bg-[var(--color-bg-card)] border-[var(--color-border)]",
        transparent: "bg-transparent border-transparent"
    }[background as "glass" | "solid" | "transparent"] || "bg-white/[0.03]";

    const fontClass = {
        small: "text-xs",
        medium: "text-sm",
        large: "text-lg"
    }[fontSize as "small" | "medium" | "large"] || "text-sm";

    const alignClass = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
    }[textAlign as "left" | "center" | "right"] || "text-left";

    const Icon = icon !== "none" ? iconMap[icon] : null;

    return (
        <div className="flex flex-col h-full w-full p-4 overflow-hidden relative group">
            <div className="flex items-center gap-1.5 opacity-50 mb-2">
                {Icon && <Icon size={12} style={{ color: accentColor || "var(--color-text-primary)" }} />}
                {title && (
                    <h3 className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--color-text-primary)" }}>
                        {title}
                    </h3>
                )}
            </div>

            <div className={`flex-1 overflow-auto rounded-xl p-3 border transition-all duration-300 ${bgClass} ${fontClass} ${alignClass}`}>
                {editable && (isEditing || format === "plain") ? (
                    <textarea
                        value={localContent}
                        onChange={handleChange}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                        placeholder="Type notes here..."
                        className="w-full h-full bg-transparent border-none outline-none resize-none leading-relaxed custom-scrollbar p-0 m-0"
                        style={{ color: accentColor || "inherit" }}
                    />
                ) : (
                    <div
                        onClick={() => editable && setIsEditing(true)}
                        className={`markdown-body leading-relaxed max-w-full overflow-hidden ${editable ? 'cursor-text hover:bg-white/[0.02]' : ''}`}
                        style={{
                            color: accentColor || "var(--color-text-primary)",
                            wordBreak: "break-word"
                        }}
                    >
                        {format === "markdown" ? (
                            <ReactMarkdown>{localContent || "*No content*"}</ReactMarkdown>
                        ) : (
                            <div className="whitespace-pre-wrap">{localContent || "*No content*"}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

