import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2, Repeat1 } from "lucide-react";

interface AyahAudioPlayerProps {
  audioUrl: string | undefined;
  isActive: boolean;
  onPlay: () => void;
  onStop: () => void;
  autoPlay?: boolean;
  playbackRate?: number;
  repeatMode?: boolean;
  onToggleRepeat?: () => void;
}

export default function AyahAudioPlayer({ audioUrl, isActive, onPlay, onStop, autoPlay, playbackRate = 1, repeatMode, onToggleRepeat }: AyahAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration && !isNaN(audio.duration)) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
    if (audioRef.current && !audioRef.current.paused) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const startTracking = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  const stopTracking = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setProgress(0);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const setupAudio = useCallback((audio: Audio) => {
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    audio.oncanplaythrough = () => setLoading(false);
    audio.onended = () => {
      stopTracking();
      if (repeatMode) {
        audio.currentTime = 0;
        audio.play().then(() => startTracking()).catch(() => {});
      } else {
        audioRef.current = null;
        onStop();
      }
    };
    audio.onerror = () => { setLoading(false); stopTracking(); audioRef.current = null; onStop(); };
  }, [playbackRate, repeatMode, onStop, startTracking, stopTracking]);

  useEffect(() => {
    if (isActive && autoPlay && audioUrl && !audioRef.current) {
      setLoading(true);
      const audio = new Audio(audioUrl);
      setupAudio(audio);
      audio.play().then(() => { setLoading(false); startTracking(); onPlay(); }).catch(() => { setLoading(false); audioRef.current = null; });
    }
    if (!isActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      stopTracking();
    }
  }, [isActive, autoPlay, audioUrl, onPlay, setupAudio, startTracking, stopTracking]);

  const handleClick = () => {
    if (!audioUrl) return;
    if (isActive) {
      audioRef.current?.pause();
      stopTracking();
      onStop();
      return;
    }
    setLoading(true);
    const audio = new Audio(audioUrl);
    setupAudio(audio);
    audio.play().then(() => { setLoading(false); startTracking(); onPlay(); }).catch(() => setLoading(false));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio * 100);
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); stopTracking(); };
  }, [stopTracking]);

  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleClick}
          disabled={!audioUrl}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30"
          title="Play"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        {onToggleRepeat && (
          <button
            onClick={onToggleRepeat}
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              repeatMode ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
            title="Repeat"
          >
            <Repeat1 className="w-3 h-3" />
          </button>
        )}
      </div>
      {isActive && (
        <div
          className="w-8 h-1 rounded-full bg-muted cursor-pointer overflow-hidden"
          onClick={handleSeek}
          title={`${Math.round(progress)}%`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}