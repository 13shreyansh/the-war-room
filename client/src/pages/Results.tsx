import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield, ArrowLeft, Terminal, AlertTriangle, CheckCircle, Info,
  ChevronDown, ChevronUp, ExternalLink, Flame, Target, BarChart3, Users, Scale,
  FileText, Clock, Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import type { CritiqueData, PersonaData, ResearchLogEntry } from "@shared/types";

const AVATAR_ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5" />,
  chart: <BarChart3 className="w-5 h-5" />,
  target: <Target className="w-5 h-5" />,
  scale: <Scale className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  high: { bg: "bg-[#FF4C4C]/10", text: "text-[#FF4C4C]", border: "border-[#FF4C4C]/30", label: "HIGH RISK" },
  medium: { bg: "bg-[#FF9F43]/10", text: "text-[#FF9F43]", border: "border-[#FF9F43]/30", label: "MEDIUM RISK" },
  low: { bg: "bg-[#4CAF50]/10", text: "text-[#4CAF50]", border: "border-[#4CAF50]/30", label: "LOW RISK" },
};

const LOG_TYPE_COLORS: Record<string, string> = {
  error: "text-[#FF4C4C]",
  complete: "text-[#4CAF50]",
  inject: "text-[#FF9F43]",
  search: "text-[#6C9EFF]",
  analyze: "text-[#8A8A8A]",
};

export default function Results() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [logs, setLogs] = useState<ResearchLogEntry[]>([]);
  const [personas, setPersonas] = useState<PersonaData[]>([]);
  const [critiques, setCritiques] = useState<CritiqueData[]>([]);
  const [robustnessScore, setRobustnessScore] = useState<number | null>(null);
  const [scoreExplanation, setScoreExplanation] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [unhingedMode, setUnhingedMode] = useState(false);
  const [expandedCritiques, setExpandedCritiques] = useState<Set<number>>(new Set());
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [documentTitle, setDocumentTitle] = useState("");

  const terminalRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed time counter
  useEffect(() => {
    if (!isComplete && !isError) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isComplete, isError]);

  // Animate robustness score
  useEffect(() => {
    if (robustnessScore === null) return;
    let current = 0;
    const step = robustnessScore / 40;
    const interval = setInterval(() => {
      current += step;
      if (current >= robustnessScore) {
        setAnimatedScore(robustnessScore);
        clearInterval(interval);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 25);
    return () => clearInterval(interval);
  }, [robustnessScore]);

  const handleSSEEvent = useCallback((event: { type: string; data: unknown; timestamp: string }) => {
    switch (event.type) {
      case "research_log": {
        const log = event.data as ResearchLogEntry;
        setLogs(prev => [...prev, { ...log, timestamp: event.timestamp }]);
        break;
      }
      case "persona_created": {
        const persona = event.data as PersonaData;
        setPersonas(prev => [...prev, persona]);
        break;
      }
      case "critique_generated": {
        const critique = event.data as CritiqueData;
        setCritiques(prev => [...prev, critique]);
        // Auto-expand first critique
        setCritiques(prev => {
          if (prev.length === 1) {
            setExpandedCritiques(new Set([prev[0].id]));
          }
          return prev;
        });
        break;
      }
      case "robustness_score": {
        const { score, explanation } = event.data as { score: number; explanation: string };
        setRobustnessScore(score);
        setScoreExplanation(explanation);
        break;
      }
      case "session_complete":
      case "done": {
        setIsComplete(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const data = event.data as { sessionId?: number };
        if (data.sessionId) setSessionId(data.sessionId);
        break;
      }
      case "session_error":
      case "error": {
        setIsError(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const errData = event.data as { error?: string; message?: string };
        setErrorMessage(errData.error || errData.message || "Analysis failed");
        break;
      }
    }
  }, []);

  // Start analysis on mount
  useEffect(() => {
    const payloadStr = sessionStorage.getItem("warRoomPayload");
    if (!payloadStr) {
      navigate("/analyze");
      return;
    }

    const payload = JSON.parse(payloadStr);
    sessionStorage.removeItem("warRoomPayload");
    setDocumentTitle(payload.documentTitle || "Untitled Document");

    const startAnalysis = async () => {
      try {
        const response = await fetch("/api/war-room/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
          const errText = await response.text().catch(() => "");
          setIsError(true);
          setErrorMessage(errText || `Server returned ${response.status}`);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              handleSSEEvent(event);
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        console.error("Analysis failed:", err);
        setIsError(true);
        setErrorMessage(err instanceof Error ? err.message : "Network error");
      }
    };

    startAnalysis();
  }, [navigate, handleSSEEvent]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleCritique = (id: number) => {
    setExpandedCritiques(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCritiques(new Set(critiques.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCritiques(new Set());
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#4CAF50";
    if (score >= 50) return "#FF9F43";
    return "#FF4C4C";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Battle-Hardened";
    if (score >= 70) return "Well-Defended";
    if (score >= 50) return "Needs Reinforcement";
    if (score >= 30) return "Vulnerable";
    return "Critical Exposure";
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`min-h-screen bg-[#0A0A0A] text-white ${unhingedMode ? "unhinged-active" : ""}`}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-sm sticky top-0 z-50">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[#8A8A8A] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${unhingedMode ? "bg-[#FF4C4C] unhinged-glow" : "bg-[#FF4C4C]"}`}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-['Inter'] tracking-tight">THE WAR ROOM</span>
          {documentTitle && (
            <span className="text-xs text-[#555] hidden md:inline ml-2 border-l border-white/10 pl-3">
              {documentTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 text-[#555] mr-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{formatTime(elapsedTime)}</span>
          </div>
          {/* Unhinged toggle */}
          <button
            onClick={() => setUnhingedMode(!unhingedMode)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border transition-all duration-300 cursor-pointer select-none ${unhingedMode ? "border-[#FF4C4C]/50 bg-[#FF4C4C]/15 shadow-[0_0_12px_rgba(255,76,76,0.2)]" : "border-white/10 bg-[#1A1A1A] hover:border-white/20 hover:bg-[#222]"}`}
          >
            <Flame className={`w-4 h-4 transition-colors duration-300 ${unhingedMode ? "text-[#FF4C4C] animate-pulse" : "text-[#666]"}`} />
            <span className={`text-xs uppercase tracking-wider font-bold transition-colors duration-300 ${unhingedMode ? "text-[#FF4C4C]" : "text-[#888]"}`}>Unhinged</span>
            <div className={`relative w-10 h-5 rounded-full transition-all duration-300 ${unhingedMode ? "bg-[#FF4C4C]" : "bg-[#333]"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${unhingedMode ? "left-[22px] bg-white shadow-[0_0_6px_rgba(255,76,76,0.5)]" : "left-0.5 bg-[#888]"}`} />
            </div>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Terminal + Personas */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live Research Terminal */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF4C4C]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF9F43]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
                </div>
                <Terminal className="w-3.5 h-3.5 text-[#4CAF50] ml-2" />
                <span className="text-[10px] font-mono text-[#4CAF50] uppercase tracking-widest">Research Terminal</span>
                {!isComplete && !isError && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
                    <span className="text-[10px] text-[#4CAF50] font-mono">LIVE</span>
                  </div>
                )}
                {isComplete && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-[#4CAF50]" />
                    <span className="text-[10px] text-[#4CAF50] font-mono">DONE</span>
                  </div>
                )}
              </div>
              <div
                ref={terminalRef}
                className="p-3 h-[280px] overflow-y-auto font-['Fira_Code'] text-[11px] leading-[1.7] scrollbar-thin"
              >
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`mb-0.5 ${LOG_TYPE_COLORS[log.logType] || "text-[#8A8A8A]"} animate-in fade-in slide-in-from-left-2 duration-300`}
                    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  >
                    {log.message}
                  </div>
                ))}
                {!isComplete && !isError && logs.length > 0 && (
                  <div className="text-[#4CAF50] animate-pulse mt-1">_</div>
                )}
                {logs.length === 0 && !isError && (
                  <div className="text-[#555] animate-pulse">Initializing analysis pipeline...</div>
                )}
              </div>
            </div>

            {/* Persona Cards */}
            {personas.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">
                    Stakeholder Panel ({personas.length})
                  </h3>
                </div>
                {personas.map((persona, i) => (
                  <div
                    key={persona.id}
                    className="bg-[#111] border border-white/5 rounded-lg p-3 hover:border-[#FF4C4C]/20 transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-[#FF4C4C] shrink-0">
                        {AVATAR_ICONS[persona.avatarStyle] || <Shield className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate">{persona.name}</p>
                        <p className="text-[10px] text-[#666]">{persona.role}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#555] mt-2 italic leading-relaxed">"{persona.perspective}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Status summary when complete */}
            {isComplete && (
              <div className="bg-[#111] border border-[#4CAF50]/20 rounded-lg p-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                  <span className="text-xs font-semibold text-[#4CAF50]">Analysis Complete</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{personas.length}</div>
                    <div className="text-[9px] text-[#555] uppercase tracking-wider">Personas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{critiques.length}</div>
                    <div className="text-[9px] text-[#555] uppercase tracking-wider">Critiques</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{formatTime(elapsedTime)}</div>
                    <div className="text-[9px] text-[#555] uppercase tracking-wider">Duration</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column: Score + Critiques */}
          <div className="lg:col-span-8 space-y-4">
            {/* Robustness Score */}
            {robustnessScore !== null && (
              <div className="bg-[#111] border border-white/5 rounded-xl p-5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-[#8A8A8A]" />
                      <h3 className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">Robustness Score</h3>
                    </div>
                    <p className="text-sm font-semibold mt-2" style={{ color: getScoreColor(robustnessScore) }}>
                      {getScoreLabel(robustnessScore)}
                    </p>
                    <p className="text-xs text-[#666] mt-1 leading-relaxed">{scoreExplanation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-5xl font-bold font-['Inter'] tabular-nums" style={{ color: getScoreColor(robustnessScore) }}>
                      {animatedScore}
                    </div>
                    <div className="text-[10px] text-[#555] mt-0.5 font-mono">/ 100</div>
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-4 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${animatedScore}%`,
                      backgroundColor: getScoreColor(robustnessScore),
                    }}
                  />
                </div>
              </div>
            )}

            {/* Critique Cards */}
            {critiques.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold text-[#555] uppercase tracking-widest">
                    {critiques.length} Critique{critiques.length !== 1 ? "s" : ""} Identified
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={expandAll} className="text-[10px] text-[#555] hover:text-white transition-colors uppercase tracking-wider">
                      Expand All
                    </button>
                    <span className="text-[#333]">|</span>
                    <button onClick={collapseAll} className="text-[10px] text-[#555] hover:text-white transition-colors uppercase tracking-wider">
                      Collapse
                    </button>
                  </div>
                </div>
                {critiques.map((critique, i) => {
                  const isExpanded = expandedCritiques.has(critique.id);
                  const severity = SEVERITY_STYLES[critique.severity] || SEVERITY_STYLES.medium;

                  return (
                    <div
                      key={critique.id}
                      className={`bg-[#111] border rounded-xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${severity.border} ${
                        unhingedMode ? "unhinged-glow" : ""
                      }`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {/* Collapsed header */}
                      <button
                        onClick={() => toggleCritique(critique.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#151515] transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Persona avatar */}
                          {(() => {
                            const persona = personas.find(p => p.id === critique.personaId);
                            const avatarStyle = persona?.avatarStyle || "shield";
                            return (
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${severity.bg}`}>
                                <span className={severity.text}>
                                  {AVATAR_ICONS[avatarStyle] || <Shield className="w-4 h-4" />}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{critique.title}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severity.bg} ${severity.text} uppercase tracking-widest`}>
                                {severity.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#555] mt-0.5">
                              From: <span className="text-[#8A8A8A]">{critique.personaName}</span>
                              {critique.documentSection && (
                                <span className="ml-2 text-[#444]">
                                  — {critique.documentSection}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {/* Confidence Score */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <span className={`text-xs font-mono font-bold ${
                                  critique.confidenceScore >= 80 ? "text-[#4CAF50]" :
                                  critique.confidenceScore >= 60 ? "text-[#FF9F43]" :
                                  "text-[#FF4C4C]"
                                }`}>
                                  {critique.confidenceScore}%
                                </span>
                                <Info className="w-3 h-3 text-[#444]" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#1A1A1A] border-white/10 text-white max-w-xs">
                              <p className="text-xs">{critique.confidenceReason || "Confidence based on available evidence"}</p>
                            </TooltipContent>
                          </Tooltip>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#444]" /> : <ChevronDown className="w-4 h-4 text-[#444]" />}
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* Attack */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              {unhingedMode ? (
                                <Flame className="w-3.5 h-3.5 text-[#FF4C4C]" />
                              ) : (
                                <Target className="w-3.5 h-3.5 text-[#FF4C4C]" />
                              )}
                              <p className="text-[10px] font-semibold text-[#FF4C4C] uppercase tracking-widest">
                                {unhingedMode ? "The Attack (Unhinged)" : "The Attack"}
                              </p>
                            </div>
                            <p className={`text-sm leading-relaxed ${unhingedMode ? "text-[#FF9F43]" : "text-[#CCC]"}`}>
                              {unhingedMode && critique.unhingedAttack ? critique.unhingedAttack : critique.attack}
                            </p>
                          </div>

                          {/* Citation */}
                          {critique.citation && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <FileText className="w-3.5 h-3.5 text-[#6C9EFF]" />
                                <p className="text-[10px] font-semibold text-[#6C9EFF] uppercase tracking-widest">Evidence</p>
                              </div>
                              <div className="flex items-start gap-2.5 bg-[#0A0A0A] rounded-lg p-3 border border-white/5">
                                <Info className="w-3.5 h-3.5 text-[#6C9EFF] shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-xs text-[#8A8A8A] leading-relaxed">{critique.citation}</p>
                                  {critique.citationUrl && (
                                    <a
                                      href={critique.citationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-[#6C9EFF] hover:underline flex items-center gap-1 mt-1.5"
                                    >
                                      View Source <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Suggested Fix */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#4CAF50]" />
                              <p className="text-[10px] font-semibold text-[#4CAF50] uppercase tracking-widest">Suggested Fix</p>
                            </div>
                            <div className="flex items-start gap-2.5 bg-[#4CAF50]/5 border border-[#4CAF50]/10 rounded-lg p-3">
                              <CheckCircle className="w-3.5 h-3.5 text-[#4CAF50] shrink-0 mt-0.5" />
                              <p className="text-sm text-[#CCC] leading-relaxed">{critique.suggestedFix}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="bg-[#FF4C4C]/5 border border-[#FF4C4C]/20 rounded-xl p-8 text-center animate-in fade-in duration-300">
                <AlertTriangle className="w-10 h-10 text-[#FF4C4C] mx-auto mb-4" />
                <p className="text-[#FF4C4C] font-semibold text-lg">Analysis Failed</p>
                <p className="text-sm text-[#8A8A8A] mt-2 max-w-md mx-auto">
                  {errorMessage || "Something went wrong during the analysis. Please try again."}
                </p>
                <Button
                  onClick={() => navigate("/analyze")}
                  className="mt-6 bg-[#FF4C4C] hover:bg-[#E04343] text-white px-6"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Loading state when no critiques yet */}
            {!isComplete && !isError && critiques.length === 0 && (
              <div className="bg-[#111] border border-white/5 rounded-xl p-16 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border-2 border-[#FF4C4C]/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-[#FF4C4C] rounded-full animate-spin" />
                  <div className="absolute inset-2 border-2 border-transparent border-t-[#FF9F43] rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                  <Shield className="absolute inset-0 m-auto w-6 h-6 text-[#FF4C4C]/50" />
                </div>
                <p className="text-white font-semibold">Analyzing your document...</p>
                <p className="text-xs text-[#555] mt-2">
                  {personas.length > 0
                    ? `${personas.length} persona${personas.length !== 1 ? "s" : ""} generated. Generating critiques...`
                    : "Watch the Research Terminal for live progress"
                  }
                </p>
              </div>
            )}

            {/* Complete footer */}
            {isComplete && critiques.length > 0 && (
              <div className="flex items-center justify-between bg-[#111] border border-white/5 rounded-xl p-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                  <div>
                    <p className="text-sm font-semibold text-white">War Room Session Complete</p>
                    <p className="text-[10px] text-[#555]">
                      {critiques.length} critiques across {personas.length} stakeholder perspectives
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/analyze")}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-[#1A1A1A] text-xs"
                >
                  New Analysis
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
