ALTER TABLE public.recitation_sessions
  ADD COLUMN IF NOT EXISTS reciter text,
  ADD COLUMN IF NOT EXISTS lesson_type text;

CREATE INDEX IF NOT EXISTS recitation_sessions_breakdown_idx
  ON public.recitation_sessions (created_at DESC, reciter, lesson_type);