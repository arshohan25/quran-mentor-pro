import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

interface AyahAudioPlayerProps {
  audioUrl: string | undefined;
  isActive: boolean;
  onPlay: () => void;
  onStop: () => void;
  autoPlay?: boolean;
}

export default function AyahAudioPlayer({ audioUrl, isActive, onPlay, onStop, autoPlay }: AyahAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-start playback when isActive becomes true and autoPlay is set
  useEffect(() => {
    if (isActive && autoPlay && audioUrl && !audioRef.current) {
      setLoading(true);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.oncanplaythrough = () => setLoading(false);
      audio.onended = () => { audioRef.current = null; onStop(); };
      audio.onerror = () => { setLoading(false); audioRef.current = null; onStop(); };
      audio.play().then(() => { setLoading(false); onPlay(); }).catch(() => { setLoading(false); audioRef.current = null; });
    }
    if (!isActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [isActive, autoPlay, audioUrl, onPlay, onStop]);

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
    audio.onended = () => { audioRef.current = null; onStop(); };
    audio.onerror = () => { setLoading(false); audioRef.current = null; onStop(); };
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
