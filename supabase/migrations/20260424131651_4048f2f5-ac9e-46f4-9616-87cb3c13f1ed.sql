ALTER TABLE public.hifz_srs ADD CONSTRAINT hifz_srs_user_surah_ayah_unique UNIQUE (user_id, surah, ayah);

CREATE INDEX IF NOT EXISTS idx_hifz_srs_due ON public.hifz_srs (user_id, next_review_at);