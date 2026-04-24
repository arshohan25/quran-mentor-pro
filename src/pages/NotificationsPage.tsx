import { Link } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, Clock, BookOpen, ScrollText, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { settings, update } = useNotificationSettings();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  const requestPerm = async () => {
    if (typeof Notification === "undefined") {
      toast.error(t("এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই", "Notifications not supported"));
      return;
    }
    const r = await Notification.requestPermission();
    setPermission(r);
    if (r === "granted") {
      update("master", true);
      toast.success(t("নোটিফিকেশন চালু হয়েছে", "Notifications enabled"));
    } else {
      toast.error(t("অনুমতি দেওয়া হয়নি", "Permission denied"));
    }
  };

  const testNotification = () => {
    if (permission !== "granted") {
      toast.error(t("আগে অনুমতি দিন", "Grant permission first"));
      return;
    }
    new Notification(t("🌙 টেস্ট নোটিফিকেশন", "🌙 Test Notification"), {
      body: t("সব ঠিকমতো কাজ করছে!", "Everything is working!"),
    });
  };

  const prayerToggles: { key: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"; bn: string; en: string }[] = [
    { key: "fajr", bn: "ফজর", en: "Fajr" },
    { key: "dhuhr", bn: "যোহর", en: "Dhuhr" },
    { key: "asr", bn: "আসর", en: "Asr" },
    { key: "maghrib", bn: "মাগরিব", en: "Maghrib" },
    { key: "isha", bn: "ইশা", en: "Isha" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="islamic-header">
        <div className="container flex items-center gap-3 relative z-10">
          <Link to="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-lg font-bold leading-tight">{t("নোটিফিকেশন", "Notifications", "التنبيهات")}</h1>
            <p className="text-primary-foreground/50 text-[10px]">
              {t("আযান ও দৈনিক রিমাইন্ডার", "Adhan & daily reminders")}
            </p>
          </div>
        </div>
      </header>

      <main className="container py-4 max-w-md mx-auto space-y-3">
        {/* Permission */}
        {permission !== "granted" && (
          <Card className="p-4 bg-accent/5 border-accent/30">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-accent mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {t("নোটিফিকেশন বন্ধ আছে", "Notifications are off")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("আযান ও রিমাইন্ডার পেতে অনুমতি দিন।", "Allow notifications to receive adhan and reminders.")}
                </p>
                <Button size="sm" className="mt-2" onClick={requestPerm}>
                  {t("অনুমতি দিন", "Grant Permission")}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Master */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold">{t("সব নোটিফিকেশন", "All Notifications")}</p>
                <p className="text-[11px] text-muted-foreground">{t("মাস্টার সুইচ", "Master switch")}</p>
              </div>
            </div>
            <Switch
              checked={settings.master && permission === "granted"}
              onCheckedChange={(v) => {
                if (v && permission !== "granted") requestPerm();
                else update("master", v);
              }}
            />
          </div>
          {settings.master && permission === "granted" && (
            <Button variant="outline" size="sm" className="w-full mt-3" onClick={testNotification}>
              {t("টেস্ট নোটিফিকেশন পাঠান", "Send Test Notification")}
            </Button>
          )}
        </Card>

        {/* Adhan */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">{t("আযান", "Adhan (Prayer Times)")}</h3>
          </div>
          {prayerToggles.map((p) => (
            <div key={p.key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{t(p.bn, p.en)}</span>
              <Switch checked={settings[p.key]} onCheckedChange={(v) => update(p.key, v)} disabled={!settings.master} />
            </div>
          ))}
          <div className="pt-2 border-t border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t("সময় অফসেট", "Time offset")}</span>
              <span className="text-xs font-semibold text-foreground">
                {settings.prayerOffsetMin > 0 ? "+" : ""}{settings.prayerOffsetMin} {t("মিনিট", "min")}
              </span>
            </div>
            <Slider
              min={-15} max={15} step={1}
              value={[settings.prayerOffsetMin]}
              onValueChange={(v) => update("prayerOffsetMin", v[0])}
              disabled={!settings.master}
            />
          </div>
        </Card>

        {/* Daily Ayah */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">{t("দৈনিক আয়াত", "Daily Ayah")}</h3>
            </div>
            <Switch checked={settings.dailyAyah} onCheckedChange={(v) => update("dailyAyah", v)} disabled={!settings.master} />
          </div>
          <Input
            type="time" value={settings.dailyAyahTime}
            onChange={(e) => update("dailyAyahTime", e.target.value)}
            disabled={!settings.master || !settings.dailyAyah}
          />
        </Card>

        {/* Daily Hadith */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">{t("দৈনিক হাদীস", "Daily Hadith")}</h3>
            </div>
            <Switch checked={settings.dailyHadith} onCheckedChange={(v) => update("dailyHadith", v)} disabled={!settings.master} />
          </div>
          <Input
            type="time" value={settings.dailyHadithTime}
            onChange={(e) => update("dailyHadithTime", e.target.value)}
            disabled={!settings.master || !settings.dailyHadith}
          />
        </Card>

        {/* Daily Dua */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandHeart className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">{t("দৈনিক দোয়া", "Daily Dua")}</h3>
            </div>
            <Switch checked={settings.dailyDua} onCheckedChange={(v) => update("dailyDua", v)} disabled={!settings.master} />
          </div>
          <Input
            type="time" value={settings.dailyDuaTime}
            onChange={(e) => update("dailyDuaTime", e.target.value)}
            disabled={!settings.master || !settings.dailyDua}
          />
        </Card>

        <p className="text-[10px] text-muted-foreground text-center px-2 leading-relaxed">
          {t(
            "নোটিফিকেশন পাঠাতে অ্যাপ খোলা থাকতে হবে অথবা PWA হিসেবে install করতে হবে।",
            "App must be open or installed as a PWA for notifications to fire.",
          )}
        </p>
      </main>
    </div>
  );
}
