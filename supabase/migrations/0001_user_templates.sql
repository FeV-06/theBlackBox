-- ============================================================
-- SECTION: User Templates
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_templates (
    user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    templates  JSONB       NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own templates' AND tablename = 'user_templates') THEN
        DROP POLICY "Users can manage own templates" ON public.user_templates;
    END IF;
END $$;

CREATE POLICY "Users can manage own templates"
ON public.user_templates FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_templates_updated_at') THEN
        CREATE TRIGGER set_templates_updated_at BEFORE UPDATE ON public.user_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;
