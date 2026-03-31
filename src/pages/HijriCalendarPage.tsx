import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

const HIJRI_MONTHS = [
  { en: "Muharram", bn: "মুহাররম", ar: "محرم" },
  { en: "Safar", bn: "সফর", ar: "صفر" },
  { en: "Rabi al-Awwal", bn: "রবিউল আউয়াল", ar: "ربيع الأول" },
  { en: "Rabi al-Thani", bn: "রবিউস সানি", ar: "ربيع الثاني" },
  { en: "Jumada al-Ula", bn: "জুমাদাল উলা", ar: "جمادى الأولى" },
  { en: "Jumada al-Thani", bn: "জুমাদাস সানি", ar: "جمادى الثانية" },
  { en: "Rajab", bn: "রজব", ar: "رجب" },
  { en: "Shaban", bn: "শা'বান", ar: "شعبان" },
  { en: "Ramadan", bn: "রমযান", ar: "رمضان" },
  { en: "Shawwal", bn: "শাওয়াল", ar: "شوال" },
  { en: "Dhul Qadah", bn: "যিলক্বদ", ar: "ذو القعدة" },
  { en: "Dhul Hijjah", bn: "যিলহজ্জ", ar: "ذو الحجة" },
];

const IMPORTANT_DATES: { month: number; day: number; bn: string; en: string; ar: string }[] = [
  { month: 1, day: 1, bn: "হিজরি নববর্ষ", en: "Islamic New Year", ar: "رأس السنة الهجرية" },
  { month: 1, day: 10, bn: "আশুরা", en: "Ashura", ar: "عاشوراء" },
  { month: 3, day: 12, bn: "ঈদে মিলাদুন্নবী", en: "Mawlid al-Nabi", ar: "المولد النبوي" },
  { month: 7, day: 27, bn: "শবে মেরাজ", en: "Isra & Mi'raj", ar: "الإسراء والمعراج" },
  { month: 8, day: 15, bn: "শবে বরাত", en: "Mid-Sha'ban", ar: "ليلة النصف من شعبان" },
  { month: 9, day: 1, bn: "রমযান শুরু", en: "Ramadan Begins", ar: "بداية رمضان" },
  { month: 9, day: 27, bn: "শবে কদর (সম্ভাব্য)", en: "Laylat al-Qadr (est.)", ar: "ليلة القدر" },
  { month: 10, day: 1, bn: "ঈদুল ফিতর", en: "Eid al-Fitr", ar: "عيد الفطر" },
  { month: 12, day: 9, bn: "আরাফার দিন", en: "Day of Arafah", ar: "يوم عرفة" },
  { month: 12, day: 10, bn: "ঈদুল আযহা", en: "Eid al-Adha", ar: "عيد الأضحى" },
];

interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

export default function HijriCalendarPage() {
  const { t, language } = useLanguage();
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [gregorian, setGregorian] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState<number>(0); // offset from current

  useEffect(() => {
    const today = new Date();
    setGregorian(today.toLocaleDateString(language === "bn" ? "bn-BD" : language === "ar" ? "ar-SA" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    }));

    // Fetch from Aladhan API
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    fetch(`https://api.aladhan.com/v1/gpiToH/${dd}-${mm}-${yyyy}`)
      .then(r => r.json())
      .then(data => {
        const h = data.data.hijri;
        setHijriDate({
          day: parseInt(h.day),
          month: parseInt(h.month.number),
          year: parseInt(h.year),
          monthName: h.month.en,
        });
        setLoading(false);
      })
      .catch(() => {
        // Fallback approximation
        const msPerHijriYear = 354.36667 * 24 * 3600 * 1000;
        const hijriEpoch = new Date(622, 6, 16).getTime();
        const hijriYears = (today.getTime() - hijriEpoch) / msPerHijriYear;
        const year = Math.floor(hijriYears);
        const dayOfYear = (hijriYears - year) * 354.36667;
        let month = Math.floor(dayOfYear / 29.5) + 1;
        if (month > 12) month = 12;
        const day = Math.floor(dayOfYear % 29.5) + 1;
        setHijriDate({ day, month, year, monthName: HIJRI_MONTHS[month - 1].en });
        setLoading(false);
      });
  }, [language]);

  const currentHijriMonth = hijriDate ? hijriDate.month + viewMonth : 1;
  const adjustedMonth = ((currentHijriMonth - 1 + 120) % 12) + 1;
  const monthInfo = HIJRI_MONTHS[adjustedMonth - 1];
  const daysInMonth = adjustedMonth % 2 === 1 ? 30 : 29;
  const eventsThisMonth = IMPORTANT_DATES.filter(e => e.month === adjustedMonth);

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-lg font-bold">{t("হিজরি ক্যালেন্ডার", "Hijri Calendar", "التقويم الهجري")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-5 space-y-5 max-w-md mx-auto">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("লোড হচ্ছে...", "Loading...", "جاري التحميل...")}</div>
        ) : (
          <>
            {/* Today's date card */}
            <div className="islamic-card p-5 text-center space-y-2">
              <p className="text-xs text-muted-foreground">{gregorian}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-accent text-lg">☪</span>
                <p className="text-2xl font-bold text-foreground">
                  {hijriDate!.day} {language === "bn" ? HIJRI_MONTHS[hijriDate!.month - 1].bn : language === "ar" ? HIJRI_MONTHS[hijriDate!.month - 1].ar : hijriDate!.monthName}
                </p>
              </div>
              <p className="text-lg text-primary font-semibold">{hijriDate!.year} {t("হিজরি", "AH", "هـ")}</p>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setViewMonth(v => v - 1)}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {language === "bn" ? monthInfo.bn : language === "ar" ? monthInfo.ar : monthInfo.en}
                </p>
                <p className="text-xs text-muted-foreground">{daysInMonth} {t("দিন", "days", "يوم")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewMonth(v => v + 1)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Calendar grid */}
            <div className="islamic-card p-3">
              <div className="grid grid-cols-7 gap-1 text-center">
                {[t("শ", "S", "أ"), t("র", "M", "إ"), t("ম", "T", "ث"), t("ব", "W", "أ"), t("বৃ", "T", "خ"), t("শু", "F", "ج"), t("শ", "S", "س")].map((d, i) => (
                  <div key={i} className={`text-[10px] font-medium py-1 ${i === 5 ? "text-primary" : "text-muted-foreground"}`}>{d}</div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isToday = viewMonth === 0 && day === hijriDate!.day;
                  const hasEvent = eventsThisMonth.some(e => e.day === day);
                  return (
                    <div
                      key={day}
                      className={`relative py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : hasEvent
                          ? "bg-accent/15 text-accent font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {day}
                      {hasEvent && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Events this month */}
            {eventsThisMonth.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-accent" />
                  {t("এই মাসের গুরুত্বপূর্ণ দিন", "Important Dates", "التواريخ المهمة")}
                </h3>
                {eventsThisMonth.map((event, i) => (
                  <div key={i} className="islamic-card p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-accent">{event.day}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {language === "bn" ? event.bn : language === "ar" ? event.ar : event.en}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {language === "bn" ? monthInfo.bn : language === "ar" ? monthInfo.ar : monthInfo.en} {event.day}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All important dates */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t("বছরের প্রধান দিনগুলো", "Key Islamic Dates", "التواريخ الإسلامية الرئيسية")}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {IMPORTANT_DATES.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border/50">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-xs font-bold text-primary">{event.day}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {language === "bn" ? HIJRI_MONTHS[event.month - 1].bn : HIJRI_MONTHS[event.month - 1].en}
                      </p>
                    </div>
                    <p className="text-xs text-foreground">
                      {language === "bn" ? event.bn : language === "ar" ? event.ar : event.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
