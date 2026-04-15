import { useState, useRef, useCallback, useEffect } from "react";

interface WordSegment {
  wordPosition: number;
  startMs: number;
  endMs: number;
}

const RECITER_ID = 7; // Mishary Rashid Alafasy

// Instant audio URL — no API call needed
function getDirectAudioUrl(verseKey: string): string {
  const [ch, v] = verseKey.split(":");
  const chPad = ch.padStart(3, "0");
  const vPad = v.padStart(3, "0");
  return `https://verses.quran.com/Alafasy/mp3/${chPad}${vPad}.mp3`;
}

/**
 * Hook for per-verse audio playback with word-by-word timing segments.
 * Plays audio INSTANTLY via direct URL, then fetches segments in background for highlighting.
 */
export function useMushafWordAudio() {
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const [highlightedWordPos, setHighlightedWordPos] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef<WordSegment[]>([]);
  const animRef = useRef<number | null>(null);
  const chapterCacheRef = useRef<Map<number, Map<string, WordSegment[]>>>(new Map());

  const fetchSegments = useCallback(async (chapter: number): Promise<Map<string, WordSegment[]>> => {
    if (chapterCacheRef.current.has(chapter)) {
      return chapterCacheRef.current.get(chapter)!;
    }

    try {
      const res = await fetch(
        `https://api.quran.com/api/v4/recitations/${RECITER_ID}/by_chapter/${chapter}?per_page=300`
      );
      if (!res.ok) return new Map();
      const data = await res.json();

      const map = new Map<string, WordSegment[]>();
      for (const file of data.audio_files ?? []) {
        const segments: WordSegment[] = (file.segments ?? []).map(
          (seg: number[]) => ({
            wordPosition: seg[2],
            startMs: seg[3],
            endMs: seg[4],
          })
        );
        map.set(file.verse_key, segments);
      }

      chapterCacheRef.current.set(chapter, map);
      return map;
    } catch {
      return new Map();
    }
  }, []);

  const trackProgress = useCallback(() => {
    const audio = audioRef.current;
    const segments = segmentsRef.current;
    if (!audio || segments.length === 0) {
      if (!audio?.paused) {
        animRef.current = requestAnimationFrame(trackProgress);
      }
      return;
    }

    const currentMs = audio.currentTime * 1000;
    let activePos = -1;
    for (let i = segments.length - 1; i >= 0; i--) {
      if (currentMs >= segments[i].startMs) {
        activePos = segments[i].wordPosition;
        break;
      }
    }
    setHighlightedWordPos(activePos);

    if (!audio.paused) {
      animRef.current = requestAnimationFrame(trackProgress);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    segmentsRef.current = [];
    setPlayingVerse(null);
    setHighlightedWordPos(-1);
  }, []);

  const playVerse = useCallback(async (verseKey: string) => {
    if (playingVerse === verseKey) {
      stopAudio();
      return;
    }

    stopAudio();

    // Play audio INSTANTLY — no API call needed
    const audioUrl = getDirectAudioUrl(verseKey);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingVerse(verseKey);

    audio.onended = () => stopAudio();
    audio.onerror = () => stopAudio();

    try {
      await audio.play();
      animRef.current = requestAnimationFrame(trackProgress);
    } catch {
      stopAudio();
      return;
    }

    // Fetch segments in background for word-by-word highlighting
    const chapter = Number(verseKey.split(":")[0]);
    const segMap = await fetchSegments(chapter);
    const segs = segMap.get(verseKey);
    if (segs && audioRef.current === audio) {
      segmentsRef.current = segs;
    }
  }, [playingVerse, stopAudio, fetchSegments, trackProgress]);

  // Prefetch segments when component mounts or chapter changes
  const prefetchChapter = useCallback((chapter: number) => {
    fetchSegments(chapter);
  }, [fetchSegments]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return {
    playingVerse,
    highlightedWordPos,
    playVerse,
    stopAudio,
    prefetchChapter,
  };
}
