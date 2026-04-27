
-- ============ app_branding (singleton) ============
CREATE TABLE public.app_branding (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name_bn TEXT NOT NULL DEFAULT 'কুরআন সাথী',
  app_name_en TEXT NOT NULL DEFAULT 'Quran Companion',
  app_name_ar TEXT NOT NULL DEFAULT 'رفيق القرآن',
  tagline_bn TEXT DEFAULT '',
  tagline_en TEXT DEFAULT '',
  tagline_ar TEXT DEFAULT '',
  logo_url TEXT,
  primary_hsl TEXT NOT NULL DEFAULT '142 45% 35%',
  accent_hsl TEXT NOT NULL DEFAULT '38 65% 52%',
  gold_hsl TEXT NOT NULL DEFAULT '38 65% 52%',
  default_language TEXT NOT NULL DEFAULT 'bn' CHECK (default_language IN ('bn','en','ar')),
  default_theme TEXT NOT NULL DEFAULT 'auto' CHECK (default_theme IN ('light','dark','auto')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
ALTER TABLE public.app_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read branding" ON public.app_branding FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage branding (insert)" ON public.app_branding FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage branding (update)" ON public.app_branding FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage branding (delete)" ON public.app_branding FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

INSERT INTO public.app_branding (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER trg_app_branding_updated
  BEFORE UPDATE ON public.app_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ home_sections ============
CREATE TABLE public.home_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title_bn TEXT, title_en TEXT, title_ar TEXT,
  subtitle_bn TEXT, subtitle_en TEXT, subtitle_ar TEXT,
  cta_label_bn TEXT, cta_label_en TEXT, cta_label_ar TEXT,
  link TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read home sections" ON public.home_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert home sections" ON public.home_sections FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update home sections" ON public.home_sections FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete home sections" ON public.home_sections FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_home_sections_updated BEFORE UPDATE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default home sections
INSERT INTO public.home_sections (key, sort_order, title_bn, title_en, title_ar, link, icon) VALUES
  ('daily_ayah', 10, 'আজকের আয়াত', 'Ayah of the Day', 'آية اليوم', '/quran', 'Sparkles'),
  ('prayer_times', 20, 'নামাজের সময়', 'Prayer Times', 'مواقيت الصلاة', '/prayer-times', 'Clock'),
  ('streak', 30, 'ধারাবাহিকতা', 'Your Streak', 'تتابعك', '/recitation/stats', 'Flame'),
  ('daily_amal', 40, 'দৈনিক আমল', 'Daily Amal', 'العمل اليومي', '/daily-amal', 'ListChecks'),
  ('quran', 50, 'কুরআন', 'Quran', 'القرآن', '/quran', 'BookOpen'),
  ('hifz', 60, 'হিফজ', 'Hifz', 'الحفظ', '/hifz', 'GraduationCap'),
  ('hadith', 70, 'হাদিস', 'Hadith', 'الحديث', '/hadith', 'ScrollText'),
  ('dua', 80, 'দোয়া', 'Dua', 'الدعاء', '/dua', 'HandHeart'),
  ('tasbih', 90, 'তাসবিহ', 'Tasbih', 'تسبيح', '/tasbih', 'CircleDot'),
  ('ask_ai', 100, 'প্রশ্ন করুন', 'Ask AI', 'اسأل', '/ask', 'MessageCircleQuestion'),
  ('bookmarks', 110, 'বুকমার্ক', 'Bookmarks', 'المفضلة', '/bookmarks', 'BookMarked');

-- ============ nav_items ============
CREATE TABLE public.nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  path TEXT NOT NULL,
  icon TEXT NOT NULL,
  label_bn TEXT, label_en TEXT, label_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read nav" ON public.nav_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert nav" ON public.nav_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update nav" ON public.nav_items FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete nav" ON public.nav_items FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_nav_items_updated BEFORE UPDATE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.nav_items (sort_order, path, icon, label_bn, label_en, label_ar) VALUES
  (10, '/', 'Home', 'হোম', 'Home', 'الرئيسية'),
  (20, '/quran', 'BookOpen', 'কুরআন', 'Quran', 'القرآن'),
  (30, '/qibla', 'Compass', 'কিবলা', 'Qibla', 'القبلة'),
  (40, '/tasbih', 'CircleDot', 'তাসবিহ', 'Tasbih', 'تسبيح'),
  (50, '/prayer-times', 'HandHeart', 'নামাজ', 'Prayer', 'الصلاة');

-- ============ reciters ============
CREATE TABLE public.reciters (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  name_bn TEXT, name_en TEXT, name_ar TEXT,
  external_id TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reciters_only_one_default ON public.reciters (is_default) WHERE is_default = true;
ALTER TABLE public.reciters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reciters" ON public.reciters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert reciters" ON public.reciters FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update reciters" ON public.reciters FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete reciters" ON public.reciters FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reciters_updated BEFORE UPDATE ON public.reciters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.reciters (id, sort_order, name_bn, name_en, name_ar, external_id, is_default) VALUES
  ('ar.alafasy', 10, 'মিশারী আলাফাসি', 'Mishary Alafasy', 'مشاري العفاسي', 'ar.alafasy', true),
  ('ar.abdulbasitmurattal', 20, 'আব্দুল বাসিত', 'Abdul Basit (Murattal)', 'عبد الباسط', 'ar.abdulbasitmurattal', false),
  ('ar.husary', 30, 'মাহমুদ আল-হুসারী', 'Mahmoud Al-Husary', 'محمود الحصري', 'ar.husary', false),
  ('ar.minshawi', 40, 'মুহাম্মদ আল-মিনশাওয়ী', 'Muhammad Al-Minshawi', 'محمد المنشاوي', 'ar.minshawi', false),
  ('ar.sudais', 50, 'আব্দুর রহমান আস-সুদাইস', 'Abdur-Rahman As-Sudais', 'عبد الرحمن السديس', 'ar.sudais', false);

-- ============ daily_content_overrides ============
CREATE TABLE public.daily_content_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('ayah','hadith','dua')),
  date DATE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kind, date)
);
ALTER TABLE public.daily_content_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read daily overrides" ON public.daily_content_overrides FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert daily overrides" ON public.daily_content_overrides FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update daily overrides" ON public.daily_content_overrides FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete daily overrides" ON public.daily_content_overrides FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_daily_overrides_updated BEFORE UPDATE ON public.daily_content_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ content_items ============
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  bn TEXT, en TEXT, ar TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content items" ON public.content_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert content items" ON public.content_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update content items" ON public.content_items FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete content items" ON public.content_items FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_content_items_updated BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Audit triggers for the new admin-controlled tables ============
CREATE OR REPLACE FUNCTION public.audit_admin_table_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)::text, ''),
    jsonb_build_object('op', TG_OP)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_app_branding AFTER INSERT OR UPDATE OR DELETE ON public.app_branding FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();
CREATE TRIGGER trg_audit_home_sections AFTER INSERT OR UPDATE OR DELETE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();
CREATE TRIGGER trg_audit_nav_items AFTER INSERT OR UPDATE OR DELETE ON public.nav_items FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();
CREATE TRIGGER trg_audit_reciters AFTER INSERT OR UPDATE OR DELETE ON public.reciters FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();
CREATE TRIGGER trg_audit_daily_overrides AFTER INSERT OR UPDATE OR DELETE ON public.daily_content_overrides FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();
CREATE TRIGGER trg_audit_content_items AFTER INSERT OR UPDATE OR DELETE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.audit_admin_table_change();

-- ============ Realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_branding;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nav_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reciters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_content_overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;

-- ============ Storage bucket for branding ============
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view branding files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'branding');
CREATE POLICY "Admins can upload branding" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'branding' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update branding" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'branding' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete branding" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'branding' AND has_role(auth.uid(),'admin'));
