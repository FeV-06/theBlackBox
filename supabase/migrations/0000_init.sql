-- ============================================================
-- TheBlackBox: Supabase Database Schema
-- Migration: 0000_init (Idempotent Version)
-- ============================================================

-- ============================================================
-- SECTION 1: Google Token Vault
-- ============================================================

CREATE TABLE IF NOT EXISTS public.google_tokens (
    user_id       UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token  TEXT        NOT NULL,
    refresh_token TEXT,
    expiry        TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own google tokens' AND tablename = 'google_tokens') THEN
        DROP POLICY "Users can manage own google tokens" ON public.google_tokens;
    END IF;
END $$;

CREATE POLICY "Users can manage own google tokens"
ON public.google_tokens FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECTION 2: Widgets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.widgets (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id   TEXT        NOT NULL DEFAULT 'web',
    type        TEXT        NOT NULL,
    title       TEXT,
    enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
    is_locked   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_collapsed BOOLEAN    NOT NULL DEFAULT FALSE,
    z_index     INTEGER     NOT NULL DEFAULT 1,
    layout_x    INTEGER     NOT NULL DEFAULT 20,
    layout_y    INTEGER     NOT NULL DEFAULT 20,
    layout_w    INTEGER     NOT NULL DEFAULT 360,
    layout_h    INTEGER     NOT NULL DEFAULT 260,
    config      JSONB       NOT NULL DEFAULT '{}',
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Evolution: Add missing columns if table already existed
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'web';
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS is_collapsed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS z_index INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS layout_x INTEGER NOT NULL DEFAULT 20;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS layout_y INTEGER NOT NULL DEFAULT 20;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS layout_w INTEGER NOT NULL DEFAULT 360;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS layout_h INTEGER NOT NULL DEFAULT 260;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.widget_layouts (
    user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    layout      TEXT[]      NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_layouts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access own widgets' AND tablename = 'widgets') THEN
        DROP POLICY "Users can access own widgets" ON public.widgets;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access own widget layout' AND tablename = 'widget_layouts') THEN
        DROP POLICY "Users can access own widget layout" ON public.widget_layouts;
    END IF;
END $$;

CREATE POLICY "Users can access own widgets"
ON public.widgets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can access own widget layout"
ON public.widget_layouts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_widgets_user_updated ON public.widgets(user_id, updated_at DESC);

-- ============================================================
-- SECTION 3: Projects
-- ============================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id               TEXT        PRIMARY KEY,
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name             TEXT        NOT NULL,
    description      TEXT,
    color            TEXT        NOT NULL DEFAULT '#7C5CFF',
    streak_days      INTEGER     NOT NULL DEFAULT 0,
    last_worked_date TEXT,
    view_mode        TEXT        NOT NULL DEFAULT 'list',
    device_id        TEXT        NOT NULL DEFAULT 'web',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

ALTER TABLE public.projects ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'web';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own projects' AND tablename = 'projects') THEN
        DROP POLICY "Users can manage own projects" ON public.projects;
    END IF;
END $$;

CREATE POLICY "Users can manage own projects"
ON public.projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECTION 4: Tasks
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id  TEXT        REFERENCES public.projects(id) ON DELETE CASCADE,
    text        TEXT        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'todo',
    position    INTEGER     NOT NULL DEFAULT 0,
    is_expanded BOOLEAN     NOT NULL DEFAULT TRUE,
    subtasks    JSONB       NOT NULL DEFAULT '[]',
    device_id   TEXT        NOT NULL DEFAULT 'web',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Evolution: Add missing columns or handling renames
ALTER TABLE public.tasks ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
ALTER TABLE public.tasks ALTER COLUMN project_id SET DATA TYPE TEXT USING project_id::text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS text TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_expanded BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'web';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Handling migration from 'title' to 'text' if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='title') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='text') THEN
        ALTER TABLE public.tasks RENAME COLUMN title TO text;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='title') THEN
        -- Column 'text' already added, so just copy data if null
        UPDATE public.tasks SET text = title WHERE text IS NULL;
    END IF;
END $$;

ALTER TABLE public.tasks ALTER COLUMN text SET NOT NULL;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own tasks' AND tablename = 'tasks') THEN
        DROP POLICY "Users can manage own tasks" ON public.tasks;
    END IF;
END $$;

CREATE POLICY "Users can manage own tasks"
ON public.tasks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);

-- ============================================================
-- SECTION 5: Reminders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reminders (
    id                TEXT        PRIMARY KEY,
    user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id           TEXT        REFERENCES public.tasks(id) ON DELETE CASCADE,
    title             TEXT        NOT NULL,
    reminder_time     TIMESTAMPTZ NOT NULL,
    notification_sent BOOLEAN     NOT NULL DEFAULT FALSE,
    device_id         TEXT        NOT NULL DEFAULT 'web',
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

ALTER TABLE public.reminders ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
ALTER TABLE public.reminders ALTER COLUMN task_id SET DATA TYPE TEXT USING task_id::text;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'web';
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reminders' AND tablename = 'reminders') THEN
        DROP POLICY "Users can manage own reminders" ON public.reminders;
    END IF;
END $$;

CREATE POLICY "Users can manage own reminders"
ON public.reminders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECTION 6: Focus Sessions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id          TEXT        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id  TEXT        REFERENCES public.projects(id) ON DELETE SET NULL,
    start_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration    INTEGER     NOT NULL,
    mode        TEXT        NOT NULL DEFAULT 'normal',
    device_id   TEXT        NOT NULL DEFAULT 'web',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Evolution
ALTER TABLE public.focus_sessions ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
ALTER TABLE public.focus_sessions ALTER COLUMN project_id SET DATA TYPE TEXT USING project_id::text;
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'web';
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.focus_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own focus sessions' AND tablename = 'focus_sessions') THEN
        DROP POLICY "Users can manage own focus sessions" ON public.focus_sessions;
    END IF;
END $$;

CREATE POLICY "Users can manage own focus sessions"
ON public.focus_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECTION 7: Habits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.habits (
    id            TEXT        PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name          TEXT        NOT NULL,
    checked_dates JSONB       NOT NULL DEFAULT '[]',
    device_id     TEXT        NOT NULL DEFAULT 'web',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- Evolution
ALTER TABLE public.habits ALTER COLUMN id SET DATA TYPE TEXT USING id::text;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS checked_dates JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'web';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own habits' AND tablename = 'habits') THEN
        DROP POLICY "Users can manage own habits" ON public.habits;
    END IF;
END $$;

CREATE POLICY "Users can manage own habits"
ON public.habits FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Helper: auto-update updated_at on row change
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_widgets_updated_at') THEN
        CREATE TRIGGER set_widgets_updated_at BEFORE UPDATE ON public.widgets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_projects_updated_at') THEN
        CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tasks_updated_at') THEN
        CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_reminders_updated_at') THEN
        CREATE TRIGGER set_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_focus_updated_at') THEN
        CREATE TRIGGER set_focus_updated_at BEFORE UPDATE ON public.focus_sessions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_habits_updated_at') THEN
        CREATE TRIGGER set_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;

-- ============================================================
-- SECTION 8: User Settings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings   JSONB       NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own settings' AND tablename = 'user_settings') THEN
        DROP POLICY "Users can manage own settings" ON public.user_settings;
    END IF;
END $$;

CREATE POLICY "Users can manage own settings"
ON public.user_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_settings_updated_at') THEN
        CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;
- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   S E C T I O N   9 :   R e a l t i m e   P u b l i c a t i o n  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
  
 - -   E n a b l e   R e a l t i m e   f o r   a l l   s y n c e d   t a b l e s  
 D O   $ $    
 B E G I N  
         - -   T r y   t o   a d d   t a b l e s   t o   t h e   p u b l i c a t i o n .   E x c e p t i o n s   a r e   c a u g h t   a n d   i g n o r e d   i f   t h e y   a l r e a d y   e x i s t .  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . w i d g e t s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . w i d g e t _ l a y o u t s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . p r o j e c t s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . t a s k s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . f o c u s _ s e s s i o n s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . h a b i t s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
  
         B E G I N  
                 A L T E R   P U B L I C A T I O N   s u p a b a s e _ r e a l t i m e   A D D   T A B L E   p u b l i c . r e m i n d e r s ;  
         E X C E P T I O N   W H E N   O T H E R S   T H E N   N U L L ;   E N D ;  
 E N D   $ $ ;  
 