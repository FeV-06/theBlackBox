-- ============================================================
-- Widget Engine: Migration 0003
-- Adds versioning, content table, and config size constraint
-- ============================================================

-- 1. Add version column to existing widgets table (idempotent)
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. Enforce 16KB config size constraint (idempotent guard)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'widgets_config_size_limit' AND conrelid = 'public.widgets'::regclass
    ) THEN
        ALTER TABLE public.widgets
        ADD CONSTRAINT widgets_config_size_limit CHECK (length(config::text) < 16384);
    END IF;
END $$;

-- 3. Create widget_content table for large-payload widgets (e.g. text editors)
CREATE TABLE IF NOT EXISTS public.widget_content (
    widget_id  TEXT        PRIMARY KEY REFERENCES public.widgets(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.widget_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Users can manage own widget content'
        AND tablename = 'widget_content'
    ) THEN
        DROP POLICY "Users can manage own widget content" ON public.widget_content;
    END IF;
END $$;

-- RLS: join back through widgets to verify ownership
CREATE POLICY "Users can manage own widget content"
ON public.widget_content FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.widgets w
        WHERE w.id = widget_id AND w.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.widgets w
        WHERE w.id = widget_id AND w.user_id = auth.uid()
    )
);

-- 4. Trigger: auto-update updated_at on widget_content
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_widget_content_updated_at') THEN
        CREATE TRIGGER set_widget_content_updated_at
        BEFORE UPDATE ON public.widget_content
        FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;

-- 5. Realtime: enable publication for new table
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.widget_content;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
