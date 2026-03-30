import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

interface AyahAudioPlayerProps {
  audioUrl: string | undefined;
  isActive: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export default function AyahAudioPlayer({ audioUrl, isActive, onPlay, onStop }: AyahAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleClick = () => {
    if (!audioUrl) return;
    if (isActive) {
      audioRef.current?.pause();
      onStop();
      return;
    }
    setLoading(true);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.oncanplaythrough = () => setLoading(false);
    audio.onended = () => onStop();
    audio.onerror = () => { setLoading(false); onStop(); };
    audio.play().then(() => { setLoading(false); onPlay(); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
    <button
      onClick={handleClick}
      disabled={!audioUrl}
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30"
      title="Play"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
    </button>
  );
}
