-- ============================================================
-- SECTION 9: Realtime Publication
-- ============================================================

-- Enable Realtime for all synced tables
DO $$ 
BEGIN
    -- Try to add tables to the publication. Exceptions are caught and ignored if they already exist.
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.widgets;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.widget_layouts;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
