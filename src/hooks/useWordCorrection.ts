import { useState, useEffect, useRef, useCallback } from "react";

interface WordAudio {
  position: number;
  audioUrl: string | null;
}

export function useWordCorrection(
  surahNumber: number,
  ayahNumber: number,
  errorWordIndex: number | null
) {
  const [wordAudios, setWordAudios] = useState<WordAudio[]>([]);
  const cacheRef = useRef<Map<string, WordAudio[]>>(new Map());
  const lastPlayedRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch word audio data for the current ayah
  useEffect(() => {
    const key = `${surahNumber}:${ayahNumber}`;
    if (cacheRef.current.has(key)) {
      setWordAudios(cacheRef.current.get(key)!);
      return;
    }

    let cancelled = false;
    fetch(
      `https://api.quran.com/api/v4/verses/by_key/${key}?language=ar&words=true&word_fields=audio_url`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const words: WordAudio[] = (data?.verse?.words || [])
          .filter((w: any) => w.char_type_name === "word")
          .map((w: any) => ({
            position: w.position,
            audioUrl: w.audio_url
              ? w.audio_url.startsWith("http")
                ? w.audio_url
                : `https://audio.qurancdn.com/${w.audio_url}`
              : null,
          }));
        cacheRef.current.set(key, words);
        setWordAudios(words);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [surahNumber, ayahNumber]);

  const playWordAudio = useCallback(
    (wordIndex: number) => {
      const word = wordAudios[wordIndex];
      if (!word?.audioUrl) return;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(word.audioUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});
    },
    [wordAudios]
  );

  // Auto-play on error
  useEffect(() => {
    if (errorWordIndex === null) return;
    const playKey = `${surahNumber}:${ayahNumber}:${errorWordIndex}`;
    if (lastPlayedRef.current === playKey) return;
    lastPlayedRef.current = playKey;
    // Small delay so error beep plays first
    const t = setTimeout(() => playWordAudio(errorWordIndex), 350);
    return () => clearTimeout(t);
  }, [errorWordIndex, surahNumber, ayahNumber, playWordAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return { playWordAudio };
}
