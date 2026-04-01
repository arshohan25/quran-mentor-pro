import { Mic, MicOff, AlertCircle } from "lucide-react";
import { useArabicRecitationEngine } from "@/hooks/useArabicRecitationEngine";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MatchMode } from "@/utils/arabicUtils";

interface InlineRecitationProps {
  ayahText: string;
  onComplete: () => void;
  onCancel: () => void;
  mode?: MatchMode;
}

export default function LiveRecitationCheck({ ayahText, onComplete, onCancel, mode = "balanced" }: InlineRecitationProps) {
  const { t } = useLanguage();
  const { state, toggleListening, stopListening } = useArabicRecitationEngine(ayahText, mode, onComplete);
  const { words, revealedIndex, errorIndex, isListening, lastSpoken, speechError, totalWords } = state;

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
