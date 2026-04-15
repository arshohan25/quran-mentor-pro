import { useState, useRef, useCallback, useEffect } from "react";

interface WordSegment {
  wordPosition: number;
  startMs: number;
  endMs: number;
}

interface VerseAudio {
  url: string;
  segments: WordSegment[];
}

const AUDIO_BASE = "https://verses.quran.com/";
const RECITER_ID = 7; // Mishary Rashid Alafasy

/**
 * Hook for per-verse audio playback with word-by-word timing segments.
 * Fetches all audio files for a given chapter and caches them.
 */
export function useMushafWordAudio() {
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const [highlightedWordPos, setHighlightedWordPos] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef<WordSegment[]>([]);
  const animRef = useRef<number | null>(null);
  const chapterCacheRef = useRef<Map<number, Map<string, VerseAudio>>>(new Map());

  const fetchChapterAudio = useCallback(async (chapter: number): Promise<Map<string, VerseAudio>> => {
    if (chapterCacheRef.current.has(chapter)) {
      return chapterCacheRef.current.get(chapter)!;
    }

    const res = await fetch(
      `https://api.quran.com/api/v4/recitations/${RECITER_ID}/by_chapter/${chapter}?per_page=300`
    );
    if (!res.ok) throw new Error("Failed to fetch audio");
    const data = await res.json();

    const map = new Map<string, VerseAudio>();
    for (const file of data.audio_files ?? []) {
      const segments: WordSegment[] = (file.segments ?? []).map(
        (seg: number[]) => ({
          wordPosition: seg[2],
          startMs: seg[3],
          endMs: seg[4],
        })
      );
      map.set(file.verse_key, {
        url: file.url.startsWith("http") ? file.url : AUDIO_BASE + file.url,
        segments,
      });
    }

    chapterCacheRef.current.set(chapter, map);
    return map;
  }, []);

  const trackProgress = useCallback(() => {
    const audio = audioRef.current;
    const segments = segmentsRef.current;
    if (!audio || segments.length === 0) return;

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
    // If same verse is playing, stop it
    if (playingVerse === verseKey) {
      stopAudio();
      return;
    }

    stopAudio();

    const chapter = Number(verseKey.split(":")[0]);
    try {
      const chapterAudio = await fetchChapterAudio(chapter);
      const verseAudio = chapterAudio.get(verseKey);
      if (!verseAudio) return;

      segmentsRef.current = verseAudio.segments;
      const audio = new Audio(verseAudio.url);
      audioRef.current = audio;
      setPlayingVerse(verseKey);

      audio.onended = () => stopAudio();
      audio.onerror = () => stopAudio();

      await audio.play();
      animRef.current = requestAnimationFrame(trackProgress);
    } catch {
      stopAudio();
    }
  }, [playingVerse, stopAudio, fetchChapterAudio, trackProgress]);

  // Cleanup on unmount
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
  };
}
