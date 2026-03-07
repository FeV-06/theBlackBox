export function safeParseJSON(input?: string) {
    if (!input) return undefined;
    try {
        return JSON.parse(input);
    } catch (e) {
        return undefined;
    }
}

export interface FetchOptions {
    url: string;
    method?: string;
    headers?: string;
    body?: string;
    signal?: AbortSignal;
}

export async function fetchData({ url, method = "GET", headers, body, signal }: FetchOptions) {
    if (!url) throw new Error("No URL provided");

    const headersObj = (safeParseJSON(headers) || {}) as any;

    const fetchOptions: RequestInit = {
        method,
        signal,
        headers: {
            "Accept": "application/json",
            ...headersObj
        },
    };

    if (method === "POST" && body) {
        fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
        if (!headersObj["Content-Type"]) {
            (fetchOptions.headers as any)["Content-Type"] = "application/json";
        }
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        // Try to get error message from response body if possible
        try {
            const errData = await response.json();
            throw new Error(errData.message || `HTTP ${response.status}`);
        } catch {
            throw new Error(`HTTP ${response.status}`);
        }
    }

    try {
        const json = await response.json();
        return json;
    } catch (e) {
        throw new Error("Invalid JSON response from server");
    }
}

export function getNestedField(obj: any, path: string) {
    if (!path || !obj) return undefined;
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}
