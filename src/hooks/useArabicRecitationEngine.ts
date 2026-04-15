import { useState, useRef, useCallback, useEffect } from "react";
import { tokenizeArabicWords, bestMatchScore, type MatchMode } from "@/utils/arabicUtils";

let lastBeepTime = 0;
function playBeep(freq: number, dur: number, vol: number) {
  const now = Date.now();
  if (freq < 500 && now - lastBeepTime < 800) return;
  if (freq < 500) lastBeepTime = now;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; gain.gain.value = vol;
    osc.start(); osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), dur * 1000 + 100);
  } catch {}
}

export interface RecitationState {
  revealedIndex: number;
  errorIndex: number | null;
  isListening: boolean;
  lastSpoken: string;
  speechError: string;
  totalWords: number;
  words: string[];
}

export function useArabicRecitationEngine(
  ayahText: string,
  mode: MatchMode = "balanced",
  onComplete?: () => void
) {
  const words = tokenizeArabicWords(ayahText);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastSpoken, setLastSpoken] = useState("");
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef<any>(null);
  const revealedRef = useRef(0);
  const finalCountRef = useRef(0);
  const processedTokensRef = useRef<Set<string>>(new Set());

  useEffect(() => { revealedRef.current = revealedIndex; }, [revealedIndex]);

  // Reset when ayahText changes — keep mic running if active
  useEffect(() => {
    setRevealedIndex(0);
    setErrorIndex(null);
    setLastSpoken("");
    setSpeechError("");
    revealedRef.current = 0;
    finalCountRef.current = 0;
    processedTokensRef.current = new Set();

    // If listening, restart recognition seamlessly for the new text
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      // onend handler will auto-restart since revealedRef < words.length
    }
  }, [ayahText]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechError("Speech recognition not supported");
      return;
    }

    setSpeechError("");
    setErrorIndex(null);
    setLastSpoken("");

    const recognition = new SR();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      let interimText = "";

      for (let i = finalCountRef.current; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalCountRef.current = i + 1;

          // Collect all alternatives
          const alternatives: string[] = [];
          for (let a = 0; a < result.length; a++) {
            alternatives.push(result[a].transcript);
          }

          // Process each token from the best alternative
          const bestTokens = tokenizeArabicWords(result[0].transcript);
          
          for (const token of bestTokens) {
            const idx = revealedRef.current;
            if (idx >= words.length) break;

            // Dedupe: skip if we've already processed this exact token recently
            const tokenKey = `${idx}-${token}`;
            if (processedTokensRef.current.has(tokenKey)) continue;
            processedTokensRef.current.add(tokenKey);

            // Score against expected word using all alternatives
            const { matched } = bestMatchScore(words[idx], alternatives, mode);

            if (matched) {
              revealedRef.current = idx + 1;
              setRevealedIndex(idx + 1);
              setErrorIndex(null);
              setLastSpoken(token);

              if (idx + 1 >= words.length) {
                playBeep(800, 0.15, 0.2);
                setTimeout(() => {
                  onComplete?.();
                }, 500);
                return;
              }
            } else {
              setErrorIndex(idx);
              setLastSpoken(token);
              playBeep(400, 0.2, 0.3);
            }
          }
        } else {
          interimText = result[0].transcript;
        }
      }

      if (interimText) setLastSpoken(interimText);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setSpeechError("Microphone permission denied");
        setIsListening(false);
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        // Don't show error for transient issues
      }
    };

    recognition.onend = () => {
      if (revealedRef.current < words.length && recognitionRef.current) {
        try {
          finalCountRef.current = 0;
          processedTokensRef.current = new Set();
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    finalCountRef.current = 0;
    processedTokensRef.current = new Set();
    recognition.start();
    setIsListening(true);
  }, [words, mode, stopListening, onComplete]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, stopListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {} };
  }, []);

  return {
    state: {
      revealedIndex,
      errorIndex,
      isListening,
      lastSpoken,
      speechError,
      totalWords: words.length,
      words,
    } as RecitationState,
    toggleListening,
    stopListening,
    startListening,
  };
}
