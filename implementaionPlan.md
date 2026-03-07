Universal Widget Creation System Upgrade
Goal Description
Upgrade TheBlackBox from a fixed-widget dashboard into a unified, extensible widget platform. All widgets will resolve to a Universal Widget Definition (a single JSON object containing 
id
, type, config, and meta). The system introduces a 3-layer architecture (BlackBox Core → Widget Engine → Widget Creation System) that handles discovery, rendering, persistence, and layout without modifying core dashboard code for each new widget.

User Review Required
IMPORTANT

Edge Case Clarifications Needed (Socratic Gate)

All Edge Case questions have been answered.

Final Architecture Decisions
Fault Tolerance (The Crash Radius): Strict 
WidgetErrorBoundary
 per widget instance. A failing widget must not affect the rest of the dashboard. Fallback UI will provide reload and remove options.
Lazy Loading States: Widgets load using React.lazy. Suspense fallback will use manifest.skeleton if provided, otherwise a 
DefaultWidgetSkeleton
.
Config Size & Sync Constraints: Config JSONB is limited to 16KB. The sync engine will debounce updates (~1500ms). Large content widgets (e.g., text editor widgets) will store data in a separate widget_content table.
Widget Runtime Wrapper: A 
WidgetRuntime
 wrapper will be added. The final rendering stack will be:
WidgetRuntime
WidgetErrorBoundary
Suspense
WidgetComponent
Proposed Changes
Database Layer
[NEW] supabase/migrations/xxxx_widget_system.sql
Create the widgets table with soft-deletion and size limits.
Columns: id (UUID v7 PRIMARY KEY), user_id (UUID), type (TEXT), version (INT) DEFAULT 1, config (JSONB), meta (JSONB), created_at (TIMESTAMP), updated_at (TIMESTAMP), deleted_at (TIMESTAMP) (for soft-deletion).
Enforce size constraint: CHECK (length(config::text) < 16384).
Create the widget_content table with one-to-one mapping.
Columns: widget_id (UUID) PRIMARY KEY, content (TEXT), updated_at (TIMESTAMP).
Add RLS policies for both to restrict widgets to their respective owners.
Core Architecture & Types
[NEW] 
src/widgets/types.ts
Define 
UniversalWidgetDefinition
 (with 
id
, type, version, config, meta), 
WidgetInstance
, 
WidgetManifest
, and config schemas.
[NEW] 
src/widgets/registry.ts
Implement the widgetRegistry as a Map.
[NEW] 
src/widgets/loadWidgets.ts
Implement automatic discovery using import.meta.glob("/src/widgets/**/widget.manifest.ts").
Manifest Validation Layer: Validate that manifest.id exists, manifest.component exists, and manifest.id is globally unique. Throw an error on initialization if it fails, preventing silent conflicts.
[NEW] 
src/widgets/debug/widgetDebug.ts
 & Overlay
Lightweight debug utility offering widgetDebug.logRender(), widgetDebug.logError(), and widgetDebug.logLoadTime().
Implementation of a development-only debug overlay (process.env.NODE_ENV === "development") showing widget type, render time, config size, and error status per widget.
Widget Engine Layer
[NEW] 
src/components/widgets/engine/WidgetRuntime.tsx
The outermost execution environment for a widget instance. Handles config hydration, version compatibility, widget lifecycle, debug instrumentation, and performance tracking.
Rendering stack: WidgetRuntime -> WidgetErrorBoundary -> Suspense (manifest.skeleton or DefaultWidgetSkeleton) -> WidgetComponent.
[NEW] 
src/components/widgets/engine/WidgetErrorBoundary.tsx
Strict error boundary. Fallback UI provides reload and remove options to guarantee fault isolation.
[NEW] 
src/hooks/useWidgetConfig.ts
Limited helper hooks to allow widgets to safely read/write their state without touching global store directly.
Performance Guardrails: Widgets must subscribe only to their own config (
useWidgetConfig(widgetId)
), preventing global re-renders.
Handles ~1500ms debounce for the sync engine.
[MODIFY] 
src/store/useWidgetStore.ts
Adapt state to load remote widgets and integrate with the generic definitions.
Sync Loop Protection: Introduce updateSource = "local" | "remote". Ignore remote events if source === "remote" to prevent infinite update loops.
Migration Safety: Convert existing widgets into manifests so they work symmetrically; existing widget IDs continue to resolve natively.
[MODIFY] Canvas Layout System
Layout Safety Guard: Before rendering, filter the layout array so that any widget ID that does not exist or is marked deleted_at != null is explicitly skipped and purged from the layout. This prevents rendering crashes on missing references.
Navigation & Layout Integration
[MODIFY] 
src/types/widget.ts
Add "widgets" to the 
TabId
 type definition between calendar and settings for consistent ordering.
[NEW] 
src/components/tabs/WidgetsTab.tsx
Dedicated tab component for no-code widget creation.
Layout: flex flex-col gap-6 p-6 container.
Header: h1 with text-xl font-semibold and color var(--color-text-primary).
Content: Renders <WidgetBuilder /> directly.
Rule: Do not import 
WidgetGrid
 or any dashboard rendering logic here.
[MODIFY] 
src/components/layout/DashboardShell.tsx
Register widgets: WidgetsTab in the tabComponents registry.
Ensure standard tab switching logic handles the new ID safely.
[MODIFY] 
src/components/layout/Sidebar.tsx
 & 
src/components/layout/MobileNav.tsx
Add "Widgets" navigation item.
Icon: LayoutGrid from lucide-react.
Label: "Widgets".
Sidebar entry placed before "Settings". Bottom dock remains for account/settings.
[MODIFY] 
src/lib/commandPaletteCommands.tsx
Add "Open Widgets" command to the 
Navigation
 section.
Action: 
setActiveTab("widgets")
.
Stability Fixes (Infinite Loop Prevention)
[MODIFY] 
src/components/widgets/builder/WidgetBuilder.tsx
Use individual useWidgetStore calls or useShallow for the selector returning { registerExternalWidget, layout, activeCanvasId }. This prevents the component from re-rendering on every store change if the selector result is reference-unstable.
[MODIFY] 
src/components/CommandPalette.tsx
Refactor useNavigationStore and useWidgetStore calls to use stable selectors or useShallow.
[MODIFY] 
src/components/layout/DashboardShell.tsx
Ensure setDashboardEditMode is called safely within useEffect and that dependencies are stable.
Verification Plan
Automated/Manual Testing
Widgets Tab Navigation: Click the "Widgets" icon in sidebar/mobile nav and verify 
WidgetsTab
 mounts with the correct p-6 padding and text-xl header.
Command Palette Integration: Press Ctrl + K, search for "Open Widgets", and verify it successfully switches to the new tab.
Builder Functionality: Create a widget while on the "Widgets" tab and verify it's added to the dashboard layout without the tab itself rendering a 
WidgetGrid
.
Theme Consistency: Verify that all text and borders use the CSS variables defined in 
globals.css
 (e.g., --color-text-primary, --color-border).