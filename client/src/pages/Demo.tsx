import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { X, SkipForward, Play, Volume2, VolumeX, Shield, BarChart3, Target, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NARRATION_SEGMENTS } from "@/lib/demoNarration";
import {
  DEMO_PERSONAS,
  DEMO_CRITIQUES,
  DEMO_STANDARD_DEBATE,
  DEMO_UNHINGED_DEBATE,
  DEMO_TERMINAL_LOGS,
  DEMO_ROBUSTNESS_SCORE,
} from "@/lib/demoData";

// ===== SCENE DEFINITIONS =====
// Each scene has narration segments, optional debate audio, and a duration
interface SceneConfig {
  id: string;
  narrationIds: string[]; // narration segment IDs to play in order
  extraDurationMs: number; // extra time after narration ends (for debate audio, pauses)
  debateMode?: "standard" | "unhinged"; // if this scene plays debate audio
  debateTurnCount?: number; // how many debate turns to play
}

const SCENES: SceneConfig[] = [
  {
    id: "title",
    narrationIds: ["narr_01_problem", "narr_02_hook"],
    extraDurationMs: 1500, // pause after hook
  },
  {
    id: "solution",
    narrationIds: ["narr_03_solution", "narr_04_twist"],
    extraDurationMs: 1000,
  },
  {
    id: "upload",
    narrationIds: ["narr_05_demo_intro"],
    extraDurationMs: 2000, // let the upload animation play
  },
  {
    id: "terminal",
    narrationIds: ["narr_06_research"],
    extraDurationMs: 5000, // terminal keeps scrolling after narration
  },
  {
    id: "personas",
    narrationIds: ["narr_07_persona1", "narr_08_persona2", "narr_09_persona3"],
    extraDurationMs: 2000,
  },
  {
    id: "debate",
    narrationIds: ["narr_10_fight"],
    extraDurationMs: 0, // debate audio handles timing
    debateMode: "standard",
    debateTurnCount: 4,
  },
  {
    id: "unhinged",
    narrationIds: ["narr_11_unhinged"],
    extraDurationMs: 0,
    debateMode: "unhinged",
    debateTurnCount: 1,
  },
  {
    id: "results",
    narrationIds: ["narr_12_results", "narr_13_close", "narr_14_tagline"],
    extraDurationMs: 3000, // hold on CTA
  },
];

// ===== AVATAR ICONS =====
const AVATAR_ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="w-6 h-6" />,
  chart: <BarChart3 className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
};
const PERSONA_COLORS = ["#FF4C4C", "#6C9EFF", "#FF9F43"];

// ===== TERMINAL LOG COLORS =====
const LOG_TYPE_COLORS: Record<string, string> = {
  error: "text-[#FF4C4C]",
  complete: "text-[#4CAF50]",
  inject: "text-[#FF9F43]",
  search: "text-[#6C9EFF]",
  analyze: "text-[#8A8A8A]",
};

// ===== MAIN COMPONENT =====
export default function Demo() {
  const [, navigate] = useLocation();

  // Playback state
  const [isStarted, setIsStarted] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0-100 within current scene
  const [isFinished, setIsFinished] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0); // 0-100 overall

  // Scene-specific state
  const [visibleText, setVisibleText] = useState("");
  const [showStat, setShowStat] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [revealedPersonas, setRevealedPersonas] = useState<number[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [debateTranscript, setDebateTranscript] = useState<string[]>([]);
  const [isUnhingedActive, setIsUnhingedActive] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showCritiques, setShowCritiques] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [currentNarrationText, setCurrentNarrationText] = useState("");

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTokenRef = useRef(0);
  const sceneStartTimeRef = useRef(0);
  const totalStartTimeRef = useRef(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate total duration for progress bar
  const totalDurationMs = useMemo(() => {
    let total = 0;
    for (const scene of SCENES) {
      for (const nId of scene.narrationIds) {
        const seg = NARRATION_SEGMENTS.find((s) => s.id === nId);
        if (seg) total += seg.durationMs;
      }
      total += scene.extraDurationMs;
    }
    return total;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playbackTokenRef.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Progress tracker
  useEffect(() => {
    if (isStarted && !isFinished) {
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - totalStartTimeRef.current;
        const pct = Math.min(100, (elapsed / totalDurationMs) * 100);
        setTotalProgress(pct);
      }, 200);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isStarted, isFinished, totalDurationMs]);

  // Play a single audio URL and return a promise that resolves when it ends
  const playAudio = useCallback(
    (url: string, token: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (token !== playbackTokenRef.current) {
          reject(new Error("token_changed"));
          return;
        }
        const audio = new Audio(url);
        audio.muted = isMuted;
        audioRef.current = audio;

        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("audio_error"));

        audio.play().catch((err) => {
          console.warn("Audio play failed:", err);
          // If autoplay blocked, resolve after estimated duration
          const seg = NARRATION_SEGMENTS.find((s) => s.url === url);
          setTimeout(resolve, seg?.durationMs || 3000);
        });
      });
    },
    [isMuted]
  );

  // Update mute state on current audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // ===== SCENE RUNNERS =====
  const runTitleScene = useCallback(
    async (token: number) => {
      setShowStat(false);
      setVisibleText("");
      setCurrentNarrationText("");

      // Fade in "67%"
      await wait(500);
      if (token !== playbackTokenRef.current) return;
      setShowStat(true);

      // Play narr_01
      const seg1 = NARRATION_SEGMENTS.find((s) => s.id === "narr_01_problem")!;
      setCurrentNarrationText(seg1.text);
      try {
        await playAudio(seg1.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      // Brief pause
      await wait(800);
      if (token !== playbackTokenRef.current) return;

      // Play narr_02 (hook)
      setShowStat(false);
      const seg2 = NARRATION_SEGMENTS.find((s) => s.id === "narr_02_hook")!;
      setCurrentNarrationText(seg2.text);
      setVisibleText(seg2.text);
      try {
        await playAudio(seg2.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;
      await wait(1500);
    },
    [playAudio]
  );

  const runSolutionScene = useCallback(
    async (token: number) => {
      setVisibleText("");
      setShowTitle(false);
      setCurrentNarrationText("");

      await wait(300);
      if (token !== playbackTokenRef.current) return;
      setShowTitle(true);

      // Play narr_03
      const seg3 = NARRATION_SEGMENTS.find((s) => s.id === "narr_03_solution")!;
      setCurrentNarrationText(seg3.text);
      try {
        await playAudio(seg3.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      await wait(500);
      if (token !== playbackTokenRef.current) return;

      // Play narr_04
      const seg4 = NARRATION_SEGMENTS.find((s) => s.id === "narr_04_twist")!;
      setCurrentNarrationText(seg4.text);
      setVisibleText('"And then... they debate. Out loud. And you listen."');
      try {
        await playAudio(seg4.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;
      await wait(1000);
    },
    [playAudio]
  );

  const runUploadScene = useCallback(
    async (token: number) => {
      setVisibleText("");
      setCurrentNarrationText("");

      const seg = NARRATION_SEGMENTS.find((s) => s.id === "narr_05_demo_intro")!;
      setCurrentNarrationText(seg.text);
      try {
        await playAudio(seg.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;
      await wait(2000);
    },
    [playAudio]
  );

  const runTerminalScene = useCallback(
    async (token: number) => {
      setTerminalLines([]);
      setCurrentNarrationText("");

      const seg = NARRATION_SEGMENTS.find((s) => s.id === "narr_06_research")!;
      setCurrentNarrationText(seg.text);

      // Start narration
      const audioPromise = playAudio(seg.url, token).catch(() => {});

      // Simultaneously type terminal lines
      const totalLines = DEMO_TERMINAL_LOGS.length;
      const lineDelay = (seg.durationMs + 5000) / totalLines;

      for (let i = 0; i < totalLines; i++) {
        if (token !== playbackTokenRef.current) return;
        setTerminalLines((prev) => [...prev, DEMO_TERMINAL_LOGS[i].message]);
        await wait(lineDelay);
      }

      await audioPromise;
      if (token !== playbackTokenRef.current) return;
      await wait(2000);
    },
    [playAudio]
  );

  const runPersonaScene = useCallback(
    async (token: number) => {
      setRevealedPersonas([]);
      setCurrentNarrationText("");

      // narr_07 — Eleanor
      const seg7 = NARRATION_SEGMENTS.find((s) => s.id === "narr_07_persona1")!;
      setCurrentNarrationText(seg7.text);
      try {
        await playAudio(seg7.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;
      setRevealedPersonas([0]);
      await wait(800);

      // narr_08 — David
      const seg8 = NARRATION_SEGMENTS.find((s) => s.id === "narr_08_persona2")!;
      setCurrentNarrationText(seg8.text);
      try {
        await playAudio(seg8.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;
      setRevealedPersonas([0, 1]);
      await wait(800);

      // narr_09 — Aisha
      const seg9 = NARRATION_SEGMENTS.find((s) => s.id === "narr_09_persona3")!;
      setCurrentNarrationText(seg9.text);
      try {
        await playAudio(seg9.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;
      setRevealedPersonas([0, 1, 2]);
      await wait(2000);
    },
    [playAudio]
  );

  const runDebateScene = useCallback(
    async (token: number) => {
      setDebateTranscript([]);
      setActiveSpeaker(null);
      setCurrentNarrationText("");

      // narr_10 — "Now... they fight."
      const seg10 = NARRATION_SEGMENTS.find((s) => s.id === "narr_10_fight")!;
      setCurrentNarrationText(seg10.text);
      try {
        await playAudio(seg10.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      await wait(1500);
      if (token !== playbackTokenRef.current) return;

      setCurrentNarrationText("");

      // Play 4 standard debate turns
      const turns = DEMO_STANDARD_DEBATE.slice(0, 4);
      for (const turn of turns) {
        if (token !== playbackTokenRef.current) return;
        setActiveSpeaker(turn.speaker);
        setDebateTranscript((prev) => [
          ...prev,
          `${turn.speaker}: "${turn.text}"`,
        ]);

        if (turn.audioUrl) {
          try {
            await playAudio(turn.audioUrl, token);
          } catch {
            return;
          }
        } else {
          await wait(5000);
        }
        if (token !== playbackTokenRef.current) return;
        await wait(500);
      }
      setActiveSpeaker(null);
    },
    [playAudio]
  );

  const runUnhingedScene = useCallback(
    async (token: number) => {
      setCurrentNarrationText("");

      // narr_11 — "And if you want the version nobody says out loud..."
      const seg11 = NARRATION_SEGMENTS.find((s) => s.id === "narr_11_unhinged")!;
      setCurrentNarrationText(seg11.text);
      try {
        await playAudio(seg11.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      // Flash red + activate unhinged
      setIsUnhingedActive(true);
      await wait(500);
      if (token !== playbackTokenRef.current) return;

      setCurrentNarrationText("");

      // Play 1 unhinged turn
      const turn = DEMO_UNHINGED_DEBATE[0];
      setActiveSpeaker(turn.speaker);
      setDebateTranscript((prev) => [
        ...prev,
        `🔥 ${turn.speaker} (UNHINGED): "${turn.text}"`,
      ]);

      if (turn.audioUrl) {
        try {
          await playAudio(turn.audioUrl, token);
        } catch {
          return;
        }
      } else {
        await wait(8000);
      }
      if (token !== playbackTokenRef.current) return;
      setActiveSpeaker(null);
      await wait(500);
    },
    [playAudio]
  );

  const runResultsScene = useCallback(
    async (token: number) => {
      setAnimatedScore(0);
      setShowCritiques(false);
      setShowCTA(false);
      setCurrentNarrationText("");

      // narr_12 — results
      const seg12 = NARRATION_SEGMENTS.find((s) => s.id === "narr_12_results")!;
      setCurrentNarrationText(seg12.text);

      // Start score animation simultaneously
      const scoreAnimPromise = (async () => {
        const steps = DEMO_ROBUSTNESS_SCORE;
        const stepDelay = Math.min(seg12.durationMs / steps, 200);
        for (let i = 1; i <= steps; i++) {
          if (token !== playbackTokenRef.current) return;
          setAnimatedScore(i);
          await wait(stepDelay);
        }
      })();

      try {
        await playAudio(seg12.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      await scoreAnimPromise;
      setShowCritiques(true);
      await wait(1000);
      if (token !== playbackTokenRef.current) return;

      // narr_13 — close
      const seg13 = NARRATION_SEGMENTS.find((s) => s.id === "narr_13_close")!;
      setCurrentNarrationText(seg13.text);
      try {
        await playAudio(seg13.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      await wait(800);
      if (token !== playbackTokenRef.current) return;

      // narr_14 — tagline
      const seg14 = NARRATION_SEGMENTS.find((s) => s.id === "narr_14_tagline")!;
      setCurrentNarrationText(seg14.text);
      try {
        await playAudio(seg14.url, token);
      } catch {
        return;
      }
      if (token !== playbackTokenRef.current) return;

      setShowCTA(true);
      await wait(3000);
    },
    [playAudio]
  );

  // Scene runner map
  const sceneRunners = useMemo(
    () => [
      runTitleScene,
      runSolutionScene,
      runUploadScene,
      runTerminalScene,
      runPersonaScene,
      runDebateScene,
      runUnhingedScene,
      runResultsScene,
    ],
    [
      runTitleScene,
      runSolutionScene,
      runUploadScene,
      runTerminalScene,
      runPersonaScene,
      runDebateScene,
      runUnhingedScene,
      runResultsScene,
    ]
  );

  // ===== MAIN PLAYBACK LOOP =====
  const startDemo = useCallback(async () => {
    const token = ++playbackTokenRef.current;
    totalStartTimeRef.current = Date.now();
    setIsStarted(true);
    setIsFinished(false);
    setTotalProgress(0);

    for (let i = 0; i < sceneRunners.length; i++) {
      if (token !== playbackTokenRef.current) return;
      setCurrentSceneIndex(i);
      sceneStartTimeRef.current = Date.now();
      await sceneRunners[i](token);
      if (token !== playbackTokenRef.current) return;
    }

    setIsFinished(true);
    setTotalProgress(100);
  }, [sceneRunners]);

  // ===== CONTROLS =====
  const handleExit = useCallback(() => {
    playbackTokenRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    navigate("/");
  }, [navigate]);

  const handleSkip = useCallback(() => {
    playbackTokenRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setIsFinished(true);
    setTotalProgress(100);
    setCurrentSceneIndex(SCENES.length - 1);
    setShowCTA(true);
    setAnimatedScore(DEMO_ROBUSTNESS_SCORE);
    setShowCritiques(true);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // ===== RENDER HELPERS =====
  const currentScene = SCENES[currentSceneIndex];

  const renderScene = () => {
    if (!isStarted) return renderStartScreen();
    if (isFinished) return renderEndScreen();

    switch (currentScene?.id) {
      case "title":
        return renderTitleScene();
      case "solution":
        return renderSolutionScene();
      case "upload":
        return renderUploadScene();
      case "terminal":
        return renderTerminalScene();
      case "personas":
        return renderPersonaScene();
      case "debate":
        return renderDebateScene();
      case "unhinged":
        return renderUnhingedScene();
      case "results":
        return renderResultsScene();
      default:
        return null;
    }
  };

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-1000">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FF4C4C] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">THE WAR ROOM</span>
        </div>
        <p className="text-[#8A8A8A] text-lg max-w-md mx-auto">
          A 2-minute cinematic walkthrough of AI-powered strategy stress-testing
        </p>
        <Button
          size="lg"
          className="bg-[#FF4C4C] hover:bg-[#E04343] text-white px-10 py-6 text-lg rounded-xl gap-3"
          onClick={startDemo}
        >
          <Play className="w-6 h-6" />
          Play Demo
        </Button>
        <p className="text-[#555] text-sm">Best experienced with sound on</p>
      </div>
    </div>
  );

  const renderEndScreen = () => (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-1000">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#FF4C4C] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">THE WAR ROOM</span>
        </div>
        <p className="text-[#8A8A8A] text-xl">Built with Manus</p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#FF4C4C] hover:bg-[#E04343] text-white px-8 py-5 text-lg rounded-xl"
            onClick={() => navigate("/analyze")}
          >
            Try It Yourself
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-[#333] text-white hover:bg-[#1a1a1a] px-8 py-5 text-lg rounded-xl"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTitleScene = () => (
    <div className="flex flex-col items-center justify-center h-full">
      {showStat && (
        <div className="animate-in fade-in zoom-in duration-700 text-center">
          <div className="text-[120px] md:text-[180px] font-black text-[#FF4C4C] leading-none tracking-tighter">
            67%
          </div>
          <p className="text-[#666] text-lg mt-4 max-w-lg mx-auto">
            of corporate strategies fail at execution
          </p>
        </div>
      )}
      {visibleText && !showStat && (
        <div className="animate-in fade-in duration-700 text-center max-w-2xl mx-auto">
          <p className="text-2xl md:text-3xl text-white/90 font-light italic leading-relaxed">
            {visibleText}
          </p>
        </div>
      )}
    </div>
  );

  const renderSolutionScene = () => (
    <div className="flex flex-col items-center justify-center h-full">
      {showTitle && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-16 bg-[#FF4C4C] animate-in slide-in-from-left duration-1000" />
            <div className="w-12 h-12 rounded-lg bg-[#FF4C4C] flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="h-[2px] w-16 bg-[#FF4C4C] animate-in slide-in-from-right duration-1000" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            THE WAR ROOM
          </h1>
          <p className="text-[#8A8A8A] text-xl max-w-lg mx-auto">
            Stress-test your strategy before the boardroom does.
          </p>
          {visibleText && (
            <div className="mt-8 animate-in fade-in duration-500">
              <p className="text-2xl text-[#FF4C4C] font-semibold italic">
                {visibleText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderUploadScene = () => (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#FF4C4C] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Upload Strategy Document</span>
          </div>

          <div className="space-y-4">
            <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4">
              <p className="text-sm text-[#666] mb-1">Document Title</p>
              <p className="text-white font-medium typewriter-text">
                Project Aegis: Southeast Asia Market Entry Strategy
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3">
                <p className="text-xs text-[#666] mb-1">Industry</p>
                <p className="text-white text-sm">Transportation & Logistics</p>
              </div>
              <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3">
                <p className="text-xs text-[#666] mb-1">Company Size</p>
                <p className="text-white text-sm">Enterprise</p>
              </div>
              <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3">
                <p className="text-xs text-[#666] mb-1">Geography</p>
                <p className="text-white text-sm">Southeast Asia</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-[#FF4C4C] text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Enter The War Room
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTerminalScene = () => (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-3xl animate-in fade-in duration-500">
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-[#222]">
            <div className="w-3 h-3 rounded-full bg-[#FF4C4C]" />
            <div className="w-3 h-3 rounded-full bg-[#FF9F43]" />
            <div className="w-3 h-3 rounded-full bg-[#4CAF50]" />
            <span className="text-[#666] text-xs ml-2 font-mono">war-room-research</span>
          </div>
          <div
            ref={terminalRef}
            className="p-4 h-[350px] overflow-y-auto scrollbar-thin font-mono text-sm space-y-1"
          >
            {terminalLines.map((line, i) => {
              const logEntry = DEMO_TERMINAL_LOGS[i];
              const colorClass = logEntry
                ? LOG_TYPE_COLORS[logEntry.logType] || "text-[#8A8A8A]"
                : "text-[#8A8A8A]";
              return (
                <div
                  key={i}
                  className={`${colorClass} animate-in fade-in slide-in-from-left-2 duration-300`}
                >
                  {line}
                </div>
              );
            })}
            <div className="text-[#4CAF50] animate-pulse">█</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonaScene = () => (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-white text-center mb-8 animate-in fade-in duration-500">
          Adversarial Stakeholders Generated
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_PERSONAS.map((persona, idx) => (
            <div
              key={persona.id}
              className={`transition-all duration-700 ${
                revealedPersonas.includes(idx)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div
                className="bg-[#1a1a1a] border rounded-xl p-6 h-full"
                style={{ borderColor: `${PERSONA_COLORS[idx]}40` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${PERSONA_COLORS[idx]}20`, color: PERSONA_COLORS[idx] }}
                  >
                    {AVATAR_ICONS[persona.avatarStyle] || <Shield className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{persona.name}</p>
                    <p className="text-[#666] text-sm">{persona.role}</p>
                  </div>
                </div>
                <p className="text-[#999] text-sm italic leading-relaxed">
                  "{persona.perspective.split("—")[0].trim()}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDebateScene = () => (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">BOARDROOM DEBATE</h2>
          <p className="text-[#666] text-sm">Live adversarial discussion</p>
        </div>

        {/* Persona avatars */}
        <div className="flex justify-center gap-8 mb-8">
          {DEMO_PERSONAS.map((persona, idx) => (
            <div key={persona.id} className="text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 transition-all duration-500 ${
                  activeSpeaker === persona.name
                    ? "ring-2 ring-offset-2 ring-offset-black scale-110"
                    : "opacity-50"
                }`}
                style={{
                  backgroundColor: `${PERSONA_COLORS[idx]}20`,
                  color: PERSONA_COLORS[idx],
                  "--tw-ring-color": PERSONA_COLORS[idx],
                } as React.CSSProperties}
              >
                {AVATAR_ICONS[persona.avatarStyle] || <Shield className="w-6 h-6" />}
              </div>
              <p className={`text-xs font-medium transition-all duration-300 ${
                activeSpeaker === persona.name ? "text-white" : "text-[#555]"
              }`}>
                {persona.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>

        {/* Transcript */}
        <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6 max-h-[250px] overflow-y-auto scrollbar-thin">
          {debateTranscript.map((line, i) => (
            <div
              key={i}
              className="text-[#ccc] text-sm mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 leading-relaxed"
            >
              {line}
            </div>
          ))}
          {activeSpeaker && (
            <div className="flex items-center gap-2 text-[#FF4C4C] text-sm animate-pulse">
              <Volume2 className="w-4 h-4" />
              <span>{activeSpeaker} is speaking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUnhingedScene = () => (
    <div className={`flex flex-col items-center justify-center h-full px-4 transition-all duration-500 ${
      isUnhingedActive ? "unhinged-active" : ""
    }`}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-6 h-6 text-[#FF4C4C]" />
            <h2 className="text-2xl font-bold text-[#FF4C4C]">UNHINGED MODE</h2>
            <Flame className="w-6 h-6 text-[#FF4C4C]" />
          </div>
          <p className="text-[#666] text-sm">The version nobody says out loud</p>
        </div>

        {/* Persona avatars */}
        <div className="flex justify-center gap-8 mb-8">
          {DEMO_PERSONAS.map((persona, idx) => (
            <div key={persona.id} className="text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 transition-all duration-500 ${
                  activeSpeaker === persona.name
                    ? "ring-2 ring-offset-2 ring-offset-black scale-110 unhinged-glow"
                    : "opacity-50"
                }`}
                style={{
                  backgroundColor: `${PERSONA_COLORS[idx]}20`,
                  color: PERSONA_COLORS[idx],
                  "--tw-ring-color": PERSONA_COLORS[idx],
                } as React.CSSProperties}
              >
                {AVATAR_ICONS[persona.avatarStyle] || <Shield className="w-6 h-6" />}
              </div>
              <p className={`text-xs font-medium transition-all duration-300 ${
                activeSpeaker === persona.name ? "text-[#FF4C4C]" : "text-[#555]"
              }`}>
                {persona.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>

        {/* Transcript */}
        <div className="bg-[#0a0a0a] border border-[#FF4C4C]/30 rounded-xl p-6 max-h-[250px] overflow-y-auto scrollbar-thin unhinged-glow">
          {debateTranscript.slice(-2).map((line, i) => (
            <div
              key={i}
              className="text-[#ccc] text-sm mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 leading-relaxed"
            >
              {line}
            </div>
          ))}
          {activeSpeaker && (
            <div className="flex items-center gap-2 text-[#FF4C4C] text-sm animate-pulse">
              <Flame className="w-4 h-4" />
              <span>{activeSpeaker} is unleashing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderResultsScene = () => (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Score */}
        <div className="text-center animate-in fade-in duration-700">
          <p className="text-[#666] text-sm uppercase tracking-widest mb-2">Robustness Score</p>
          <div className="text-[80px] md:text-[120px] font-black leading-none tracking-tighter">
            <span className={animatedScore <= 40 ? "text-[#FF4C4C]" : animatedScore <= 70 ? "text-[#FF9F43]" : "text-[#4CAF50]"}>
              {animatedScore}
            </span>
            <span className="text-[#333] text-[40px] md:text-[60px]">/100</span>
          </div>
        </div>

        {/* Critique titles */}
        {showCritiques && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {DEMO_CRITIQUES.map((critique, idx) => (
              <div
                key={critique.id}
                className="bg-[#1a1a1a] border border-[#FF4C4C]/20 rounded-lg p-4 flex items-center gap-4"
              >
                <div className="bg-[#FF4C4C]/10 text-[#FF4C4C] text-xs font-bold px-2 py-1 rounded uppercase">
                  High
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${PERSONA_COLORS[idx]}20`,
                      color: PERSONA_COLORS[idx],
                    }}
                  >
                    {AVATAR_ICONS[DEMO_PERSONAS[idx]?.avatarStyle] || <Shield className="w-3 h-3" />}
                  </div>
                  <span className="text-white font-medium text-sm">{critique.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {showCTA && (
          <div className="text-center animate-in fade-in zoom-in duration-700 pt-4">
            <Button
              size="lg"
              className="bg-[#FF4C4C] hover:bg-[#E04343] text-white px-10 py-5 text-lg rounded-xl"
              onClick={() => navigate("/analyze")}
            >
              Try It Yourself
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Top controls */}
      {isStarted && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[#888] hover:text-white"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {!isFinished && (
            <button
              onClick={handleSkip}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[#888] hover:text-white flex items-center gap-1 text-sm"
              title="Skip to end"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Skip</span>
            </button>
          )}
          <button
            onClick={handleExit}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[#888] hover:text-white"
            title="Exit demo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Subtitle / current narration text */}
      {isStarted && !isFinished && currentNarrationText && (
        <div className="absolute bottom-16 left-0 right-0 z-40 px-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-white/60 text-sm leading-relaxed bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
              {currentNarrationText}
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {isStarted && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <Progress
            value={totalProgress}
            className="h-1 rounded-none bg-[#222]"
          />
        </div>
      )}

      {/* Main content */}
      <div className="h-full">{renderScene()}</div>
    </div>
  );
}

// Utility
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
