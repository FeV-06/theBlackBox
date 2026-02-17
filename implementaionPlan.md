Personal Productivity Dashboard — Implementation Plan

Build a premium dark-mode glassy PWA dashboard with purple accent theme in:

C:\GitRepos\TheBlackBox

Deployable on Vercel/Netlify, using localStorage-only for user data persistence, with manual export/import backup.

1. Project Scaffold
[NEW] Next.js 14+ App Router project

Command (non-interactive):

npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*"

Install dependencies
npm install zustand framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react

OAuth / API integration dependencies
npm install googleapis jose

Add Inter font

Use next/font/google in layout.tsx.

2. Tailwind Theme
[MODIFY] tailwind.config.ts

Extend theme:

colors.bg.DEFAULT = '#0B0B0E'

colors.bg.card = '#1B1B22'

colors.bg.elevated = '#222230'

colors.accent = '#7C5CFF'

colors.border = 'rgba(255,255,255,0.06)'

borderRadius.card = '18px'

fontFamily.sans = ['Inter', 'sans-serif']

Add keyframes:

fade-in

slide-up

glow-pulse

3. Global Styles & Root Layout
[MODIFY] globals.css

dark gradient background: #0B0B0E → #141419

glass card utility class:

backdrop blur

subtle border

shadow

custom scrollbar styling

[MODIFY] layout.tsx

Apply Inter font

Metadata title: [project_name]

Global layout shell:

<Sidebar />

<Header />

main content {children}

[MODIFY] page.tsx

Render <DashboardShell />

4. Layout Components
[NEW] Sidebar

src/components/layout/Sidebar.tsx

fixed left sidebar

icon-only navigation

items:

Dashboard

Projects

Focus

Calendar

Settings

active state = purple glow

purple logo at bottom

[NEW] Header

src/components/layout/Header.tsx

search input

profile avatar circle

rotating quote line (short, clean)

[NEW] DashboardShell

src/components/layout/DashboardShell.tsx

tab bar inside page

tabs:

Dashboard

Projects

Focus

Calendar

Settings

uses Framer Motion AnimatePresence for smooth transitions

5. Zustand Stores (localStorage persistence)

All stores use persist middleware and safe localStorage wrapper.

Store Plan
Store	Responsibility
useWidgetStore.ts	widget order, enabled/disabled, drag reorder
useTodoStore.ts	todo CRUD
useFocusStore.ts	focus sessions log, active focus timer state
useProjectStore.ts	projects CRUD, tasks/subtasks, progress, streak counter
useHabitStore.ts	habits + daily streak
useSettingsStore.ts	quote vibe preference, bookmarks, backup/export/import
useApiWidgetStore.ts	multiple custom API widgets (multi-instance)
6. Widget System
[NEW] Widget contract

src/types/widget.ts

Use stable widget IDs (enum union type):

export type WidgetId =
  | "quote_clock"
  | "todo"
  | "habits"
  | "github"
  | "weather"
  | "links"
  | "focus_summary"
  | "projects_overview"
  | "custom_api";


Widget definition contract:

interface WidgetDefinition {
  id: WidgetId;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
  defaultEnabled: boolean;
}

[NEW] WidgetCard

src/components/widgets/WidgetCard.tsx

glass card wrapper

title bar

drag handle

remove/hide button

[NEW] WidgetGrid

src/components/widgets/WidgetGrid.tsx

uses @dnd-kit/sortable

reads widget order + enabled state

persists reorder into localStorage

7. Core Widgets (Dashboard Tab)

All widgets stored in:

src/components/widgets/

QuoteClockWidget.tsx

live clock

rotating quote on page load

vibe preference:

motivational

anime

tech

random

uses free APIs when possible

fallback to local quote array

TodoWidget.tsx

add/complete/delete tasks

progress bar

HabitTrackerWidget.tsx

habit CRUD

daily check-in

streak counter

resets if missed

GitHubWidget.tsx

repo input (owner/repo)

fetch GitHub API

show:

stars, forks, open issues

last updated

last commits list (last 5)

WeatherWidget.tsx

city input

uses Open-Meteo (no key required)

shows temp + condition

QuickLinksWidget.tsx

bookmarks CRUD

icon grid layout

FocusSummaryWidget.tsx

shows today’s total focus time

shows mini weekly bars preview

ProjectsOverviewWidget.tsx

shows top 3 active projects

progress bars

quick link button to Projects tab

CustomApiWidget.tsx (Multi-instance)

supports multiple API widget instances

each instance config:

template type

url

headers (optional)

refresh interval (optional)

display JSON formatted output + status

8. Focus Tab
[NEW] FocusTab

src/components/tabs/FocusTab.tsx

Features:

start/stop focus timer

session history list

Pomodoro mode toggle:

25/5 default

configurable

Focus logs stored in localStorage

Weekly activity chart:

x-axis days

y-axis hours focused

purple bar chart

Pomodoro exists ONLY inside FocusTab (not dashboard widget).

9. Projects Tab (Full Page)
[NEW] ProjectsTab

src/components/tabs/ProjectsTab.tsx

Features:

full project CRUD

inside project:

tasks CRUD

subtasks CRUD

reorder tasks

completion %

progress bars

streak counter badge

Framer Motion animations

10. Calendar Tab (REAL Google Calendar CRUD)
[NEW] CalendarTab

src/components/tabs/CalendarTab.tsx

Must implement real Google Calendar integration in v1.

Features:

Google OAuth login button

fetch calendar list + events

month/week view display

CRUD:

create events

edit events

delete events

Implementation must use Next.js API routes for OAuth callback and token exchange.

Tokens stored locally (v1 acceptable), but implemented safely with expiration handling.

11. Gmail Summary Widget (REAL Gmail Integration)
[NEW] GmailWidget.tsx

requires same Google OAuth login as Calendar

shows unread count

shows last 5 email subjects

link to Gmail inbox

Uses Gmail API.

12. Settings Tab
[NEW] SettingsTab

src/components/tabs/SettingsTab.tsx

Features:

export all app state to JSON file

import JSON restore

widget toggles enable/disable

quote vibe selector

manage custom API widget instances

13. PWA Support
[NEW] public/manifest.json

name: [project_name]

theme_color: purple accent

icons placeholder

start_url: "/"

Service Worker Strategy

Use @ducanh2912/next-pwa if stable, otherwise implement minimal SW manually.

Goal: installable PWA + offline caching for static assets.

14. Verification Plan
Browser Walkthrough

npm run dev

verify layout: sidebar, header, tab switching

drag widget reorder persists after refresh

Projects CRUD works

Focus timer logs sessions

Settings export/import works

OAuth Verification

connect Google

calendar events appear

create/edit/delete event works

Gmail unread + subjects display

Responsive

narrow viewport collapses layout gracefully