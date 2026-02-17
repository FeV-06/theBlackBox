import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getOAuthClient } from "@/lib/googleOAuth";
import { setGoogleCookies } from "@/lib/googleSession";

/**
 * GET /api/auth/google/callback?code=...
 * Exchanges the authorization code for tokens, sets HttpOnly cookies,
 * and returns an HTML page that signals success to the opener and closes.
 */
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
        return new NextResponse("Missing authorization code", { status: 400 });
    }

    try {
        const tokens = await exchangeCodeForTokens(code);

        // Fetch user profile
        const client = getOAuthClient({
            access_token: tokens.access_token ?? undefined,
        });
        const oauth2 = await import("googleapis").then(
            (m) => m.google.oauth2({ version: "v2", auth: client })
        );
        const { data: userInfo } = await oauth2.userinfo.get();
        const profile = {
            name: userInfo.name ?? "",
            email: userInfo.email ?? "",
            picture: userInfo.picture ?? "",
        };

        // Build HTML response that posts success to opener and closes
        const html = `<!DOCTYPE html>
<html><head><title>TheBlackBox — Connected</title></head>
<body style="background:#0a0a0f;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Connected! This window will close automatically...</p>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: "tbb-google-auth", success: true }, "*");
  }
  setTimeout(() => window.close(), 500);
</script>
</body></html>`;

        const res = new NextResponse(html, {
            status: 200,
            headers: { "Content-Type": "text/html" },
        });

        // Set secure HttpOnly cookies (tokens never reach frontend JS)
        setGoogleCookies(res, tokens, profile);
        return res;
    } catch (error) {
        console.error("[OAuth Callback] Error:", error);
        const errorHtml = `<!DOCTYPE html>
<html><head><title>TheBlackBox — Error</title></head>
<body style="background:#0a0a0f;color:#f87171;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Authentication failed. Please close this window and try again.</p>
</body></html>`;
        return new NextResponse(errorHtml, {
            status: 500,
            headers: { "Content-Type": "text/html" },
        });
    }
}
