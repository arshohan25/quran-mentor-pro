import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { normalizeArabic } from "@/utils/arabicUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LiveRecitationCheckProps {
  ayahText: string;
  onComplete: () => void;
  onCancel: () => void;
}

function playErrorBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 400;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function playSuccessBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.2;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 250);
  } catch {}
}

export default function LiveRecitationCheck({ ayahText, onComplete, onCancel }: LiveRecitationCheckProps) {
  const { t } = useLanguage();
  const words = ayahText.replace(/[^\u0600-\u06FF\s]/g, "").trim().split(/\s+/);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastSpoken, setLastSpoken] = useState("");
  const recognitionRef = useRef<any>(null);
  const revealedRef = useRef(0);
  const processedLengthRef = useRef(0);

  useEffect(() => { revealedRef.current = revealedIndex; }, [revealedIndex]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t("আপনার ব্রাউজার ভয়েস রিকগনিশন সাপোর্ট করে না।", "Your browser does not support speech recognition.", "متصفحك لا يدعم التعرف على الصوت."));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      fullTranscript = fullTranscript.trim();
      setLastSpoken(fullTranscript);

      const spokenWords = fullTranscript.replace(/[^\u0600-\u06FF\s]/g, "").trim().split(/\s+/).filter(Boolean);
      
      const currentRevealed = revealedRef.current;
      if (currentRevealed >= words.length) return;

      const newWords = spokenWords.slice(processedLengthRef.current);
      
      for (const spokenWord of newWords) {
        const idx = revealedRef.current;
        if (idx >= words.length) break;
        
        const expected = normalizeArabic(words[idx]);
        const spoken = normalizeArabic(spokenWord);
        
        if (expected === spoken) {
          revealedRef.current = idx + 1;
          setRevealedIndex(idx + 1);
          setErrorIndex(null);
          processedLengthRef.current++;
          
          if (idx + 1 >= words.length) {
            playSuccessBeep();
            setTimeout(() => {
              stopListening();
              onComplete();
            }, 500);
            return;
          }
        } else {
          setErrorIndex(idx);
          playErrorBeep();
          processedLengthRef.current++;
          break;
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (revealedRef.current < words.length && recognitionRef.current) {
        try {
          processedLengthRef.current = 0;
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    processedLengthRef.current = 0;
    recognition.start();
    setIsListening(true);
    setErrorIndex(null);
  }, [t, words, stopListening, onComplete]);

  useEffect(() => {
    return () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} };
  }, []);

  return (
    <div className="space-y-3 p-3 rounded-xl border-2 border-primary/30 bg-primary/5">
      <div className="flex flex-wrap gap-x-2 gap-y-1 justify-end" dir="rtl">
        {words.map((word, i) => {
          const isRevealed = i < revealedIndex;
          const isCurrent = i === revealedIndex;
          const isError = errorIndex === i;

          return (
            <span
              key={i}
              className={`font-arabic text-lg md:text-xl transition-all duration-300 ${
                isRevealed
                  ? "text-foreground"
                  : isError
                  ? "text-destructive font-bold underline decoration-2 decoration-destructive"
                  : isCurrent
                  ? "text-muted-foreground/20 animate-pulse"
                  : "text-transparent select-none"
              }`}
              style={!isRevealed && !isError && !isCurrent ? { textShadow: "0 0 8px hsl(var(--muted-foreground))" } : undefined}
            >
              {isRevealed || isError || isCurrent ? word : "███"}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {revealedIndex}/{words.length} {t("শব্দ", "words", "كلمات")}
        </span>
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(revealedIndex / words.length) * 100}%` }}
          />
        </div>
      </div>

      {errorIndex !== null && (
        <p className="text-xs text-destructive text-center animate-pulse">
          {t("ভুল হয়েছে! আবার চেষ্টা করুন", "Incorrect! Try again", "خطأ! حاول مرة أخرى")}
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ring-2 ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse ring-destructive/30"
              : "bg-primary text-primary-foreground hover:scale-105 ring-primary/30"
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {lastSpoken && (
        <p className="text-[10px] text-muted-foreground text-center truncate" dir="rtl">
          {lastSpoken}
        </p>
      )}
    </div>
  );
}
