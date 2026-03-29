import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Bell, BellOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { usePrayerAlarm } from "@/hooks/usePrayerAlarm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const prayerNames = {
  Fajr: { bn: "ফজর", en: "Fajr", ar: "الفجر", icon: "🌅" },
  Sunrise: { bn: "সূর্যোদয়", en: "Sunrise", ar: "الشروق", icon: "☀️" },
  Dhuhr: { bn: "যোহর", en: "Dhuhr", ar: "الظهر", icon: "🌤️" },
  Asr: { bn: "আসর", en: "Asr", ar: "العصر", icon: "⛅" },
  Maghrib: { bn: "মাগরিব", en: "Maghrib", ar: "المغرب", icon: "🌅" },
  Isha: { bn: "এশা", en: "Isha", ar: "العشاء", icon: "🌙" },
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
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">{t("নামাজের সময়সূচী", "Prayer Times", "أوقات الصلاة")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-6 max-w-lg">
        {/* Notification permission banner */}
        {permission !== "granted" && (
          <div className="bg-accent/20 border border-accent rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("🔔 নামাজের অ্যালার্ম চালু করুন", "🔔 Enable Prayer Alarms", "🔔 تفعيل تنبيهات الصلاة")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("নামাজের সময় হলে নোটিফিকেশন পাবেন", "Get notified at prayer times", "احصل على إشعارات أوقات الصلاة")}
              </p>
            </div>
            <Button size="sm" onClick={requestPermission}>
              {t("চালু করুন", "Enable", "تفعيل")}
            </Button>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          {loadingLocation ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span className="text-sm">{location?.city}, {location?.country}</span>
          )}
        </div>

        {/* Next prayer countdown */}
        {nextPrayer && timings && (
          <div className="bg-primary/10 rounded-xl p-5 mb-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t("পরবর্তী নামাজ", "Next Prayer", "الصلاة القادمة")}
            </p>
            <h2 className="text-2xl font-bold text-primary">
              {prayerNames[nextPrayer.name][langKey]}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{nextPrayer.countdown}</span>
            </div>
          </div>
        )}

        {/* Prayer times grid */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : timings ? (
          <div className="space-y-3">
            {prayerOrder.map((key) => {
              const isNext = nextPrayer?.name === key;
              const isAlarmable = key !== "Sunrise";
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                    isNext ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{prayerNames[key].icon}</span>
                    <div>
                      <p className={`font-semibold ${isNext ? "text-primary" : "text-foreground"}`}>
                        {prayerNames[key][langKey]}
                      </p>
                      {language !== "ar" && (
                        <p className="text-xs text-muted-foreground font-arabic">{prayerNames[key].ar}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold tabular-nums ${isNext ? "text-primary" : "text-foreground"}`}>
                      {(timings as any)[key]?.split(" ")[0]}
                    </span>
                    {isAlarmable && (
                      <button
                        onClick={() => toggleAlarm(key as AlarmablePrayer)}
                        className={`p-1.5 rounded-full transition-colors ${
                          alarms[key as AlarmablePrayer]
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={alarms[key as AlarmablePrayer] ? "Alarm On" : "Alarm Off"}
                      >
                        {alarms[key as AlarmablePrayer] ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
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
