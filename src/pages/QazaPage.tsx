import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Minus, RotateCcw, Flame, Settings2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQazaTracker, WAQTS, type Waqt, type QazaCounts } from "@/hooks/useQazaTracker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const WAQT_LABELS: Record<Waqt, { bn: string; en: string; ar: string }> = {
  fajr: { bn: "ফজর", en: "Fajr", ar: "الفجر" },
  dhuhr: { bn: "যোহর", en: "Dhuhr", ar: "الظهر" },
  asr: { bn: "আসর", en: "Asr", ar: "العصر" },
  maghrib: { bn: "মাগরিব", en: "Maghrib", ar: "المغرب" },
  isha: { bn: "ইশা", en: "Isha", ar: "العشاء" },
  witr: { bn: "বিতর", en: "Witr", ar: "الوتر" },
};

function ProgressRing({ pct, size = 60 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="hsl(var(--primary))" strokeWidth="4" fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s" }}
      />
    </svg>
  );
}

export default function QazaPage() {
  const { t, language } = useLanguage();
  const tracker = useQazaTracker();
  const [editing, setEditing] = useState(!tracker.isSetup);

  if (editing) {
    return <SetupForm
      initial={tracker.state.initial}
      isFirst={!tracker.isSetup}
      onCancel={() => setEditing(false)}
      onSave={(counts) => {
        tracker.isSetup ? tracker.updateInitial(counts) : tracker.setupInitial(counts);
        toast.success(t("সংরক্ষিত হয়েছে", "Saved"));
        setEditing(false);
      }}
    />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="islamic-header">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t("কাযা ট্র্যাকার", "Qaza Tracker", "تتبع القضاء")}</h1>
              <p className="text-primary-foreground/50 text-[10px]">{t("ছুটে যাওয়া নামাজ আদায় করুন", "Make up missed prayers")}</p>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="p-2 hover:bg-primary-foreground/10 rounded-lg">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container py-4 max-w-2xl mx-auto space-y-4">
        {/* Overall summary */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <ProgressRing pct={tracker.overallPct} size={80} />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t("সামগ্রিক অগ্রগতি", "Overall Progress")}</p>
              <p className="text-2xl font-bold text-primary">{tracker.overallPct}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {tracker.totalCompleted} / {tracker.totalInitial} {t("সম্পন্ন", "completed")}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-accent justify-end">
                <Flame className="w-4 h-4" />
                <span className="text-xl font-bold">{tracker.streak}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("দিন স্ট্রিক", "day streak")}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/40 flex justify-between text-xs">
            <span className="text-muted-foreground">{t("বাকি", "Remaining")}</span>
            <span className="font-semibold text-foreground">{tracker.totalRemaining}</span>
          </div>
        </Card>

        {/* Waqt cards */}
        <div className="grid grid-cols-2 gap-2">
          {WAQTS.map((w) => {
            const initial = tracker.state.initial[w];
            const completed = tracker.state.completed[w];
            const remaining = tracker.remaining[w];
            const pct = initial > 0 ? Math.round((completed / initial) * 100) : 0;
            const label = WAQT_LABELS[w][language === "bn" ? "bn" : language === "ar" ? "ar" : "en"];
            return (
              <Card key={w} className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {remaining} {t("বাকি", "left")} · {pct}%
                    </p>
                  </div>
                  <ProgressRing pct={pct} size={36} />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm" variant="outline" className="flex-1 h-8"
                    onClick={() => tracker.undoToday(w)}
                    disabled={(tracker.state.dailyLog[new Date().toISOString().slice(0, 10)]?.[w] || 0) === 0}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm" className="flex-1 h-8"
                    onClick={() => {
                      if (remaining === 0) toast.info(t("সব আদায় হয়ে গেছে!", "All completed!"));
                      else tracker.logMakeup(w, 1);
                    }}
                    disabled={remaining === 0}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 30-day chart */}
        <Card className="p-4">
          <h3 className="text-sm font-bold mb-3">{t("গত ৩০ দিন", "Last 30 Days")}</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tracker.chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={4} />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} width={20} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8, fontSize: 11,
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Reset */}
        <Card className="p-3">
          <Button
            variant="ghost" size="sm" className="w-full text-destructive"
            onClick={() => {
              if (confirm(t("সব ডেটা মুছে ফেলতে চান?", "Reset all data?"))) {
                tracker.reset();
                setEditing(true);
                toast.success(t("রিসেট হয়েছে", "Reset complete"));
              }
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {t("সব ডেটা রিসেট করুন", "Reset all data")}
          </Button>
        </Card>
      </main>
    </div>
  );
}

function SetupForm({
  initial, isFirst, onSave, onCancel,
}: {
  initial: QazaCounts; isFirst: boolean;
  onSave: (counts: QazaCounts) => void;
  onCancel: () => void;
}) {
  const { t, language } = useLanguage();
  const [counts, setCounts] = useState<QazaCounts>(initial);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="islamic-header">
        <div className="container flex items-center gap-3 relative z-10">
          <Link to="/" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold">
            {isFirst ? t("শুরু করুন", "Get Started") : t("সম্পাদনা", "Edit")}
          </h1>
        </div>
      </header>
      <main className="container py-4 max-w-md mx-auto space-y-4">
        <Card className="p-4 bg-accent/5 border-accent/20">
          <p className="text-xs leading-relaxed text-foreground/80">
            {t(
              "আনুমানিক কতটি নামাজ ছুটে গেছে প্রতিটি ওয়াক্তের জন্য লিখুন। পরে যেকোনো সময় পরিবর্তন করতে পারবেন।",
              "Estimate how many prayers you've missed for each waqt. You can edit later anytime.",
            )}
          </p>
        </Card>
        {WAQTS.map((w) => {
          const label = WAQT_LABELS[w][language === "bn" ? "bn" : language === "ar" ? "ar" : "en"];
          return (
            <div key={w} className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-foreground flex-1">{label}</label>
              <Input
                type="number" min={0} value={counts[w]}
                onChange={(e) => setCounts({ ...counts, [w]: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-28 text-right"
              />
            </div>
          );
        })}
        <div className="flex gap-2 pt-2">
          {!isFirst && (
            <Button variant="outline" className="flex-1" onClick={onCancel}>{t("বাতিল", "Cancel")}</Button>
          )}
          <Button className="flex-1" onClick={() => onSave(counts)}>
            {isFirst ? t("শুরু করুন", "Start Tracking") : t("সংরক্ষণ", "Save")}
          </Button>
        </div>
      </main>
    </div>
  );
}
