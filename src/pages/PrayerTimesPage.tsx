import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Bell, BellOff, Sunrise, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { usePrayerAlarm } from "@/hooks/usePrayerAlarm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const prayerIcons: Record<string, any> = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: CloudSun,
  Maghrib: Sunset,
  Isha: Moon,
};

const prayerNames = {
  Fajr: { bn: "ফজর", en: "Fajr", ar: "الفجر" },
  Sunrise: { bn: "সূর্যোদয়", en: "Sunrise", ar: "الشروق" },
  Dhuhr: { bn: "যোহর", en: "Dhuhr", ar: "الظهر" },
  Asr: { bn: "আসর", en: "Asr", ar: "العصر" },
  Maghrib: { bn: "মাগরিব", en: "Maghrib", ar: "المغرب" },
  Isha: { bn: "এশা", en: "Isha", ar: "العشاء" },
};

type PrayerKey = keyof typeof prayerNames;
type AlarmablePrayer = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
const prayerOrder: PrayerKey[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

function getNextPrayer(timings: Record<string, string> | any): { name: PrayerKey; countdown: string } | null {
  const now = new Date();
  for (const key of prayerOrder) {
    if (key === "Sunrise") continue;
    const [h, m] = (timings[key] || "").split(":").map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(h, m, 0, 0);
    if (prayerTime > now) {
      const diff = prayerTime.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return { name: key, countdown: `${hours}h ${mins}m` };
    }
  }
  return { name: "Fajr", countdown: "—" };
}

export default function PrayerTimesPage() {
  const { t, language } = useLanguage();
  const { data: timings, isLoading, location, loadingLocation } = usePrayerTimes();
  const { alarms, toggleAlarm, permission, requestPermission } = usePrayerAlarm(timings);
  const [nextPrayer, setNextPrayer] = useState<{ name: PrayerKey; countdown: string } | null>(null);

  useEffect(() => {
    if (!timings) return;
    const update = () => setNextPrayer(getNextPrayer(timings));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timings]);

  const langKey = language === "bn" ? "bn" : language === "ar" ? "ar" : "en";

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 p-1"><ArrowLeft className="w-5 h-5" strokeWidth={1.8} /></Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("নামাজের সময়সূচী", "Prayer Times", "أوقات الصلاة")}</h1>
              <p className="text-primary-foreground/50 text-[10px]">{t("আপনার লোকেশন অনুযায়ী", "Based on your location", "حسب موقعك")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-5 max-w-lg">
        {permission !== "granted" && (
          <div className="premium-card p-4 mb-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, hsl(var(--accent) / 0.08), hsl(var(--accent) / 0.03))' }}>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-accent" strokeWidth={1.8} />
                {t("অ্যালার্ম চালু করুন", "Enable Alarms", "تفعيل التنبيهات")}
              </p>
              <p className="text-[11px] text-muted-foreground">{t("নামাজের সময় নোটিফিকেশন", "Get prayer notifications", "إشعارات الصلاة")}</p>
            </div>
            <Button size="sm" onClick={requestPermission} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
              {t("চালু", "Enable", "تفعيل")}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 text-accent" strokeWidth={1.8} />
          {loadingLocation ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span className="text-sm font-medium">{location?.city}, {location?.country}</span>
          )}
        </div>

        {nextPrayer && timings && (
          <div className="premium-card p-5 mb-5 text-center">
            <p className="text-xs text-muted-foreground mb-1 font-medium">
              {t("পরবর্তী নামাজ", "Next Prayer", "الصلاة القادمة")}
            </p>
            <div className="icon-container p-2.5 mx-auto w-fit mb-2">
              {(() => { const Icon = prayerIcons[nextPrayer.name]; return <Icon className="w-6 h-6 text-primary" strokeWidth={1.6} />; })()}
            </div>
            <h2 className="text-2xl font-bold text-primary">
              {prayerNames[nextPrayer.name][langKey]}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-accent font-bold">
              <Clock className="w-4 h-4" strokeWidth={1.8} />
              <span>{nextPrayer.countdown}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : timings ? (
          <div className="space-y-2.5">
            {prayerOrder.map((key) => {
              const isNext = nextPrayer?.name === key;
              const isAlarmable = key !== "Sunrise";
              const Icon = prayerIcons[key];
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                    isNext
                      ? "premium-card border-l-4 shadow-md"
                      : "border-border bg-card"
                  }`}
                  style={isNext ? { borderLeftColor: 'hsl(var(--accent))' } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className={`icon-container p-2 ${isNext ? '' : 'opacity-60'}`}>
                      <Icon className="w-4 h-4 text-primary" strokeWidth={1.6} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isNext ? "text-primary" : "text-foreground"}`}>
                        {prayerNames[key][langKey]}
                      </p>
                      {language !== "ar" && (
                        <p className="text-[10px] text-muted-foreground font-arabic">{prayerNames[key].ar}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold tabular-nums ${isNext ? "text-accent" : "text-foreground"}`}>
                      {(timings as any)[key]?.split(" ")[0]}
                    </span>
                    {isAlarmable && (
                      <button
                        onClick={() => toggleAlarm(key as AlarmablePrayer)}
                        className={`p-1.5 rounded-xl transition-colors ${
                          alarms[key as AlarmablePrayer]
                            ? "text-accent bg-accent/12"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {alarms[key as AlarmablePrayer] ? <Bell className="w-4 h-4" strokeWidth={1.8} /> : <BellOff className="w-4 h-4" strokeWidth={1.8} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
