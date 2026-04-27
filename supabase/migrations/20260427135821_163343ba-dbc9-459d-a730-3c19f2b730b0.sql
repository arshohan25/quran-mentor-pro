-- Ensure no role other than the function owner can execute the helper.
REVOKE EXECUTE ON FUNCTION public.backfill_app_settings_tiles(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.backfill_app_settings_tiles(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.backfill_app_settings_tiles(jsonb) FROM authenticated;
