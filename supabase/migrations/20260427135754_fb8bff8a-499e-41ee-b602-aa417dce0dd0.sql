-- Helper that merges a JSON map of {tile_path: defaultEnabled} into
-- app_settings.settings.ui.tiles, only writing keys that are MISSING
-- (existing admin overrides — true OR false — are preserved).
CREATE OR REPLACE FUNCTION public.backfill_app_settings_tiles(_defaults jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_settings jsonb;
  current_tiles    jsonb;
  merged_tiles     jsonb;
  k                text;
  v                jsonb;
BEGIN
  SELECT settings INTO current_settings
    FROM public.app_settings
    WHERE id = 1;

  IF current_settings IS NULL THEN
    current_settings := '{}'::jsonb;
  END IF;

  current_tiles := COALESCE(current_settings #> '{ui,tiles}', '{}'::jsonb);
  merged_tiles  := current_tiles;

  -- Only fill in keys that don't already have an explicit boolean override.
  FOR k, v IN SELECT * FROM jsonb_each(_defaults) LOOP
    IF NOT (merged_tiles ? k) THEN
      merged_tiles := merged_tiles || jsonb_build_object(k, v);
    END IF;
  END LOOP;

  current_settings := jsonb_set(
    jsonb_set(current_settings, '{ui}', COALESCE(current_settings->'ui', '{}'::jsonb), true),
    '{ui,tiles}',
    merged_tiles,
    true
  );

  INSERT INTO public.app_settings (id, settings, updated_at)
  VALUES (1, current_settings, now())
  ON CONFLICT (id) DO UPDATE
    SET settings   = EXCLUDED.settings,
        updated_at = now();

  RETURN merged_tiles;
END;
$$;

-- Lock down: only admins (or the postgres owner running migrations) may call it.
REVOKE ALL ON FUNCTION public.backfill_app_settings_tiles(jsonb) FROM PUBLIC, anon, authenticated;

-- Run an initial backfill for the current manifest. Keep this list in sync
-- with src/lib/homeTilesManifest.ts — re-run with an updated jsonb argument
-- (or call the helper from a future migration) whenever new tiles are added.
SELECT public.backfill_app_settings_tiles($${
  "card:announcement":       true,
  "card:streak_chip":        true,
  "card:next_prayer":        true,
  "card:hijri_header":       true,
  "card:daily_ayah":         true,
  "card:daily_amal_summary": true,
  "card:daily_dua":          true,

  "/quran":            true,
  "/audio":            true,
  "/hifz":             true,
  "/practice":         true,
  "/recitation/stats": true,
  "/tafsir/1/1":       true,
  "/bookmarks":        true,
  "/planner":          true,

  "/prayer-times": true,
  "/qibla":        true,
  "/prayer":       true,
  "/qaza":         true,

  "/tasbih":     true,
  "/dua":        true,
  "/daily-amal": true,
  "/hijri":      true,

  "/hadith":        true,
  "/ask":           true,
  "/notifications": true
}$$::jsonb);
