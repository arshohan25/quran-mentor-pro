import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, X, AlertCircle } from "lucide-react";
import { tokenizeArabicWords, isArabicWordMatch } from "@/utils/arabicUtils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LiveRecitationCheckProps {
  ayahText: string;
  onComplete: () => void;
  onCancel: () => void;
}

let lastBeepTime = 0;

function playErrorBeep() {
  const now = Date.now();
  if (now - lastBeepTime < 800) return; // cooldown
  lastBeepTime = now;
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
  const words = tokenizeArabicWords(ayahText);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastSpoken, setLastSpoken] = useState("");
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<any>(null);
  const revealedRef = useRef(0);
  const finalResultCountRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { revealedRef.current = revealedIndex; }, [revealedIndex]);

  // Auto-scroll into view on mount
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

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
      setSpeechError(t("ভয়েস রিকগনিশন সাপোর্ট করে না", "Speech recognition not supported", "التعرف على الصوت غير مدعوم"));
      return;
    }

    setSpeechError("");
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      // Only process NEW final results
      let interimText = "";
      
      for (let i = finalResultCountRef.current; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          // Process final result words
          const finalWords = tokenizeArabicWords(result[0].transcript);
          finalResultCountRef.current = i + 1;
          
          for (const spokenWord of finalWords) {
            const idx = revealedRef.current;
            if (idx >= words.length) break;
            
            if (isArabicWordMatch(words[idx], spokenWord)) {
              revealedRef.current = idx + 1;
              setRevealedIndex(idx + 1);
              setErrorIndex(null);
              
              if (idx + 1 >= words.length) {
                playSuccessBeep();
                setTimeout(() => {
                  stopListening();
                  onComplete();
                }, 600);
                return;
              }
            } else {
              setErrorIndex(idx);
              setLastSpoken(spokenWord);
              playErrorBeep();
              // Don't advance — user must say correct word
            }
          }
        } else {
          interimText = result[0].transcript;
        }
      }
      
      if (interimText) {
        setLastSpoken(interimText);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setSpeechError(t("মাইক্রোফোন অনুমতি দিন", "Please allow microphone access", "يرجى السماح بالوصول إلى الميكروفون"));
        setIsListening(false);
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setSpeechError(t("ভয়েস শনাক্ত হয়নি, আবার চেষ্টা করুন", "Voice not detected, try again", "لم يتم اكتشاف الصوت، حاول مرة أخرى"));
      }
    };

    recognition.onend = () => {
      if (revealedRef.current < words.length && recognitionRef.current) {
        // Restart for continuous listening
        try {
          finalResultCountRef.current = 0;
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    finalResultCountRef.current = 0;
    recognition.start();
    setIsListening(true);
    setErrorIndex(null);
    setLastSpoken("");
  }, [t, words, stopListening, onComplete]);

  useEffect(() => {
    return () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} };
  }, []);

  return (
    <div ref={containerRef} className="space-y-3 p-4 rounded-xl border-2 border-primary/40 bg-card shadow-lg">
      {/* Word display */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 justify-end py-2" dir="rtl">
        {words.map((word, i) => {
          const isRevealed = i < revealedIndex;
          const isCurrent = i === revealedIndex;
          const isError = errorIndex === i;

          return (
            <span
              key={i}
              className={`font-arabic text-xl md:text-2xl transition-all duration-300 px-1 rounded ${
                isRevealed
                  ? "text-foreground"
                  : isError
                  ? "text-destructive font-bold underline decoration-2 decoration-destructive bg-destructive/10 px-2 py-0.5"
                  : isCurrent
                  ? "text-primary font-semibold bg-primary/10 px-2 py-0.5 border border-primary/30 rounded-md animate-pulse"
                  : "text-muted-foreground/10 select-none"
              }`}
              style={!isRevealed && !isError && !isCurrent ? { filter: "blur(6px)" } : undefined}
            >
              {isRevealed || isError ? word : isCurrent ? "▍" + word.replace(/./g, "●") : word}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {revealedIndex}/{words.length} {t("শব্দ", "words", "كلمات")}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(revealedIndex / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {errorIndex !== null && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">
            {t("ভুল হয়েছে! সঠিক শব্দটি আবার বলুন", "Wrong word! Say the correct word again", "كلمة خاطئة! قل الكلمة الصحيحة مرة أخرى")}
          </p>
        </div>
      )}

      {/* Speech error */}
      {speechError && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">{speechError}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <button
          onClick={() => { stopListening(); onCancel(); }}
          className="p-2.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse ring-4 ring-destructive/30"
              : "bg-primary text-primary-foreground hover:scale-105 ring-4 ring-primary/30"
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>

      {/* Hint text */}
      <p className="text-[10px] text-muted-foreground text-center">
        {isListening 
          ? t("তেলাওয়াত করুন...", "Recite now...", "اقرأ الآن...")
          : t("মাইক চাপুন ও তেলাওয়াত শুরু করুন", "Tap mic and start reciting", "اضغط على الميكروفون وابدأ القراءة")
        }
      </p>

      {/* Last spoken word (debug/feedback) */}
      {lastSpoken && (
        <p className="text-[10px] text-muted-foreground/60 text-center truncate" dir="rtl">
          🎤 {lastSpoken}
        </p>
      )}
    </div>
  );
}
