import { useState, useEffect, useRef } from "react";
import { Bell, BellOff, Clock, Sparkles, X, Plus, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getTodayCompleted, TOTAL_AMALS } from "@/lib/dailyAmal";

const STORAGE_KEY = "daily-amal-reminder";
const LAST_SENT_KEY = "daily-amal-reminder-last-sent";

interface ReminderSettings {
  enabled: boolean;
  times: string[]; // HH:MM format (regular nudges)
  smartEnabled: boolean;
  smartTime: string; // HH:MM — fire only if user hasn't completed >= smartThreshold
  smartThreshold: number; // ratio 0..1 of TOTAL_AMALS
}

const DEFAULT_TIMES = ["06:00", "20:00"];
const PRESETS: { id: string; label: { bn: string; en: string; ar: string }; times: string[] }[] = [
  { id: "fajr-maghrib", label: { bn: "ফজর + মাগরিব", en: "Fajr + Maghrib", ar: "الفجر + المغرب" }, times: ["05:30", "18:30"] },
  { id: "morning-evening", label: { bn: "সকাল + সন্ধ্যা", en: "Morning + Evening", ar: "صباحاً + مساءً" }, times: ["07:00", "19:00"] },
  { id: "isha", label: { bn: "ইশার পর", en: "After Isha", ar: "بعد العشاء" }, times: ["21:00"] },
  { id: "thrice", label: { bn: "৩ বার", en: "3× Daily", ar: "٣ مرات" }, times: ["06:00", "13:00", "20:00"] },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        enabled: !!p.enabled,
        times: Array.isArray(p.times) && p.times.length ? p.times : DEFAULT_TIMES,
        smartEnabled: p.smartEnabled ?? true,
        smartTime: p.smartTime ?? "21:30",
        smartThreshold: typeof p.smartThreshold === "number" ? p.smartThreshold : 0.5,
      };
    }
  } catch {}
  return { enabled: false, times: DEFAULT_TIMES, smartEnabled: true, smartTime: "21:30", smartThreshold: 0.5 };
}

function saveSettings(s: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function DailyAmalReminder() {
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState<ReminderSettings>(loadSettings);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [customTime, setCustomTime] = useState<string>("");
  const [loadedAt] = useState<Date>(() => new Date());
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isFirstRun = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveSettings(settings);
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSavedAt(new Date());
  }, [settings]);

  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return;

    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = now.getMinutes() < 30 ? "00" : "30";
      const currentSlot = `${hh}:${mm}`;
      const today = now.toISOString().slice(0, 10);
      const sentRaw = localStorage.getItem(LAST_SENT_KEY);
      const sentSlots: string[] = sentRaw ? JSON.parse(sentRaw) : [];

      // Regular slot reminders
      const regularTag = `${today}-reg-${currentSlot}`;
      if (settings.times.includes(currentSlot) && !sentSlots.includes(regularTag)) {
        new Notification(
          t("আমল রিমাইন্ডার 🕌", "Amal Reminder 🕌", "تذكير بالأعمال 🕌"),
          {
            body: t(
              "আজকের আমলগুলো সম্পন্ন করুন। আল্লাহ আপনাকে কবুল করুন।",
              "Complete your daily amals. May Allah accept from you.",
              "أكمل أعمالك اليومية. تقبل الله منك."
            ),
            icon: "/favicon.ico",
            tag: regularTag,
          }
        );
        sentSlots.push(regularTag);
      }

      // Smart "forgot" reminder — only if below threshold at smart time
      if (settings.smartEnabled) {
        const smartHH = settings.smartTime.slice(0, 2);
        const smartMM = parseInt(settings.smartTime.slice(3, 5), 10) < 30 ? "00" : "30";
        const smartSlot = `${smartHH}:${smartMM}`;
        const smartTag = `${today}-smart`;
        if (currentSlot === smartSlot && !sentSlots.includes(smartTag)) {
          const done = getTodayCompleted().length;
          const need = Math.ceil(TOTAL_AMALS * settings.smartThreshold);
          if (done < need) {
            const remaining = TOTAL_AMALS - done;
            new Notification(
              t("আজকের আমল ভুলে গেছেন? 🌙", "Forgot today's amal? 🌙", "هل نسيت عمل اليوم؟ 🌙"),
              {
                body: t(
                  `এখনও ${remaining}টি আমল বাকি। দিন শেষ হওয়ার আগে কিছু পূরণ করে নিন।`,
                  `Still ${remaining} amals left. Complete a few before the day ends.`,
                  `لا يزال ${remaining} عملاً متبقياً. أكمل القليل قبل انتهاء اليوم.`
                ),
                icon: "/favicon.ico",
                tag: smartTag,
                requireInteraction: false,
              }
            );
            sentSlots.push(smartTag);
          } else {
            sentSlots.push(smartTag); // mark to avoid re-checks
          }
        }
      }

      localStorage.setItem(LAST_SENT_KEY, JSON.stringify(sentSlots));
    };

    check();
    intervalRef.current = setInterval(check, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings, permission, t]);

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
    if (!time) return;
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    if (!settings.times.includes(time)) {
      setSettings((s) => ({ ...s, times: [...s.times, time].sort() }));
      toast.success(t("সময় যোগ হয়েছে", "Time added", "تمت إضافة الوقت"));
    }
  };

  const removeTime = (time: string) => {
    setSettings((s) => ({ ...s, times: s.times.filter((x) => x !== time) }));
  };

  const applyPreset = (times: string[]) => {
    setSettings((s) => ({ ...s, times: [...times].sort() }));
    toast.success(t("প্রিসেট প্রয়োগ হয়েছে", "Preset applied", "تم تطبيق الإعداد"));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground">
          {settings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-accent" />
            {t("আমল রিমাইন্ডার", "Amal Reminder", "تذكير بالأعمال")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Master toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("রিমাইন্ডার চালু", "Enable Reminder", "تفعيل التذكير")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("ব্রাউজার খোলা থাকলে কাজ করবে", "Works when browser is open", "يعمل عند فتح المتصفح")}
              </p>
            </div>
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

          {/* Status indicator */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-[10px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span>
                {savedAt
                  ? t(`সেভ হয়েছে ${savedAt.toLocaleTimeString(language === "bn" ? "bn-BD" : language === "ar" ? "ar" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
                      `Saved ${savedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
                      `حُفظ ${savedAt.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`)
                  : t(`লোড ${loadedAt.toLocaleTimeString(language === "bn" ? "bn-BD" : "en-US", { hour: "2-digit", minute: "2-digit" })}`,
                      `Loaded ${loadedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
                      `حُمّل ${loadedAt.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}`)}
              </span>
            </div>
            <span className="font-semibold text-accent tabular-nums">
              {t("থ্রেশহোল্ড", "Threshold", "الحد")}: {Math.ceil(TOTAL_AMALS * settings.smartThreshold)}/{TOTAL_AMALS}
            </span>
          </div>

          {/* Smart "forgot" reminder */}
          <div className="space-y-2 p-3 rounded-lg border border-accent/30 bg-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <p className="text-sm font-semibold text-foreground">
                  {t("স্মার্ট রিমাইন্ডার", "Smart Reminder", "تذكير ذكي")}
                </p>
              </div>
              <Switch
                checked={settings.smartEnabled}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, smartEnabled: v }))}
              />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {t(
                "নির্দিষ্ট সময়ে যদি আজকের অর্ধেকের কম আমল হয় — শুধু তখনই নুড করবে।",
                "Only nudges if you've completed less than half by this time.",
                "ينبه فقط إذا أكملت أقل من النصف بحلول هذا الوقت."
              )}
            </p>
            {settings.smartEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="time"
                    value={settings.smartTime}
                    onChange={(e) => setSettings((s) => ({ ...s, smartTime: e.target.value || "21:30" }))}
                    className="h-8 text-xs flex-1"
                  />
                </div>

                {/* Threshold slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-foreground">
                      {t("নুড থ্রেশহোল্ড", "Nudge threshold", "حد التنبيه")}
                    </p>
                    <span className="text-[11px] font-bold text-accent tabular-nums">
                      {Math.ceil(TOTAL_AMALS * settings.smartThreshold)} / {TOTAL_AMALS}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={TOTAL_AMALS}
                    step={1}
                    value={[Math.ceil(TOTAL_AMALS * settings.smartThreshold)]}
                    onValueChange={([v]) =>
                      setSettings((s) => ({ ...s, smartThreshold: v / TOTAL_AMALS }))
                    }
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {t(
                      `এর কম হলে নুড করবে (${Math.round(settings.smartThreshold * 100)}%)`,
                      `Nudges if completed less than this (${Math.round(settings.smartThreshold * 100)}%)`,
                      `ينبه إذا أكملت أقل من ذلك (${Math.round(settings.smartThreshold * 100)}%)`
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("দ্রুত প্রিসেট", "Quick Presets", "إعدادات سريعة")}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.times)}
                  className="text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-muted hover:border-accent/40 transition-colors text-left"
                >
                  {p.label[language as "bn" | "en" | "ar"]}
                  <div className="text-[9px] text-muted-foreground mt-0.5">{p.times.join(" · ")}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("রিমাইন্ডার সময়সূচি", "Reminder Schedule", "جدول التذكير")}
            </p>

            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {settings.times.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  {t("কোনো সময় যোগ করা হয়নি", "No times added yet", "لم تتم إضافة أوقات")}
                </p>
              )}
              {settings.times.map((time) => (
                <button
                  key={time}
                  onClick={() => removeTime(time)}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  {time}
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              ))}
            </div>

            {/* Custom time picker */}
            <div className="flex items-center gap-1.5">
              <Input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => {
                  addTime(customTime);
                  setCustomTime("");
                }}
                disabled={!customTime}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Or pick from common slots */}
            <Select onValueChange={addTime}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t("সাধারণ সময় থেকে বাছুন", "Pick a common time", "اختر وقتاً")} />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {TIME_OPTIONS.filter((tm) => !settings.times.includes(tm)).map((time) => (
                  <SelectItem key={time} value={time} className="text-xs">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
