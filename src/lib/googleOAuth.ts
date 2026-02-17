import { google } from "googleapis";

const SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.readonly",
];

/**
 * Create a configured OAuth2 client.
 * Optionally provide tokens to set credentials.
 */
export function getOAuthClient(tokens?: {
    access_token?: string;
    refresh_token?: string;
}) {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    if (tokens) {
        client.setCredentials(tokens);
    }
    return client;
}

/**
 * Generate the Google OAuth consent URL.
 */
export function getAuthUrl() {
    const client = getOAuthClient();
    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
    });
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string) {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    return tokens;
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string) {
    const client = getOAuthClient({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return credentials;
}
