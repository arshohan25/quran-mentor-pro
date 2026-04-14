import { useState, useEffect, useRef } from "react";
import { Bell, BellOff, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const STORAGE_KEY = "daily-amal-reminder";
const LAST_SENT_KEY = "daily-amal-reminder-last-sent";

interface ReminderSettings {
  enabled: boolean;
  times: string[]; // HH:MM format
}

const DEFAULT_TIMES = ["06:00", "12:00", "20:00"];
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, times: DEFAULT_TIMES };
}

function saveSettings(s: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function DailyAmalReminder() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<ReminderSettings>(loadSettings);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Check notifications every 30s
  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = now.getMinutes() < 30 ? "00" : "30";
      const currentSlot = `${hh}:${mm}`;
      const today = now.toISOString().slice(0, 10);
      const sentKey = localStorage.getItem(LAST_SENT_KEY);
      const sentSlots: string[] = sentKey ? JSON.parse(sentKey) : [];
      const tag = `${today}-${currentSlot}`;

      if (settings.times.includes(currentSlot) && !sentSlots.includes(tag)) {
        new Notification(
          t("আমল রিমাইন্ডার 🕌", "Amal Reminder 🕌", "تذكير بالأعمال 🕌"),
          {
            body: t(
              "আজকের আমলগুলো সম্পন্ন করুন। আল্লাহ আপনাকে কবুল করুন।",
              "Complete your daily amals. May Allah accept from you.",
              "أكمل أعمالك اليومية. تقبل الله منك."
            ),
            icon: "/favicon.ico",
            tag: `amal-reminder-${tag}`,
          }
        );
        sentSlots.push(tag);
        localStorage.setItem(LAST_SENT_KEY, JSON.stringify(sentSlots));
      }
    };

    check();
    intervalRef.current = setInterval(check, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings.enabled, settings.times, permission, t]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error(t("এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই", "Notifications not supported", "الإشعارات غير مدعومة"));
      return;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      toast.success(t("নোটিফিকেশন চালু হয়েছে ✅", "Notifications enabled ✅", "تم تفعيل الإشعارات ✅"));
    }
  };

  const toggleEnabled = () => {
    if (!settings.enabled && permission !== "granted") {
      requestPermission().then(() => {
        setSettings((s) => ({ ...s, enabled: true }));
      });
    } else {
      setSettings((s) => ({ ...s, enabled: !s.enabled }));
    }
  };

  const addTime = (time: string) => {
    if (!settings.times.includes(time)) {
      setSettings((s) => ({ ...s, times: [...s.times, time].sort() }));
    }
  };

  const removeTime = (time: string) => {
    setSettings((s) => ({ ...s, times: s.times.filter((t) => t !== time) }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground">
          {settings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-accent" />
            {t("আমল রিমাইন্ডার", "Amal Reminder", "تذكير بالأعمال")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">
              {t("রিমাইন্ডার চালু", "Enable Reminder", "تفعيل التذكير")}
            </span>
            <Switch checked={settings.enabled} onCheckedChange={toggleEnabled} />
          </div>

          {permission === "denied" && (
            <p className="text-xs text-destructive">
              {t(
                "নোটিফিকেশন ব্লক করা আছে। ব্রাউজার সেটিংস থেকে অনুমতি দিন।",
                "Notifications blocked. Allow from browser settings.",
                "الإشعارات محظورة. اسمح من إعدادات المتصفح."
              )}
            </p>
          )}

          {/* Time slots */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("রিমাইন্ডার সময়সূচি", "Reminder Schedule", "جدول التذكير")}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {settings.times.map((time) => (
                <button
                  key={time}
                  onClick={() => removeTime(time)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  {time}
                  <span className="ml-0.5">×</span>
                </button>
              ))}
            </div>

            <Select onValueChange={addTime}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t("সময় যোগ করুন", "Add time", "أضف وقتاً")} />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {TIME_OPTIONS.filter((t) => !settings.times.includes(t)).map((time) => (
                  <SelectItem key={time} value={time} className="text-xs">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-[10px] text-muted-foreground/70 text-center">
            {t(
              "ব্রাউজার ট্যাব খোলা থাকলে নোটিফিকেশন আসবে",
              "Notifications work when browser tab is open",
              "تعمل الإشعارات عندما يكون تبويب المتصفح مفتوحاً"
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
