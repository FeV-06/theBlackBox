import type { WidgetConfigSchema, SchemaField } from "../types";

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validates a widget configuration object against its defined schema.
 * Rejects malformed types, missing required fields, and unexpected structures.
 */
export function validateWidgetConfig(config: Record<string, any>, schema: WidgetConfigSchema): ValidationResult {
    const errors: string[] = [];

    // 1. Structure Check
    if (!config || typeof config !== "object") {
        return { valid: false, errors: ["Configuration must be a valid JSON object."] };
    }

    // 2. Schema Key Iteration
    for (const [key, fieldDef] of Object.entries(schema)) {
        const value = config[key];
        const isFieldObject = typeof fieldDef === "object" && fieldDef !== null;
        const type = isFieldObject ? (fieldDef as SchemaField).type : fieldDef;
        const isRequired = isFieldObject ? (fieldDef as SchemaField).required : false;

        // Check Required
        if (isRequired && (value === undefined || value === null || value === "")) {
            errors.push(`Field '${key}' is required.`);
            continue;
        }

        // Check Type if value exists
        if (value !== undefined && value !== null) {
            switch (type) {
                case "string":
                case "textarea":
                case "url":
                case "color":
                case "select":
                    if (typeof value !== "string") {
                        errors.push(`Field '${key}' must be a string (got ${typeof value}).`);
                    }
                    break;
                case "number":
                    if (typeof value !== "number" && isNaN(Number(value))) {
                        errors.push(`Field '${key}' must be a number.`);
                    }
                    break;
                case "boolean":
                    if (typeof value !== "boolean") {
                        errors.push(`Field '${key}' must be a boolean.`);
                    }
                    break;
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
