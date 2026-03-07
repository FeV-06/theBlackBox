"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { widgetDebug } from "@/widgets/debug/widgetDebug";

interface Props {
    widgetId: string;
    widgetType?: string;
    onRemove?: (widgetId: string) => void;
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

/**
 * Strict, per-widget error boundary.
 * A failing widget renders a fallback with reload + remove actions.
 * It never propagates the error up to crash the dashboard or other widgets.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: "" };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        widgetDebug.logError(this.props.widgetId, error, this.props.widgetType);
        console.error(
            `[WidgetErrorBoundary] widget="${this.props.widgetId}" type="${this.props.widgetType}"`,
            error,
            info.componentStack
        );
    }

    handleReload = (): void => {
        this.setState({ hasError: false, errorMessage: "" });
    };

    handleRemove = (): void => {
        this.props.onRemove?.(this.props.widgetId);
    };

    render(): ReactNode {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div
                role="alert"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "1.5rem",
                    height: "100%",
                    color: "var(--color-danger, #ef4444)",
                    textAlign: "center",
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, margin: 0 }}>Widget Failed</p>
                {process.env.NODE_ENV === "development" && (
                    <p
                        style={{
                            fontSize: "0.65rem",
                            opacity: 0.7,
                            maxWidth: "240px",
                            wordBreak: "break-word",
                            margin: 0,
                        }}
                    >
                        {this.state.errorMessage}
                    </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button
                        onClick={this.handleReload}
                        style={{
                            fontSize: "0.7rem",
                            padding: "4px 10px",
                            border: "1px solid currentColor",
                            borderRadius: "4px",
                            background: "transparent",
                            color: "inherit",
                            cursor: "pointer",
                        }}
                    >
                        Reload
                    </button>
                    {this.props.onRemove && (
                        <button
                            onClick={this.handleRemove}
                            style={{
                                fontSize: "0.7rem",
                                padding: "4px 10px",
                                border: "1px solid transparent",
                                borderRadius: "4px",
                                background: "transparent",
                                color: "var(--color-text-muted, #6b7280)",
                                cursor: "pointer",
                            }}
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        );
    }
}
