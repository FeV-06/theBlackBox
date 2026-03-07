import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CommandPalette from "@/components/CommandPalette";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import { WidgetBootstrap } from "@/components/WidgetBootstrap";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#7C5CFF",
};

export const metadata: Metadata = {
    title: "TheBlackBox",
    description: "Personal Productivity Dashboard",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "TheBlackBox",
    },
    icons: {
        icon: [
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
            { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
        ],
        apple: [
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        ],
    },
    formatDetection: {
        telephone: false,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
                <WidgetBootstrap />
                <AuthProvider />
                <ThemeProvider />
                <CommandPalette />
                {children}
            </body>
        </html>
    );
}
