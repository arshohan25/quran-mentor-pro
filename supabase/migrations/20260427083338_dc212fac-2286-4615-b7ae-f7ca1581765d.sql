-- 1. Merge expanded defaults into existing row 1 (admin edits win on conflict)
UPDATE public.app_settings
SET settings = jsonb_build_object(
  'announcement', jsonb_build_object('enabled', false, 'text', '', 'level', 'info'),
  'features', jsonb_build_object(
    'ask_ai', true, 'live_recitation', true, 'hifz_srs', true, 'tafsir_compare', true,
    'word_meanings', true, 'tajweed', true, 'audio_player', true, 'bookmarks', true
  ),
  'defaults', jsonb_build_object(
    'daily_minutes_goal', 20,
    'default_reciter_id', null,
    'default_translation', 'bn.bengali',
    'default_arabic_font_size', 28
  ),
  'limits', jsonb_build_object(
    'practice_max_seconds', 300,
    'live_max_seconds', 600,
    'live_min_accuracy_to_save', 0,
    'hifz_daily_review_cap', 50,
    'ask_ai_daily_quota', 20
  ),
  'ui', jsonb_build_object(
    'show_streak_chip', true,
    'show_daily_ayah', true,
    'show_daily_hadith', true,
    'show_daily_dua', true,
    'show_qibla_tile', true,
    'show_hijri_tile', true,
    'compact_home', false
  )
) || COALESCE(settings, '{}'::jsonb),
updated_at = now()
WHERE id = 1;

-- Ensure the row exists (no-op if already present)
INSERT INTO public.app_settings (id, settings)
SELECT 1, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE id = 1);

-- 2. Enable realtime for instant propagation
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_settings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings';
  END IF;
END $$;