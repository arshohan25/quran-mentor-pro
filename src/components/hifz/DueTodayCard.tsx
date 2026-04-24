import { Link } from "react-router-dom";
import { Brain, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDueCards } from "@/hooks/useHifzSrs";

export default function DueTodayCard() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const { data: due, isLoading } = useDueCards();

  if (!user && !loading) {
    return (
      <div className="islamic-card p-5 relative overflow-hidden">
        <span className="corner-ornament top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
        <span className="corner-ornament top-0 left-0 border-t-2 border-l-2 rounded-tl-lg" />
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-accent" />
          <span className="font-semibold text-foreground">
            {t("স্মার্ট রিভিউ", "Smart Review", "المراجعة الذكية")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t(
            "সাইন ইন করে স্পেসড-রেপিটিশন রিভিউ চালু করুন — আপনার অগ্রগতি ক্লাউডে সেভ থাকবে।",
            "Sign in to enable spaced-repetition review — your progress syncs to the cloud.",
            "سجّل الدخول لتفعيل المراجعة المتباعدة — يتم حفظ تقدمك في السحابة."
          )}
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <LogIn className="w-4 h-4" />
          {t("সাইন ইন", "Sign in", "تسجيل الدخول")}
        </Link>
      </div>
    );
  }

  const count = due?.length ?? 0;

  return (
    <div className="islamic-card p-5 relative overflow-hidden">
      <span className="corner-ornament top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
      <span className="corner-ornament top-0 left-0 border-t-2 border-l-2 rounded-tl-lg" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          <span className="font-semibold text-foreground">
            {t("আজকের রিভিউ", "Today's Review", "مراجعة اليوم")}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> SM-2
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("লোড হচ্ছে...", "Loading...", "جار التحميل...")}</p>
      ) : count === 0 ? (
        <div>
          <p className="text-3xl font-bold text-accent mb-1">0</p>
          <p className="text-xs text-muted-foreground">
            {t(
              "আজ আর কোনো আয়াত বাকি নেই। আলহামদুলিল্লাহ!",
              "Nothing due today. Alhamdulillah!",
              "لا شيء مستحق اليوم. الحمد لله!"
            )}
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-accent">{count}</p>
            <p className="text-xs text-muted-foreground">
              {t("আয়াত রিভিউ প্রয়োজন", "ayahs to review", "آيات للمراجعة")}
            </p>
          </div>
          <Link
            to="/hifz/review"
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            {t("রিভিউ শুরু", "Start Review", "ابدأ المراجعة")}
          </Link>
        </div>
      )}
    </div>
  );
}
