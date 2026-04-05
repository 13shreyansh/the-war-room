import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipForward, Volume2, VolumeX,
  Shield, BarChart3, Target, Scale, Users, Flame, Mic
} from "lucide-react";
import type { DebateTurn, PersonaData } from "@shared/types";

const AVATAR_ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5" />,
  chart: <BarChart3 className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  scale: <Scale className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
};

/** Assign a unique accent color per persona index */
const PERSONA_COLORS = ["#FF4C4C", "#6C9EFF", "#FF9F43"];

interface DebatePlayerProps {
  turns: DebateTurn[];
  personas: PersonaData[];
  isUnhinged: boolean;
}

export default function DebatePlayer({ turns, personas, isUnhinged }: DebatePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const getPersonaColor = useCallback((speakerName: string) => {
    const idx = personas.findIndex(p => p.name === speakerName);
    return PERSONA_COLORS[idx >= 0 ? idx % PERSONA_COLORS.length : 0];
  }, [personas]);

  const getPersonaAvatar = useCallback((speakerName: string) => {
    const persona = personas.find(p => p.name === speakerName);
    return persona?.avatarStyle || "shield";
  }, [personas]);

  const playTurn = useCallback(async (index: number) => {
    if (index >= turns.length) {
      // Debate finished
      setIsPlaying(false);
      return;
    }

    const turn = turns[index];
    setCurrentTurnIndex(index);

    if (turn.audioUrl && !isMuted) {
      setIsLoadingAudio(true);
      try {
        // Stop previous audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const audio = new Audio(turn.audioUrl);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Audio playback failed"));
          audio.oncanplaythrough = () => {
            setIsLoadingAudio(false);
            audio.play().catch(reject);
          };
          audio.load();
        });
      } catch (err) {
        console.error("Audio playback error:", err);
        setIsLoadingAudio(false);
        // Fall back to timed display
        await new Promise(r => setTimeout(r, Math.max(1500, turn.text.length * 40)));
      }
    } else {
      // No audio or muted — show text for a calculated duration
      await new Promise(r => setTimeout(r, Math.max(1500, turn.text.length * 40)));
    }

    // Small pause between turns
    await new Promise(r => setTimeout(r, 400));

    // Continue if still playing
    if (isPlayingRef.current) {
      playTurn(index + 1);
    }
  }, [turns, isMuted]);

  const handlePlay = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      playTurn(0);
    } else if (currentTurnIndex >= turns.length - 1) {
      // Restart
      setIsPlaying(true);
      playTurn(0);
    } else {
      setIsPlaying(true);
      playTurn(currentTurnIndex >= 0 ? currentTurnIndex : 0);
    }
  }, [hasStarted, currentTurnIndex, turns.length, playTurn]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentTurnIndex < turns.length - 1) {
      playTurn(currentTurnIndex + 1);
    }
  }, [currentTurnIndex, turns.length, playTurn]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const currentTurn = currentTurnIndex >= 0 && currentTurnIndex < turns.length ? turns[currentTurnIndex] : null;

  return (
    <div className={`bg-[#111] border rounded-xl overflow-hidden transition-all duration-500 ${
      isUnhinged ? "border-[#FF4C4C]/30 shadow-[0_0_20px_rgba(255,76,76,0.1)]" : "border-white/5"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D] border-b border-white/5">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isPlaying ? "text-[#FF4C4C] animate-pulse" : "text-[#555]"}`} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#888]">
            Boardroom Debate
          </span>
          {isUnhinged && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF4C4C]/15 text-[#FF4C4C] uppercase tracking-widest ml-1">
              Heated
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#555] font-mono">
          {currentTurnIndex >= 0 ? currentTurnIndex + 1 : 0} / {turns.length} turns
        </div>
      </div>

      {/* Persona Avatars Strip */}
      <div className="flex items-center justify-center gap-6 py-4 px-4 bg-[#0A0A0A]">
        {personas.map((persona, i) => {
          const isActive = currentTurn?.speaker === persona.name;
          const color = PERSONA_COLORS[i % PERSONA_COLORS.length];

          return (
            <div key={persona.id} className="flex flex-col items-center gap-2">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "scale-110"
                    : "scale-100 opacity-50"
                }`}
                style={{
                  backgroundColor: isActive ? `${color}20` : "#1A1A1A",
                  boxShadow: isActive ? `0 0 20px ${color}40, 0 0 40px ${color}15` : "none",
                  border: isActive ? `2px solid ${color}` : "2px solid transparent",
                }}
              >
                <span style={{ color: isActive ? color : "#555" }}>
                  {AVATAR_ICONS[persona.avatarStyle] || <Shield className="w-6 h-6" />}
                </span>
                {/* Speaking indicator */}
                {isActive && isPlaying && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                    <div className="w-1 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: "0ms" }} />
                    <div className="w-1 h-4 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: "150ms" }} />
                    <div className="w-1 h-2 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-semibold transition-colors duration-300 ${
                  isActive ? "text-white" : "text-[#555]"
                }`}>
                  {persona.name.split(" ")[0]}
                </p>
                <p className="text-[8px] text-[#444] truncate max-w-[80px]">{persona.role}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Speech Bubble */}
      <div className="px-5 py-4 min-h-[100px] flex items-center justify-center">
        {!hasStarted ? (
          <div className="text-center">
            <p className="text-sm text-[#555]">
              {isUnhinged
                ? "Press play to hear the stakeholders tear this document apart..."
                : "Press play to hear the stakeholders debate the strategy..."
              }
            </p>
          </div>
        ) : currentTurn ? (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentTurnIndex}>
            <div className="flex items-start gap-3">
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: getPersonaColor(currentTurn.speaker) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-xs font-bold"
                    style={{ color: getPersonaColor(currentTurn.speaker) }}
                  >
                    {currentTurn.speaker}
                  </span>
                  {currentTurn.emotion !== "neutral" && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                      currentTurn.emotion === "aggressive" || currentTurn.emotion === "frustrated"
                        ? "bg-[#FF4C4C]/10 text-[#FF4C4C]"
                        : currentTurn.emotion === "sarcastic" || currentTurn.emotion === "dismissive"
                        ? "bg-[#FF9F43]/10 text-[#FF9F43]"
                        : "bg-[#6C9EFF]/10 text-[#6C9EFF]"
                    }`}>
                      {currentTurn.emotion}
                    </span>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${
                  isUnhinged ? "text-[#FFD0D0]" : "text-[#CCC]"
                }`}>
                  "{currentTurn.text}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-[#4CAF50]">Debate concluded.</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-5">
        <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${turns.length > 0 ? ((currentTurnIndex + 1) / turns.length) * 100 : 0}%`,
              backgroundColor: isUnhinged ? "#FF4C4C" : "#6C9EFF",
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-3 px-4">
        <button
          onClick={handleMuteToggle}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-[#555] hover:text-white"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isPlaying
              ? "bg-[#FF4C4C] hover:bg-[#E04343] shadow-[0_0_15px_rgba(255,76,76,0.3)]"
              : "bg-[#2A2A2A] hover:bg-[#333] border border-white/10"
          }`}
          disabled={isLoadingAudio}
        >
          {isLoadingAudio ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        <button
          onClick={handleSkip}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-[#555] hover:text-white"
          title="Skip to next turn"
          disabled={!isPlaying || currentTurnIndex >= turns.length - 1}
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
