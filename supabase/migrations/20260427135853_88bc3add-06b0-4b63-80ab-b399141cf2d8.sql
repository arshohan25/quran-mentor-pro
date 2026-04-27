CREATE OR REPLACE FUNCTION public.backfill_app_settings_tiles(_defaults jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION public.backfill_app_settings_tiles(jsonb) FROM PUBLIC, anon, authenticated;
