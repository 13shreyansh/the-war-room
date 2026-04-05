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

const PERSONA_COLORS = ["#FF4C4C", "#6C9EFF", "#FF9F43"];

interface DebatePlayerProps {
  turns: DebateTurn[];
  personas: PersonaData[];
  isUnhinged: boolean;
  /** If true, auto-play immediately when turns are available */
  autoPlay?: boolean;
  /** Callback when debate finishes playing */
  onDebateComplete?: () => void;
}

export default function DebatePlayer({
  turns,
  personas,
  isUnhinged,
  autoPlay = false,
  onDebateComplete,
}: DebatePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  // Transcript of already-played turns
  const [transcript, setTranscript] = useState<DebateTurn[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const autoPlayTriggered = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Generation token: incremented every time we start a new playback sequence.
  // Each playTurn chain checks this token before proceeding to the next turn.
  // If the token has changed (e.g., due to Unhinged toggle), the old chain aborts.
  const generationTokenRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  const getPersonaColor = useCallback((speakerName: string) => {
    const idx = personas.findIndex(p => p.name === speakerName);
    return PERSONA_COLORS[idx >= 0 ? idx % PERSONA_COLORS.length : 0];
  }, [personas]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load(); // Force release of audio resources
      audioRef.current = null;
    }
  }, []);

  const playTurn = useCallback(async (index: number, token: number) => {
    // GUARD: If the generation token has changed, this chain is stale — abort.
    if (token !== generationTokenRef.current) {
      return;
    }

    if (index >= turns.length) {
      setIsPlaying(false);
      onDebateComplete?.();
      return;
    }

    const turn = turns[index];
    setCurrentTurnIndex(index);

    // Add to transcript
    setTranscript(prev => {
      if (prev.some(t => t.index === turn.index && t.speaker === turn.speaker && t.text === turn.text)) return prev;
      return [...prev, turn];
    });

    if (turn.audioUrl && !isMuted) {
      setIsLoadingAudio(true);
      try {
        stopAudio();

        const audio = new Audio(turn.audioUrl);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Audio playback failed"));
          audio.oncanplaythrough = () => {
            // Check token again before playing — may have changed during load
            if (token !== generationTokenRef.current) {
              audio.pause();
              audio.removeAttribute("src");
              resolve();
              return;
            }
            setIsLoadingAudio(false);
            audio.play().catch(reject);
          };
          audio.load();
        });
      } catch (err) {
        console.error("Audio playback error:", err);
        setIsLoadingAudio(false);
        if (token === generationTokenRef.current) {
          await new Promise(r => setTimeout(r, Math.max(1500, turn.text.length * 35)));
        }
      }
    } else {
      if (token === generationTokenRef.current) {
        await new Promise(r => setTimeout(r, Math.max(1200, turn.text.length * 35)));
      }
    }

    // GUARD: Check token again before proceeding to next turn
    if (token !== generationTokenRef.current) {
      return;
    }

    // Brief pause between turns
    await new Promise(r => setTimeout(r, 300));

    // GUARD: Final check before recursion
    if (token !== generationTokenRef.current) {
      return;
    }

    if (isPlayingRef.current) {
      playTurn(index + 1, token);
    }
  }, [turns, isMuted, stopAudio, onDebateComplete]);

  // Start a new playback sequence with a fresh generation token
  const startPlayback = useCallback((fromIndex: number) => {
    generationTokenRef.current += 1;
    const token = generationTokenRef.current;
    stopAudio();
    setIsLoadingAudio(false);
    setIsPlaying(true);
    playTurn(fromIndex, token);
  }, [stopAudio, playTurn]);

  // Auto-play when turns become available
  useEffect(() => {
    if (autoPlay && turns.length > 0 && !autoPlayTriggered.current && !hasStarted) {
      autoPlayTriggered.current = true;
      setHasStarted(true);
      setTranscript([]);
      startPlayback(0);
    }
  }, [autoPlay, turns.length, hasStarted, startPlayback]);

  // When turns change (e.g., switching between standard and unhinged), restart
  const turnsKey = turns.map(t => t.audioUrl || t.text.slice(0, 20)).join("|");
  const prevTurnsKeyRef = useRef(turnsKey);
  useEffect(() => {
    if (prevTurnsKeyRef.current !== turnsKey && hasStarted) {
      prevTurnsKeyRef.current = turnsKey;
      // Turns changed (unhinged toggle) — restart from beginning with new token
      setCurrentTurnIndex(-1);
      setTranscript([]);
      setTimeout(() => startPlayback(0), 100);
    }
  }, [turnsKey, hasStarted, startPlayback]);

  const handlePlay = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      setTranscript([]);
      startPlayback(0);
    } else if (currentTurnIndex >= turns.length - 1 && !isPlaying) {
      // Restart from beginning
      setTranscript([]);
      startPlayback(0);
    } else {
      startPlayback(currentTurnIndex >= 0 ? currentTurnIndex : 0);
    }
  }, [hasStarted, currentTurnIndex, turns.length, isPlaying, startPlayback]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    // Increment token to stop the current chain from advancing
    generationTokenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (currentTurnIndex < turns.length - 1) {
      startPlayback(currentTurnIndex + 1);
    }
  }, [currentTurnIndex, turns.length, startPlayback]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Cleanup on unmount — stop audio and invalidate all chains
  useEffect(() => {
    return () => {
      generationTokenRef.current += 1;
      stopAudio();
    };
  }, [stopAudio]);

  const currentTurn = currentTurnIndex >= 0 && currentTurnIndex < turns.length ? turns[currentTurnIndex] : null;
  const isComplete = hasStarted && !isPlaying && currentTurnIndex >= turns.length - 1;

  return (
    <div className={`bg-[#111] border rounded-xl overflow-hidden transition-all duration-500 ${
      isUnhinged ? "border-[#FF4C4C]/30 shadow-[0_0_30px_rgba(255,76,76,0.15)]" : "border-white/5"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D] border-b border-white/5">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isPlaying ? "text-[#FF4C4C] animate-pulse" : "text-[#555]"}`} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#888]">
            {isUnhinged ? "Boardroom Debate — Unhinged" : "Boardroom Debate"}
          </span>
          {isUnhinged && (
            <Flame className="w-3.5 h-3.5 text-[#FF4C4C] animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-[#555] font-mono">
            {currentTurnIndex >= 0 ? currentTurnIndex + 1 : 0} / {turns.length}
          </div>
          {/* Inline controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleMuteToggle}
              className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#555] hover:text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors text-[#555] hover:text-white disabled:opacity-30"
              title="Skip"
              disabled={!isPlaying || currentTurnIndex >= turns.length - 1}
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Persona Avatars Strip */}
      <div className="flex items-center justify-center gap-6 py-4 px-4 bg-[#0A0A0A] border-b border-white/5">
        {personas.map((persona, i) => {
          const isActive = currentTurn?.speaker === persona.name;
          const color = PERSONA_COLORS[i % PERSONA_COLORS.length];

          return (
            <div key={persona.id} className="flex flex-col items-center gap-2">
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? "scale-110" : "scale-100 opacity-40"
                }`}
                style={{
                  backgroundColor: isActive ? `${color}20` : "#1A1A1A",
                  boxShadow: isActive ? `0 0 25px ${color}50, 0 0 50px ${color}20` : "none",
                  border: isActive ? `2px solid ${color}` : "2px solid #222",
                }}
              >
                <span style={{ color: isActive ? color : "#555" }}>
                  {AVATAR_ICONS[persona.avatarStyle] || <Shield className="w-6 h-6" />}
                </span>
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

      {/* Transcript + Current Speech Area */}
      <div className="max-h-[280px] overflow-y-auto px-5 py-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
        {!hasStarted ? (
          <div className="text-center py-6">
            <button
              onClick={handlePlay}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isUnhinged
                  ? "bg-[#FF4C4C] hover:bg-[#E04343] text-white shadow-[0_0_20px_rgba(255,76,76,0.3)]"
                  : "bg-[#2A2A2A] hover:bg-[#333] text-white border border-white/10"
              }`}
            >
              <Play className="w-5 h-5" />
              {isUnhinged ? "Hear Them Fight" : "Start Debate"}
            </button>
            <p className="text-xs text-[#555] mt-3">
              {isUnhinged
                ? "Warning: The stakeholders have strong opinions."
                : "3 stakeholders will debate the strategy document."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Previous turns (transcript) */}
            {transcript.slice(0, -1).map((turn, i) => (
              <div key={`${turn.index}-${i}`} className="flex items-start gap-2.5 opacity-50">
                <div
                  className="w-0.5 self-stretch rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: getPersonaColor(turn.speaker) }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: getPersonaColor(turn.speaker) }}
                  >
                    {turn.speaker}
                  </span>
                  <p className="text-xs text-[#777] leading-relaxed mt-0.5">
                    "{turn.text}"
                  </p>
                </div>
              </div>
            ))}

            {/* Current turn (highlighted) */}
            {currentTurn && (
              <div className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300" key={`current-${currentTurnIndex}`}>
                <div
                  className="w-1 self-stretch rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: getPersonaColor(currentTurn.speaker) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                    {isLoadingAudio && (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    isUnhinged ? "text-[#FFD0D0]" : "text-[#CCC]"
                  }`}>
                    "{currentTurn.text}"
                  </p>
                </div>
              </div>
            )}

            {/* Debate complete */}
            {isComplete && (
              <div className="text-center py-3 animate-in fade-in duration-500">
                <p className="text-xs text-[#4CAF50] font-semibold">Debate concluded.</p>
                <button
                  onClick={handlePlay}
                  className="text-[10px] text-[#555] hover:text-white mt-1 underline"
                >
                  Replay
                </button>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-5 pb-3">
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

      {/* Play/Pause floating button when playing */}
      {hasStarted && (
        <div className="flex justify-center pb-3">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isPlaying
                ? "bg-[#FF4C4C] hover:bg-[#E04343] shadow-[0_0_15px_rgba(255,76,76,0.3)]"
                : "bg-[#2A2A2A] hover:bg-[#333] border border-white/10"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
