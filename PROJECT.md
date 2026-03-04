# 🤖 TheBlackBox Project Context (For AI Agents)

> **Purpose:** This document is designed to give any AI or Agent immediate, high-level context of "TheBlackBox" codebase architecture, patterns, and principles.

---

## 1. What is TheBlackBox?

**TheBlackBox** is a localized, highly-customizable personal productivity dashboard designed as a premium, glassy dark-themed single-page web application. It functions as a centralized "control panel" that aggregates a user's workflow: drag-and-drop widgets, Kanban project management, focus timers (Pomodoro), and direct Google Calendar/Gmail integrations.

**Core Philosophy:**
- **Zero-Latency Feel:** Almost all state is handled client-side via Zustand and synced aggressively to `localStorage`. Only external API calls (e.g., Google OAuth, Calendar, GitHub) are async.
- **Frontend-First Security:** The frontend **NEVER** handles, stores, or sees OAuth tokens. All authentication tokens are managed exclusively by the Next.js server via `HttpOnly`, `Secure`, `SameSite=Lax` cookies.

---

## 2. Tech Stack & Versions

- **Framework:** Next.js 16.1.6 (App Router exclusively, no Pages router).
- **Language:** TypeScript 5.9.
- **UI & Styling:** React 19, Tailwind CSS 4, Framer Motion 12.
- **State Management:** Zustand 5.
- **Component Primitives:** Radix UI (`@radix-ui/*`).
- **Icons:** Lucide React (`lucide-react`).
- **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`.
- **Date/Time:** `date-fns` v4 + `date-fns-tz` v3 (Timezone safety is critical!).

---

## 3. Architecture & Key Patterns

### State Management (Zustand)
- Stores are located in `src/store/`.
- **Persistence Pattern:** Every store that persists data uses Zustand's `persist` middleware configured with `localStorage`.
- **Naming Convention:** All `localStorage` keys **must** be prefixed with `tbb-` (e.g., `tbb-widgets`, `tbb-projects`, `tbb-focus`).
- Do not attempt to add Supabase, Firebase, or complex backend DB logic without user request; the app relies on `localStorage` as the primary DB.

### Widget System
- **Location:** `src/components/widgets/`.
- The dashboard is built on a 10+ widget system (Todo, GitHub, Calendar, Weather, custom APIs, etc.).
- **Layout:** Uses a highly customized CSS Grid powered by `dnd-kit`. Widgets have defined span sizes and can be reordered by the user.
- **Mobile Paradigm:** On small screens, the grid collapses into a `MobileLaunchpad.tsx` / `MobileWidgetDeck.tsx` (stack-based gestural interface).

### API & Security Model
- **Location:** `src/app/api/`.
- **Authentication:** `src/app/api/auth/google/`. Uses a popup-based OAuth flow. The callback sets the `HttpOnly` cookies.
- **Google Data:** `src/app/api/google/`. These endpoints read the `HttpOnly` cookies, attach the credentials to the `googleapis` client, and proxy the data back to the frontend.
- **COOP Headers:** `next.config.ts` has specific `Cross-Origin-Opener-Policy` headers to ensure the OAuth popups can communicate with the main window securely.

### Styling & CSS
- Uses standard modern Tailwind CSS.
- Highly dependent on custom CSS properties configured in `globals.css` (e.g., `--background`, `--foreground`).
- Heavy use of glassmorphism UI traits (`backdrop-blur`, semi-transparent backgrounds).
- `framer-motion` handles component mounting/unmounting animations (`AnimatePresence`).

---

## 4. Where to Find What

- `src/app/page.tsx`: Entry point. It quickly delegates to the `DashboardShell`.
- `src/components/layout/DashboardShell.tsx`: The main responsive wrap containing the Sidebar/MobileNav and the content area.
- `src/components/tabs/`: The primary views (Dashboard, Projects, Focus, Calendar, Settings). Switchable via Sidebar or `CommandPalette.tsx`.
- `src/components/widgets/`: Every individual widget component lives here.
- `src/hooks/`: Reusable logic like `useMediaQuery`, `useIsMounted`, and `useAccentColor`.
- `src/lib/`: Server utilities (`googleSession.ts`, `googleOAuth.ts`), Date formatters (`calendarTime.ts`), Insight Engine logic, and generic helpers.
- `src/store/`: The Zustand state orchestrators.
- `src/types/`: Centralized TypeScript interfaces (crucial for ensuring widget configuration unions are strict).

---

## 5. Agent Instructions for Modifying Code

1. **Type Safety:** Always import interfaces from `src/types/`. Avoid inline `any`.
2. **Client Components:** Most UI components require `"use client"` at the top since they rely on Zustand hooks or interactive features.
3. **Tailwind Processing:** Stick to Tailwind class strings; prefer standard utility classes over bespoke inline styles.
4. **Dates:** Always use `dateUtils.ts` or `date-fns-tz` to handle times. **Never** trust raw JS `Date` objects around Google Calendar functions, as UTC shifting corrupts local time rendering.
