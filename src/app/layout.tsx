import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CommandPalette from "@/components/CommandPalette";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#7C5CFF",
};

export const metadata: Metadata = {
    title: "TheBlackBox",
    description: "Personal Productivity Dashboard",
    manifest: "/manifest.json",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body suppressHydrationWarning>
                <CommandPalette />
                {children}
            </body>
        </html>
    );
}
