# PROJECT\_STATUS.md — TheBlackBox

> Last updated: 2026-02-18

---

## 1. Project Overview

**TheBlackBox** is a personal productivity dashboard built as a premium, glassy dark-themed single-page web application. It consolidates daily productivity tools — todo lists, habit tracking, project management, focus timer, calendar, and custom API widgets — into a single control-panel interface.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| UI | React 19, Tailwind CSS 4, Framer Motion 12 |
| State | Zustand 5 (localStorage persistence) |
| Auth | Google OAuth 2.0 (HttpOnly Secure cookies) |
| APIs | Google Calendar API, Gmail API (via `googleapis` v171) |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Date Handling | `date-fns` 4 + `date-fns-tz` 3 |
| Icons | `lucide-react` 0.564 |

### Deployment Target

- **Vercel** or **Netlify** (static export + serverless API routes)
- COOP header configured in `next.config.ts` for OAuth popup compatibility

---

## 2. Current Features Implemented

### ✅ Dashboard Widget System
- 10 drag-and-drop widgets on the Dashboard tab
- Widgets can be enabled/disabled from Settings
- Widget ordering persisted in localStorage
- Stable `WidgetId` union type prevents reorder bugs

### ✅ Widgets Available

| Widget | File | Description |
|---|---|---|
| Quote & Clock | `QuoteClockWidget.tsx` | Rotating motivational/anime/tech quotes + live clock |
| Todo List | `TodoWidget.tsx` | Add, check, delete tasks with progress bar |
| Habit Tracker | `HabitTrackerWidget.tsx` | Daily habit check-in with 7-day grid |
| GitHub Stats | `GitHubWidget.tsx` | Public repo stats (stars, forks, PRs) via GitHub API |
| Weather | `WeatherWidget.tsx` | Current weather via Open-Meteo API |
| Quick Links | `QuickLinksWidget.tsx` | Bookmarkable quick-access links |
| Focus Summary | `FocusSummaryWidget.tsx` | Summary of today's focus sessions |
| Projects Overview | `ProjectsOverviewWidget.tsx` | At-a-glance project progress bars |
| Custom API | `CustomApiWidget.tsx` | Multi-instance custom API widget with templates (GitHub, LeetCode, anime quotes, weather, etc.) |
| Gmail | `GmailWidget.tsx` | Unread count + recent email subjects (WIP) |

### ✅ Projects System
- Full project CRUD (create, delete)
- Tasks with nested subtasks (add, toggle, delete)
- Per-project progress bar
- Work streak tracking (consecutive days)
- Color-coded project cards (6 preset colors)

### ✅ Focus Timer
- Normal (stopwatch) and Pomodoro modes
- Configurable work/break intervals
- Auto-cycling (work → break → work)
- Session history with weekly bar chart
- Session log (type, duration, date)

### ✅ Google Calendar Integration
- Full CRUD: list, create, edit, delete events
- Month-based navigation with range-based API fetching
- Timezone-safe formatting via `date-fns-tz`
- Color-coded event dots and bars (Google `colorId` mapping)
- Sticky "Editing Event" context banner
- Explicit "Move Event To" feature (prevents accidental date shifts)
- Timezone serialization bug fixed (no UTC conversion corruption).

### ✅ OAuth Security
- Popup-based Google OAuth flow
- Tokens stored ONLY in HttpOnly Secure cookies
- Frontend never receives or stores tokens
- Server-side automatic token refresh
- COOP header for production popup compatibility

### ✅ Mobile Responsiveness
- Viewport meta: `width=device-width, initialScale=1`
- Sidebar hidden on mobile (`hidden md:flex`)
- Bottom navigation bar (`MobileNav.tsx`) with safe-area iPhone notch support
- Responsive DashboardShell (margin, padding, bottom clearance)
- Header stacks vertically on mobile, full-width search
- Widget cards + grid scale down on mobile (1-col → 2-col → 3-col)
- Focus timer circle and text scale on mobile
- Calendar day cells smaller on mobile

### ✅ Settings Tab
- Theme/vibe selection for quotes
- Widget enable/disable toggles
- Google account connection/disconnection
- Account info display (profile picture, name, email)

### ✅ Canvas Upgrade Pack v1.1
- **Widget Collapse/Expand**: Minimize widgets to header-only view (saving vertical space).
- **Section Dividers**: New decorative widget type for organizing the dashboard (Line, Box, Glow styles).
- **Advanced Layout Logic**: Resizing constraints for collapsed widgets, exclusion of dividers from auto-stacking.

### ✅ Strict Layout Refactor (UI Enhancement)
- **Nav & Sidebar**: Centered search with strict width (`clamp(320px, 40%, 600px)`), relocated Profile/Settings dock to Sidebar base.
- **Focus Tab Density**: Zero-dead-space 3-zone layout. Dominant timer (`flex-[3]`), live stats strip (`flex-[1]`), integrated activity scaling right panel.
- **Projects Tab Anti-Emptying**: Adaptive grid padding out gaps, combined thin progress bars with inline task previews, fallback Quick Action/Insight panels when `< 3` projects exist.

### ✅ Dashboard Intelligence Layer V1 & V2
- **Priority Engine**: Real-time evaluation of all dashboard widgets. Automatically applies subtle visual glows and size scaling to items that need attention (e.g., active focus sessions, overdue todos, morning routines).
- **Behavior Tracker**: Safe, strictly-bounded `localStorage` tracking of events (Task completions, Focus intervals), pruned effectively within a 7-day lookback.
- **Pattern & Predictive Engine**: Deterministic algorithms that surface behavioral "SMART" patterns, generating dynamic "Focus", "Productivity Burst", and "Recovery" nudges.
- **Strict Cooldown System**: Prevents insight spam by assigning hour-based `localStorage` timers for SMART nudges.
- **Combined Intelligence Context**: Efficient centralized React Hook (`useDashboardContext`) avoiding massive re-renders across concurrent dashboard tabs.

---

## 3. API Routes Summary

### Authentication (`/api/auth/google/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/google` | GET | Generates Google OAuth URL, redirects browser to consent screen |
| `/api/auth/google/callback` | GET | Exchanges auth code for tokens, sets HttpOnly cookies, closes popup |
| `/api/auth/google/logout` | POST | Clears auth cookies |
| `/api/auth/google/status` | GET | Returns connection status + profile (name, email, picture) |

### Google Data (`/api/google/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/google/calendar/events` | GET | Fetch events for date range (`timeMin`, `timeMax` params) |
| `/api/google/calendar/events` | POST | Create a new calendar event |
| `/api/google/calendar/events/[eventId]` | PUT | Update an existing event |
| `/api/google/calendar/events/[eventId]` | DELETE | Delete an event |
| `/api/google/calendar/colors` | GET | Fetch Google Calendar color palette |
| `/api/google/gmail/summary` | GET | Fetch unread count + recent email subjects |

---

## 4. Zustand Stores Summary

| Store | Persist Key | What It Stores |
|---|---|---|
| `useWidgetStore` | `tbb-widgets` | Widget order array, enabled/disabled map, custom API instances, bookmarks |
| `useTodoStore` | `tbb-todos` | Todo items (text, done status, timestamp) |
| `useHabitStore` | `tbb-habits` | Habits with checked-dates array |
| `useFocusStore` | `tbb-focus` | Timer state, sessions history, pomodoro config |
| `useProjectStore` | `tbb-projects` | Projects with tasks, subtasks, streaks |
| `useSettingsStore` | `tbb-settings` | Quote vibe, theme preferences |
| `useNavigationStore` | `tbb-navigation`| Active dashboard tab state |
| `useTemplateStore` | `tbb-templates` | Dashboard layout templates (presets and user-created) |
| `useGoogleAuthStore` | *(not persisted)* | Runtime-only: connection status, profile, auth actions |

All persisted stores use Zustand's `persist` middleware with `localStorage` as the storage backend. Keys are prefixed with `tbb-`.

---

## 5. Known Bugs / UX Issues

- **No `TODO` / `FIXME` markers found in source code** — codebase is clean
- **Mobile UX still needs polish** — interactions (hover states, drag-and-drop on touch devices) could be improved
- **Gmail widget** — functional but not fully polished; depends on OAuth scopes being granted
- **No error boundaries** — unhandled widget errors could crash the whole dashboard
- **No loading skeletons** — widgets show no placeholder UI while loading data

---

## 6. Work in Progress / Placeholder Features

| Feature | Status | Notes |
|---|---|---|
| **Gmail Widget** | 🟡 WIP | Fetches unread + subjects but UX not production-ready |
| **Custom API Widget** | 🟢 Working | Template system functional; could use response validation |
| **Cloud Sync** | 🔴 Not started | Currently localStorage only; no cross-device sync |
| **PWA Offline** | 🔴 Not started | No service worker or offline caching |
| **Canvas Widget Layout** | 🔴 Not started | Widgets are grid-only; no free-form positioning |

---

## 7. Security Model Notes

### Token Storage
- Access and refresh tokens are stored **exclusively** in HttpOnly, Secure cookies
- The `SameSite=Lax` attribute prevents CSRF attacks
- Cookies are set to `secure: true` in production (`NODE_ENV === "production"`)
- The frontend **never** receives, stores, or transmits tokens — auth is fully opaque

### Token Refresh
- Server-side automatic refresh using the stored refresh token cookie
- Transparent to the frontend — if an access token expires, the API route refreshes it before proceeding
- Implementation: `getAuthenticatedClient()` in `src/lib/googleSession.ts`

### Secrets
- `.env.local` is in `.gitignore` — confirmed not tracked
- No secrets are committed to the repository
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required at runtime only

---

## 8. Deployment Notes

### Required Environment Variables

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Google Cloud Console Setup

1. Create an OAuth 2.0 Client ID (Web application)
2. Add **Authorized redirect URIs**:
   - Local: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://your-domain.com/api/auth/google/callback`
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. OAuth consent screen → add required scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/gmail.readonly`

### Run Locally

```bash
# Install dependencies
npm install

# Create .env.local with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Deploy to Vercel

1. Push repo to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
4. Deploy — that's it

### Important: `next.config.ts` includes the COOP header

```ts
"Cross-Origin-Opener-Policy": "same-origin-allow-popups"
```

This is required for the OAuth popup to communicate back to the main window on deployed environments.

---

## 9. Roadmap Suggestions

### Short-term (Polish)
- [ ] Add loading skeletons / shimmer states for widgets
- [ ] Add React error boundaries around each widget
- [ ] Improve mobile touch drag-and-drop (larger handles, drag-by-handle-only)
- [ ] Finish Gmail widget polish (error states, empty state, scope request flow)
- [ ] Add keyboard shortcuts (Ctrl+K search, tab switching)

### Medium-term (Features)
- [ ] Calendar event notifications / reminders
- [ ] Recurring tasks in Projects
- [ ] Import/export data (JSON backup/restore)
- [ ] Multi-calendar support (select which Google calendars to display)
- [ ] Dark/light theme toggle (currently dark-only)
- [ ] PWA manifest + service worker for offline + installability

### Long-term (Scale)
- [ ] Cloud sync (Supabase / Firebase) for cross-device persistence
- [ ] Canvas-style free-form widget positioning
- [ ] Plugin system for community widgets
- [ ] Collaboration features (shared projects)
- [ ] AI-powered daily summary / task suggestions

---

## File Structure Overview

```
TheBlackBox/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (Inter font, viewport, metadata)
│   │   ├── page.tsx                # Entry point → DashboardShell
│   │   └── api/
│   │       ├── auth/google/        # OAuth routes (4 endpoints)
│   │       └── google/
│   │           ├── calendar/       # Calendar CRUD + colors (4 endpoints)
│   │           └── gmail/summary/  # Gmail summary (1 endpoint)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardShell.tsx  # Main layout container
│   │   │   ├── Sidebar.tsx         # Desktop sidebar navigation
│   │   │   ├── MobileNav.tsx       # Mobile bottom navigation
│   │   │   └── Header.tsx          # Responsive header (search, quote, avatar)
│   │   ├── tabs/
│   │   │   ├── DashboardTab.tsx    # Widget grid host
│   │   │   ├── ProjectsTab.tsx     # Full project manager
│   │   │   ├── FocusTab.tsx        # Focus timer + activity chart
│   │   │   ├── CalendarTab.tsx     # Google Calendar integration
│   │   │   └── SettingsTab.tsx     # App configuration
│   │   └── widgets/               # 10 widget components + WidgetCard + WidgetGrid
│   ├── lib/
│   │   ├── googleOAuth.ts          # OAuth URL generation + token exchange
│   │   ├── googleSession.ts        # Cookie read/write + authenticated client
│   │   ├── calendarTime.ts         # Timezone-safe date formatting
│   │   ├── calendarColors.ts       # Google Calendar color mapping
│   │   └── utils.ts                # Quote fetching, time formatting, helpers
│   ├── store/                      # 9 Zustand stores
│   └── types/
│       └── widget.ts               # All shared types (WidgetId, TabId, Project, etc.)
├── next.config.ts                  # COOP header, redirects
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                      # Secrets (not committed)
```
