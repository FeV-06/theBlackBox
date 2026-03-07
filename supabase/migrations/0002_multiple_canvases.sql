-- ============================================================
-- SECTION: Multiple Canvases Migration
-- ============================================================

-- Add canvases (metadata), layouts (record per canvas), and active_canvas_id to widget_layouts table.
ALTER TABLE public.widget_layouts ADD COLUMN IF NOT EXISTS canvases JSONB NOT NULL DEFAULT '[]';
ALTER TABLE public.widget_layouts ADD COLUMN IF NOT EXISTS layouts JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.widget_layouts ADD COLUMN IF NOT EXISTS active_canvas_id TEXT;
