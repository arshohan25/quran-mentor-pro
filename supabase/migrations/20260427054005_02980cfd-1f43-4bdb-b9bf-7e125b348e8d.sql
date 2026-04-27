-- Add a mode column to classify recitation attempts (practice / hifz / live / etc.)
ALTER TABLE public.recitation_sessions
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'practice';

-- Backfill any pre-existing rows that may have been inserted before the default applied
UPDATE public.recitation_sessions SET mode = 'practice' WHERE mode IS NULL;

-- Constrain to a known set of values; easy to extend later
ALTER TABLE public.recitation_sessions
  DROP CONSTRAINT IF EXISTS recitation_sessions_mode_check;
ALTER TABLE public.recitation_sessions
  ADD CONSTRAINT recitation_sessions_mode_check
  CHECK (mode IN ('practice', 'hifz', 'live', 'lesson'));

-- Index for the admin breakdown widget
CREATE INDEX IF NOT EXISTS recitation_sessions_mode_created_at_idx
  ON public.recitation_sessions (mode, created_at DESC);