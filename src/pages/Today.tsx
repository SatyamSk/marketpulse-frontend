import { useState, useEffect } from "react";
import {
  AlertTriangle, ArrowRight, ChevronRight, Clock,
  Eye, EyeOff, RefreshCw, Shield, TrendingDown, TrendingUp, Zap
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AgentThinkingSheet } from "@/components/AgentThinkingSheet";
import { api } from "@/lib/api";

interface TodayData {
  mood: string;
  mood_color: "green" | "amber" | "red";
  confidence: number;
  narrative: string;
  drivers: { icon: string; headline: string; impact: string; entity: string }[];
  sectors: { name: string; score: number; label: string; direction: string; signal: string }[];
  hidden_signals: { icon: string; text: string; entity: string; expected_delay: string }[];
  what_could_go_wrong: string[];
  invalidation: string;
  signal_quality: string;
  last_updated: string | null;
}

function ConfidenceRing({ value, size = 64 }: { value: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="confidence-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }} />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{value}%</span>
    </div>
  );
}

function MoodIndicator({ mood, color }: { mood: string; color: string }) {
  const colorClass = color === "green" ? "mood-green" : color === "red" ? "mood-red" : "mood-amber";
  const bgColor = color === "green" ? "#22c55e" : color === "red" ? "#ef4444" : "#f59e0b";
  const textColor = color === "green" ? "text-emerald-400" : color === "red" ? "text-rose-400" : "text-amber-400";

  return (
    <div className="flex items-center gap-4">
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ${colorClass}`}>
        <div className="absolute inset-0 rounded-full mood-pulse mood-glow" style={{ backgroundColor: bgColor, opacity: 0.15 }} />
        <div className="w-6 h-6 rounded-full mood-pulse" style={{ backgroundColor: bgColor }} />
      </div>
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight capitalize ${textColor}`}>
          {mood}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Today's Market Mood</p>
      </div>
    </div>
  );
}

function SectorBar({ sector }: { sector: TodayData["sectors"][0] }) {
  const barColor =
    sector.label === "Strong" ? "#22c55e" :
    sector.label === "Good" ? "#10b981" :
    sector.label === "Risky" ? "#ef4444" :
    sector.label === "Careful" ? "#f59e0b" :
    sector.label === "Contrarian" ? "#818cf8" : "#64748b";

  const directionIcon =
    sector.direction === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> :
    sector.direction === "down" ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> :
    sector.direction === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> :
    <span className="w-3.5 h-3.5 text-muted-foreground text-center text-xs">→</span>;

  return (
    <div className="flex items-center gap-3 py-1.5 group">
      <span className="text-sm font-medium text-foreground/90 w-28 shrink-0">{sector.name}</span>
      <div className="flex-1 sector-bar-track">
        <div className="sector-bar-fill" style={{ width: `${sector.score}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-xs font-semibold w-20 text-right" style={{ color: barColor }}>{sector.label}</span>
      <span className="w-5 flex justify-center">{directionIcon}</span>
    </div>
  );
}

function DriverCard({ driver }: { driver: TodayData["drivers"][0] }) {
  const impactClass = driver.impact === "positive" ? "positive" : driver.impact === "negative" ? "negative" : "warning";
  return (
    <div className={`driver-card ${impactClass}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none shrink-0">{driver.icon}</span>
        <p className="text-sm text-foreground/80 leading-relaxed">{driver.headline}</p>
      </div>
    </div>
  );
}

export default function Today() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getToday();
      setData(result as TodayData);
    } catch (err: any) {
      setError(err?.message || "Failed to load intelligence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50" />
          <span className="relative inline-flex rounded-full h-6 w-6 bg-primary" />
        </div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Loading Intelligence...</p>
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="border border-bearish/20 p-6 rounded-xl max-w-sm w-full text-center">
          <AlertTriangle className="w-10 h-10 text-bearish mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1.5">Couldn't Load Data</h2>
          <p className="text-xs text-muted-foreground">{error || "Unknown error"}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all">
            Retry
          </button>
        </div>
      </div>
    </DashboardLayout>
  );

  const hasData = data.mood !== "waiting";

  return (
    <DashboardLayout>
      <div className="w-full max-w-[900px] mx-auto space-y-6 pb-12 px-1">

        {/* ── Header ── */}
        <div className="flex items-center justify-between fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              <span className="text-[9px] font-bold tracking-widest text-primary uppercase">CausalEdge AI</span>
            </div>
            {data.last_updated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 opacity-50" />
                <span>{new Date(data.last_updated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs text-foreground/80 hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" /> Refresh
            </button>
            <AgentThinkingSheet />
          </div>
        </div>

        {!hasData ? (
          /* ── Empty State ── */
          <div className="glass-card p-8 text-center fade-in space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">No Analysis Yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The 9-agent intelligence pipeline hasn't run today. Head to <a href="/admin" className="text-primary font-semibold hover:underline">Admin</a> and hit "Run Agent Intelligence" to generate today's analysis.
            </p>
          </div>
        ) : (
          <>
            {/* ── MOOD + CONFIDENCE ── */}
            <div className="glass-card p-6 fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <MoodIndicator mood={data.mood} color={data.mood_color} />
                <div className="flex items-center gap-6">
                  <ConfidenceRing value={data.confidence} />
                  {data.signal_quality && data.signal_quality !== "none" && (
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signal Quality</p>
                      <p className={`text-sm font-bold capitalize ${
                        data.signal_quality === "high" ? "text-emerald-400" :
                        data.signal_quality === "low" ? "text-rose-400" : "text-amber-400"
                      }`}>{data.signal_quality}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Narrative */}
              <div className="mt-5 pt-5 border-t border-white/5">
                <p className="text-[15px] leading-relaxed text-foreground/85">{data.narrative}</p>
              </div>
            </div>

            {/* ── WHAT'S DRIVING THIS ── */}
            {data.drivers.length > 0 && (
              <div className="space-y-2 fade-in fade-in-delay-1">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" /> What's Driving This
                </h2>
                <div className="space-y-2">
                  {data.drivers.map((d, i) => <DriverCard key={i} driver={d} />)}
                </div>
              </div>
            )}

            {/* ── HIDDEN SIGNALS ── */}
            {data.hidden_signals.length > 0 && (
              <div className="space-y-2 fade-in fade-in-delay-2">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" /> Hidden Signals
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">things the market might be missing</span>
                </h2>
                <div className="space-y-2">
                  {data.hidden_signals.map((s, i) => (
                    <div key={i} className="driver-card hidden">
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none shrink-0">{s.icon}</span>
                        <div>
                          <p className="text-sm text-foreground/80 leading-relaxed">{s.text}</p>
                          {s.expected_delay && s.expected_delay !== "now" && (
                            <p className="text-[10px] text-indigo-400/70 mt-1">Expected timeline: {s.expected_delay}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECTORS AT A GLANCE ── */}
            {data.sectors.length > 0 && (
              <div className="glass-card p-5 fade-in fade-in-delay-2">
                <h2 className="text-sm font-bold text-foreground mb-4">Sectors at a Glance</h2>
                <div className="space-y-1">
                  {data.sectors.map(s => <SectorBar key={s.name} sector={s} />)}
                </div>
              </div>
            )}

            {/* ── WHAT COULD GO WRONG ── */}
            {(data.what_could_go_wrong.length > 0 || data.invalidation) && (
              <div className="space-y-2 fade-in fade-in-delay-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" /> What Could Go Wrong
                </h2>
                <div className="glass-card p-4 border border-amber-500/10 bg-amber-500/[0.02] space-y-2.5">
                  {data.what_could_go_wrong.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-amber-400 mt-0.5 text-xs">•</span>
                      <p className="text-sm text-foreground/75 leading-relaxed">{risk}</p>
                    </div>
                  ))}
                  {data.invalidation && !data.what_could_go_wrong.includes(data.invalidation) && (
                    <div className="flex items-start gap-2.5 pt-2 border-t border-amber-500/10">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-400/90 font-medium">{data.invalidation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="flex flex-col sm:flex-row gap-3 fade-in fade-in-delay-4">
              <a href="/analysis" className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-foreground/80 hover:text-foreground transition-all group">
                <Zap className="w-4 h-4 text-primary" /> Full Analysis
                <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </a>
              <a href="/chat" className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-sm font-semibold text-primary hover:text-white transition-all group">
                💬 Ask a Question
                <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>

            {/* ── Footer Credit ── */}
            <div className="text-center pt-4 fade-in fade-in-delay-4">
              <p className="text-[10px] text-muted-foreground/50">
                Built by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-semibold">Satyam</span> · PGDM IMI Delhi ·
                9 agents · {data.sectors.length} sectors · refreshed {data.last_updated ? new Date(data.last_updated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
