import { useState, useRef, useEffect } from "react";
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (isActive && autoPlay && audioUrl && !audioRef.current) {
      setLoading(true);
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackRate;
      audioRef.current = audio;
      audio.oncanplaythrough = () => setLoading(false);
      audio.onended = () => {
        if (repeatMode) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          audioRef.current = null;
          onStop();
        }
      };
      audio.onerror = () => { setLoading(false); audioRef.current = null; onStop(); };
      audio.play().then(() => { setLoading(false); onPlay(); }).catch(() => { setLoading(false); audioRef.current = null; });
    }
    if (!isActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [isActive, autoPlay, audioUrl, onPlay, onStop, playbackRate, repeatMode]);

  const handleClick = () => {
    if (!audioUrl) return;
    if (isActive) {
      audioRef.current?.pause();
      onStop();
      return;
    }
    setLoading(true);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    audio.oncanplaythrough = () => setLoading(false);
    audio.onended = () => {
      if (repeatMode) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        audioRef.current = null;
        onStop();
      }
    };
    audio.onerror = () => { setLoading(false); audioRef.current = null; onStop(); };
    audio.play().then(() => { setLoading(false); onPlay(); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
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
  );
}