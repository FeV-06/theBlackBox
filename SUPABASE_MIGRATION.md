# TheBlackBox --- Supabase Migration Plan (Improved)

*Last updated: 2026-03-04*

This document reviews and improves the original Supabase migration
strategy for **TheBlackBox**.\
Your original plan is strong and production-minded. The improvements
below focus on **stability, maintainability, and future Android
integration**.

------------------------------------------------------------------------

# 1. Goals of the Migration

Primary objectives:

1.  Replace custom Google OAuth with **Supabase Auth**
2.  Introduce **cloud persistence**
3.  Preserve **local‑first performance**
4.  Enable **multi-device sync** (Web + Android)
5.  Maintain compatibility with existing Google API integrations

Final architecture target:

                 Supabase (Auth + Postgres + Realtime)
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
       TheBlackBox Web App             Android Companion App
        (local-first UI)                 (notifications)
            │                                 │
            └──────────── Sync Engine ────────┘

------------------------------------------------------------------------

# 2. Supabase Client Setup

Your proposal:

    src/lib/supabase/client.ts
    src/lib/supabase/server.ts

This is correct.

### Recommended Implementation

Use the official SSR helpers:

    @supabase/ssr

Client file:

    src/lib/supabase/client.ts

Responsibilities:

• Browser client\
• Session refresh\
• Realtime subscriptions

Server file:

    src/lib/supabase/server.ts

Responsibilities:

• Server actions • API routes • Cookie session reading

------------------------------------------------------------------------

# 3. Auth Migration Strategy Review

Your **hybrid token strategy** is excellent.

### Current Flow

    User Login
       │
    Supabase OAuth (Google provider)
       │
    Supabase returns session
       │
    Extract provider_token
    provider_refresh_token
       │
    Inject into existing cookies
    googleSession.ts

This preserves your existing API layer:

    /api/google/calendar/*
    /api/google/gmail/*

### Improvement Recommendation

Add a **dedicated token persistence table**.

Reason: Cookies can expire or get cleared.

Suggested table:

    google_tokens

Columns:

    user_id UUID (FK auth.users)
    access_token TEXT
    refresh_token TEXT
    expiry TIMESTAMP
    updated_at TIMESTAMP

Then your server can refresh tokens even if cookies disappear.

------------------------------------------------------------------------

# 4. Database Schema Design

Your migration file:

    supabase/migrations/0000_init.sql

Good approach.

Recommended **core tables**.

## widgets

    id UUID PRIMARY KEY
    user_id UUID
    type TEXT
    config JSONB
    position INTEGER
    collapsed BOOLEAN
    updated_at TIMESTAMP
    deleted_at TIMESTAMP

## tasks

    id UUID PRIMARY KEY
    user_id UUID
    title TEXT
    description TEXT
    status TEXT
    priority INTEGER
    due_time TIMESTAMP
    updated_at TIMESTAMP
    deleted_at TIMESTAMP

## reminders

    id UUID PRIMARY KEY
    task_id UUID
    reminder_time TIMESTAMP
    notification_sent BOOLEAN
    updated_at TIMESTAMP

## focus_sessions

    id UUID PRIMARY KEY
    user_id UUID
    duration INTEGER
    project_id UUID
    created_at TIMESTAMP
    updated_at TIMESTAMP

## habits

    id UUID PRIMARY KEY
    user_id UUID
    name TEXT
    streak INTEGER
    updated_at TIMESTAMP

------------------------------------------------------------------------

# 5. Row Level Security (Critical)

RLS must be enabled for **every table**.

Example:

    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

Policy example:

    CREATE POLICY "Users can access own tasks"
    ON tasks
    FOR ALL
    USING (auth.uid() = user_id);

Without this, Supabase is insecure.

------------------------------------------------------------------------

# 6. Sync Engine Design

Your push/pull architecture is correct.

However, the engine should be **generic**, not store‑specific.

Instead of:

    useWidgetStore → custom sync
    useTodoStore → custom sync

Create:

    src/lib/sync/createSyncedStore.ts

Example concept:

    createSyncedStore({
      table: "tasks",
      store: useTaskStore
    })

Benefits:

• less duplicated code\
• easier Android compatibility\
• simpler testing

------------------------------------------------------------------------

# 7. Sync Engine Behavior

## Local Write

    UI Action
       │
    Update Zustand Store
       │
    UI updates instantly
       │
    Debounced push to Supabase

Pseudo:

    debounce(1500ms)
    supabase.from(table).upsert(data)

------------------------------------------------------------------------

## Remote Sync

Use Supabase Realtime instead of polling.

    supabase
    .channel("tasks")
    .on("postgres_changes")
    .subscribe()

Flow:

    Android edits task
         │
    Supabase update
         │
    Web realtime event
         │
    Local store updated

------------------------------------------------------------------------

# 8. Conflict Resolution

Multiple devices introduce conflicts.

Simplest rule:

    last_write_wins

Based on:

    updated_at

Pseudo logic:

    if incoming.updated_at > local.updated_at
      replace local

------------------------------------------------------------------------

# 9. Offline Behavior

The current **localStorage-first architecture is correct**.

The UI should never wait for Supabase.

Example:

    User adds task offline
         │
    Local store updates
         │
    Queued sync
         │
    Push to Supabase when online

Consider adding:

    sync_queue

table or in-memory queue.

------------------------------------------------------------------------

# 10. Device Identification

Add a column to tables:

    device_id TEXT

Example values:

    web
    android_phone
    tablet

Helps with:

• debugging • conflict tracking

------------------------------------------------------------------------

# 11. Android Compatibility Preparation

Design schema assuming **Android client exists**.

Android responsibilities:

• reminders • notifications • quick task capture

Web responsibilities:

• planning • visualization • analytics

------------------------------------------------------------------------

# 12. Recommended Migration Steps

Order matters.

### Step 1

Install Supabase packages.

### Step 2

Create database schema.

### Step 3

Implement Supabase Auth.

### Step 4

Add token extraction logic.

### Step 5

Build sync engine.

### Step 6

Bind stores to sync engine.

### Step 7

Test offline behavior.

### Step 8

Enable realtime subscriptions.

------------------------------------------------------------------------

# 13. Testing Plan

## Auth Test

    Login with Google
    Verify Supabase session
    Verify Google API calls work

## Sync Test

    Add widget
    Confirm Supabase row created

## Offline Test

    Disable network
    Modify data
    Reconnect
    Verify sync occurs

## Multi-device Test

    Open app in two browsers
    Edit data
    Verify realtime updates

------------------------------------------------------------------------

# 14. Future Improvements

After migration:

• Full **cloud sync** • Android companion app • AI productivity insights
• collaboration support • plugin system

------------------------------------------------------------------------

# Conclusion

Your original plan is **architecturally sound** and already close to
production-grade.

The main improvements recommended:

1.  Dedicated **Google token table**
2.  **Generic sync middleware**
3.  Supabase **Realtime subscriptions**
4.  Explicit **conflict resolution strategy**
5.  **Device ID tracking**
6.  Strong **RLS policies**
