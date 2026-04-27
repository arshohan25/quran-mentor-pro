import { useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useArabicRecitationEngine } from "@/hooks/useArabicRecitationEngine";
import { useRecitationRecorder } from "@/hooks/useRecitationRecorder";
import { useSelectedReciter } from "@/hooks/useSelectedReciter";
import { useLanguage } from "@/contexts/LanguageContext";
import SessionReciterPicker from "./SessionReciterPicker";
import type { MatchMode } from "@/utils/arabicUtils";

interface InlineRecitationProps {
  ayahText: string;
  onComplete: () => void;
  onCancel: () => void;
  mode?: MatchMode;
  /** Optional — pass surah + ayah (numberInSurah) to record per-word stats */
  surah?: number;
  ayah?: number;
  /** Optional override; defaults to the app-wide selected qari */
  reciter?: string | null;
}

export default function LiveRecitationCheck({ ayahText, onComplete, onCancel, mode = "balanced", surah, ayah, reciter }: InlineRecitationProps) {
  const { t } = useLanguage();
  const { reciterId } = useSelectedReciter();
  // Session-scoped override: null = follow app-wide selection (or the
  // explicit `reciter` prop, if a parent passed one).
  const [sessionReciter, setSessionReciter] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const handleComplete = () => { setCompleted(true); onComplete(); };
  const { state, toggleListening, stopListening } = useArabicRecitationEngine(ayahText, mode, handleComplete);
  const { words, revealedIndex, errorIndex, isListening, lastSpoken, speechError, totalWords } = state;

  // Reset completion flag whenever the ayah text changes
  useEffect(() => { setCompleted(false); }, [ayahText]);

  const effectiveReciter = sessionReciter ?? reciter ?? reciterId;

  useRecitationRecorder({
    surah: surah ?? null,
    ayah: ayah ?? null,
    state,
    completed,
    mode: "live",
    reciter: effectiveReciter,
  });

  return (
    <div className="space-y-2">
      {/* Inline word display */}
      <div className="flex flex-wrap gap-x-2 gap-y-1 justify-end" dir="rtl">
        {words.map((word, i) => {
          const isRevealed = i < revealedIndex;
          const isCurrent = i === revealedIndex;
          const isError = errorIndex === i;

          return (
            <span
              key={i}
              className={`font-arabic text-lg md:text-xl transition-all duration-200 ${
                isRevealed
                  ? "text-foreground"
                  : isError
                  ? "text-destructive font-bold bg-destructive/10 px-1 rounded"
                  : isCurrent
                  ? "text-primary font-semibold border-b-2 border-primary"
                  : "text-muted-foreground/20 select-none"
              }`}
              style={!isRevealed && !isError && !isCurrent ? { filter: "blur(5px)" } : undefined}
            >
              {isRevealed || isCurrent || isError ? word : word}
            </span>
          );
        })}
      </div>

      {/* Inline controls row */}
      <div className="flex items-center gap-2" dir="ltr">
        <button
          onClick={toggleListening}
          className={`p-1.5 rounded-full transition-all ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-primary text-primary-foreground hover:scale-105"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Mini progress */}
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${totalWords > 0 ? (revealedIndex / totalWords) * 100 : 0}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{revealedIndex}/{totalWords}</span>

        <button
          onClick={() => { stopListening(); onCancel(); }}
          className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border"
        >
          ✕
        </button>
      </div>

      {/* Session reciter override (does not change global preference) */}
      <div className="flex items-center justify-end" dir="ltr">
        <SessionReciterPicker
          value={sessionReciter}
          onChange={setSessionReciter}
          variant="default"
          className="!h-7 !text-[10px] max-w-[200px]"
        />
      </div>

      {/* Error feedback */}
      {errorIndex !== null && (
        <div className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <p className="text-[10px] font-medium">
            {t("ভুল! সঠিক শব্দ বলুন", "Wrong! Say the correct word", "خطأ! قل الكلمة الصحيحة")}
          </p>
        </div>
      )}

      {speechError && (
        <p className="text-[10px] text-muted-foreground">{speechError}</p>
      )}

      {lastSpoken && (
        <p className="text-[10px] text-muted-foreground/50 truncate" dir="rtl">🎤 {lastSpoken}</p>
      )}
    </div>
  );
}
