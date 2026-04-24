import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Volume2, Repeat, Eraser, Info } from "lucide-react";
import { ApiHadith } from "@/hooks/useHadithApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hadith: ApiHadith;
}

type Lang = "ar" | "bn" | "en";

// Split a passage into "sections" (sentences) and tokens (words) per section.
function splitIntoSections(text: string, lang: Lang): { text: string; words: string[] }[] {
  if (!text) return [];
  // Split on sentence-ending punctuation while preserving meaning.
  const splitter =
    lang === "ar"
      ? /(?<=[\u06D4\.\!\?])\s+/ // Arabic full stop ۔ + Latin
      : /(?<=[।\.\!\?])\s+/; // Bengali daari ।
  const sentences = text.split(splitter).map((s) => s.trim()).filter(Boolean);
  return sentences.map((s) => ({
    text: s,
    words: s.split(/\s+/).filter(Boolean),
  }));
}

function speak(text: string, lang: Lang, rate: number, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : lang === "bn" ? "bn-BD" : "en-US";
  u.rate = rate;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

export default function HadithPracticeDialog({ open, onOpenChange, hadith }: Props) {
  const { t } = useLanguage();
  const [lang, setLang] = useState<Lang>(hadith.hadithArabic ? "ar" : hadith.hadithBengali ? "bn" : "en");
  const [rate, setRate] = useState(0.85);
  const [activeSection, setActiveSection] = useState(0);
  const [playing, setPlaying] = useState(false);
  // wrong[sectionIdx] = Set of word indices marked wrong
  const [wrong, setWrong] = useState<Record<number, Set<number>>>({});
  const stoppedRef = useRef(false);

  const sourceText = useMemo(() => {
    if (lang === "ar") return hadith.hadithArabic || "";
    if (lang === "bn") return hadith.hadithBengali || "";
    return hadith.hadithEnglish || "";
  }, [lang, hadith]);

  const sections = useMemo(() => splitIntoSections(sourceText, lang), [sourceText, lang]);

  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      stoppedRef.current = true;
    } else {
      stoppedRef.current = false;
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [open]);

  const toggleWord = (sIdx: number, wIdx: number) => {
    setWrong((prev) => {
      const next = { ...prev };
      const set = new Set(next[sIdx] || []);
      if (set.has(wIdx)) set.delete(wIdx);
      else set.add(wIdx);
      next[sIdx] = set;
      return next;
    });
  };

  const playFrom = (idx: number) => {
    if (!sections[idx]) return;
    stoppedRef.current = false;
    setPlaying(true);
    setActiveSection(idx);
    const playNext = (i: number) => {
      if (stoppedRef.current || i >= sections.length) {
        setPlaying(false);
        return;
      }
      setActiveSection(i);
      speak(sections[i].text, lang, rate, () => playNext(i + 1));
    };
    playNext(idx);
  };

  const playSection = (idx: number) => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
    setTimeout(() => {
      stoppedRef.current = false;
      setPlaying(true);
      setActiveSection(idx);
      speak(sections[idx].text, lang, rate, () => setPlaying(false));
    }, 60);
  };

  const stop = () => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };

  const repeatActive = () => playSection(activeSection);

  const repeatWrongSections = () => {
    const list = Object.entries(wrong)
      .filter(([, set]) => set.size > 0)
      .map(([k]) => Number(k))
      .sort((a, b) => a - b);
    if (list.length === 0) {
      toast.info(t("কোনো ভুল চিহ্নিত করা হয়নি", "No mistakes marked yet"));
      return;
    }
    stoppedRef.current = false;
    setPlaying(true);
    let i = 0;
    const next = () => {
      if (stoppedRef.current || i >= list.length) {
        setPlaying(false);
        return;
      }
      const idx = list[i++];
      setActiveSection(idx);
      speak(sections[idx].text, lang, rate, next);
    };
    next();
  };

  const clearMarks = () => setWrong({});

  const totalWrong = Object.values(wrong).reduce((sum, s) => sum + s.size, 0);
  const totalWords = sections.reduce((s, sec) => s + sec.words.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t("হাদীস অনুশীলন", "Hadith Practice")} #{hadith.hadithNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Language selector */}
        <div className="flex flex-wrap items-center gap-2">
          {hadith.hadithArabic && (
            <Button size="sm" variant={lang === "ar" ? "default" : "outline"} onClick={() => { stop(); setLang("ar"); setActiveSection(0); setWrong({}); }}>
              العربية
            </Button>
          )}
          {hadith.hadithBengali && (
            <Button size="sm" variant={lang === "bn" ? "default" : "outline"} onClick={() => { stop(); setLang("bn"); setActiveSection(0); setWrong({}); }}>
              বাংলা
            </Button>
          )}
          {hadith.hadithEnglish && (
            <Button size="sm" variant={lang === "en" ? "default" : "outline"} onClick={() => { stop(); setLang("en"); setActiveSection(0); setWrong({}); }}>
              English
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="text-xs bg-muted rounded-md px-2 py-1 border border-border"
            >
              <option value={0.6}>0.6x</option>
              <option value={0.75}>0.75x</option>
              <option value={0.85}>0.85x</option>
              <option value={1}>1x</option>
              <option value={1.15}>1.15x</option>
            </select>
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            {t(
              "শুনুন, পড়ুন, তারপর যেসব শব্দ ভুল পড়েছেন সেগুলোতে ট্যাপ করুন — সেগুলো লাল হয়ে যাবে। নির্দিষ্ট অংশ আবার শুনতে 'এই অংশ পুনরায়' চাপুন।",
              "Listen, recite, then tap words you misread — they'll turn red. Use 'Repeat section' to replay that line."
            )}
          </p>
        </div>

        {/* Sections / words */}
        <div className="space-y-3">
          {sections.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              {t("এই ভাষায় টেক্সট নেই", "No text in this language")}
            </p>
          )}
          {sections.map((sec, sIdx) => {
            const isActive = sIdx === activeSection;
            const isRtl = lang === "ar";
            return (
              <div
                key={sIdx}
                className={`rounded-xl p-3 border transition-colors ${
                  isActive ? "border-primary/60 bg-primary/5" : "border-border/50 bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {t("অংশ", "Section")} {sIdx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playSection(sIdx)}
                      className="p-1.5 rounded-md hover:bg-muted text-primary"
                      aria-label={t("এই অংশ পুনরায়", "Repeat section")}
                    >
                      <Repeat className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p
                  dir={isRtl ? "rtl" : "ltr"}
                  className={`leading-loose ${isRtl ? "font-arabic text-xl text-right" : "text-sm"}`}
                >
                  {sec.words.map((w, wIdx) => {
                    const isWrong = wrong[sIdx]?.has(wIdx);
                    return (
                      <span
                        key={wIdx}
                        onClick={() => toggleWord(sIdx, wIdx)}
                        className={`cursor-pointer rounded px-0.5 transition-colors ${
                          isWrong
                            ? "text-destructive underline decoration-2 decoration-destructive/70 bg-destructive/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        {w}{" "}
                      </span>
                    );
                  })}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        {sections.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
            <span>
              {t("ভুল চিহ্নিত", "Marked wrong")}:{" "}
              <span className="text-destructive font-bold">{totalWrong}</span> / {totalWords}
            </span>
            <button onClick={clearMarks} className="flex items-center gap-1 hover:text-foreground">
              <Eraser className="w-3 h-3" /> {t("পরিষ্কার", "Clear")}
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {playing ? (
            <Button onClick={stop} variant="secondary" className="w-full">
              <Pause className="w-4 h-4 mr-1.5" /> {t("থামান", "Pause")}
            </Button>
          ) : (
            <Button onClick={() => playFrom(activeSection)} className="w-full">
              <Play className="w-4 h-4 mr-1.5" /> {t("শুনুন", "Listen")}
            </Button>
          )}
          <Button onClick={repeatActive} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-1.5" /> {t("এই অংশ পুনরায়", "Repeat section")}
          </Button>
          <Button
            onClick={repeatWrongSections}
            variant="outline"
            className="w-full col-span-2"
            disabled={totalWrong === 0}
          >
            <Repeat className="w-4 h-4 mr-1.5" /> {t("ভুল অংশগুলো পুনরায়", "Replay wrong sections")} {totalWrong > 0 && `(${Object.values(wrong).filter(s => s.size > 0).length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
