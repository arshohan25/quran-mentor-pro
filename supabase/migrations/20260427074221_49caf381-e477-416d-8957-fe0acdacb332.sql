
-- ============ lesson_items ============
CREATE TABLE public.lesson_items (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  title_bn TEXT, title_en TEXT, title_ar TEXT,
  description_bn TEXT, description_en TEXT, description_ar TEXT,
  target_surah INTEGER,
  target_ayah_start INTEGER,
  target_ayah_end INTEGER,
  recommended_reciter_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read lesson items" ON public.lesson_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert lesson items" ON public.lesson_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update lesson items" ON public.lesson_items FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete lesson items" ON public.lesson_items FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_lesson_items_updated BEFORE UPDATE ON public.lesson_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_audit_lesson_items AFTER INSERT OR UPDATE OR DELETE ON public.lesson_items FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();

INSERT INTO public.lesson_items (id, sort_order, category, title_bn, title_en, title_ar, description_en) VALUES
  ('tajweed-basics', 10, 'tajweed', 'তাজবীদের মূলনীতি', 'Tajweed Basics', 'أساسيات التجويد', 'Foundational tajweed rules — makhraj, sifaat, basic noon/meem rulings.'),
  ('memorization-daily', 20, 'memorization', 'দৈনিক হিফজ', 'Daily Memorization', 'الحفظ اليومي', 'A short daily memorization session focused on retention.'),
  ('tarteel-practice', 30, 'tarteel', 'তারতীল চর্চা', 'Tarteel Practice', 'تدريب الترتيل', 'Slow, measured recitation practice for clarity and rhythm.');

-- ============ content_item_locales ============
CREATE TABLE public.content_item_locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('bn','en','ar')),
  country TEXT NOT NULL,
  value TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE (key, language, country)
);
CREATE INDEX content_item_locales_key_idx ON public.content_item_locales (key, language);
ALTER TABLE public.content_item_locales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content locales" ON public.content_item_locales FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert content locales" ON public.content_item_locales FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update content locales" ON public.content_item_locales FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete content locales" ON public.content_item_locales FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_content_item_locales_updated BEFORE UPDATE ON public.content_item_locales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_audit_content_item_locales AFTER INSERT OR UPDATE OR DELETE ON public.content_item_locales FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();

-- ============ app_branding.default_country ============
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS default_country TEXT;

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_item_locales;
