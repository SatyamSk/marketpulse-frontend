import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Newspaper, AlertTriangle, Sparkles, Activity,
  RefreshCw, Clock, ExternalLink, ArrowUpDown,
  Zap, ChevronRight, BarChart3, TrendingUp, TrendingDown, Shield
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, ReferenceLine
} from "recharts";

type SortKey = "impact_score" | "sector" | "sentiment" | "z_score";

const TT = {
  background: "rgba(10,10,10,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px", color: "#f8fafc",
  fontSize: "11px", padding: "8px 12px",
};

const SECTOR_COLORS: Record<string, string> = {
  Banking: "#22c55e", Energy: "#3b82f6", IT: "#f59e0b",
  Fintech: "#818cf8", Manufacturing: "#f472b6", Healthcare: "#10b981",
  FMCG: "#a78bfa", Startup: "#06b6d4", Retail: "#fb923c", Other: "#64748b",
};

function ShockBadge({ status, zScore }: { status: string; zScore: number | null }) {
  if (!status || status === "Normal")
    return <span className="px-2 py-0.5 rounded text-[10px] bg-accent/40 text-muted-foreground border border-border/40">Normal</span>;
  if (status === "Watch")
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 w-fit">Watch {zScore != null ? `Z:${Number(zScore).toFixed(1)}` : ""}</span>;
  if (status === "Shock")
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 flex items-center gap-1 w-fit"><Zap className="w-2.5 h-2.5" />Shock {zScore != null ? `Z:${Number(zScore).toFixed(1)}` : ""}</span>;
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bearish/10 text-bearish border border-bearish/20 flex items-center gap-1 w-fit"><Zap className="w-2.5 h-2.5 animate-pulse" />MAJOR {zScore != null ? `Z:${Number(zScore).toFixed(1)}` : ""}</span>;
}

function SignalChip({ signal }: { signal: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    "BUY BIAS":          { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-400" },
    "AVOID":             { bg: "bg-rose-500/15 border-rose-500/30",       text: "text-rose-400"    },
    "CAUTION":           { bg: "bg-amber-500/15 border-amber-500/30",     text: "text-amber-400"   },
    "IMPROVING":         { bg: "bg-cyan-500/15 border-cyan-500/30",       text: "text-cyan-400"    },
    "CONTRARIAN WATCH":  { bg: "bg-purple-500/15 border-purple-500/30",   text: "text-purple-400"  },
    "NEUTRAL":           { bg: "bg-accent/40 border-border/40",           text: "text-muted-foreground" },
  };
  const s = map[signal] ?? map["NEUTRAL"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide ${s.bg} ${s.text}`}>
      {signal}
    </span>
  );
}

export default function MorningBrief() {
  const { data, loading, error, refetch, lastFetch } = useDashboard();
  const [brief, setBrief]               = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefUsed, setBriefUsed]       = useState(0);
  const [briefRemaining, setBriefRemaining] = useState(2);
  const [sortKey, setSortKey]           = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc]           = useState(false);

  useEffect(() => {
    if (api.briefStatus) {
      api.briefStatus()
        .then((s: any) => { setBriefUsed(s.used ?? 0); setBriefRemaining(s.remaining ?? 2); })
        .catch(() => {});
    }
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const generateBrief = async () => {
    if (!data || briefRemaining <= 0) return;
    setBriefLoading(true);
    try {
      const result = await api.generateBrief({
        top_headlines: data.headlines.slice(0, 10),
        sector_summary: data.benchmark,
        regime: data.market_regime,
      });
      setBrief(result.brief);
      setBriefUsed(result.used ?? briefUsed + 1);
      setBriefRemaining(result.remaining ?? Math.max(0, briefRemaining - 1));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail?.error === "daily_limit_reached") setBriefRemaining(0);
      else setBrief("Could not generate outlook — check API connection.");
    } finally {
      setBriefLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50" />
          <span className="relative inline-flex rounded-full h-6 w-6 bg-primary" />
        </div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Initializing Pipeline...</p>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="border border-bearish/20 p-6 rounded-xl max-w-sm w-full text-center">
          <AlertTriangle className="w-10 h-10 text-bearish mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1.5">Pipeline Disconnected</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  if (!data) return null;

  const { market_regime, benchmark, headlines, pareto, summary_stats, shock_counts, market_stress_index } = data;

  const sorted = [...headlines].sort((a: any, b: any) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const isRiskOn = market_regime.regime === "Risk On";
  const isPanic  = market_regime.regime === "Panic";
  const regimeColor = isRiskOn ? "text-emerald-400" : isPanic ? "text-rose-400" : "text-amber-400";
  const regimeBorder = isRiskOn ? "border-emerald-500/20 bg-emerald-500/5" : isPanic ? "border-rose-500/20 bg-rose-500/5" : "border-amber-500/20 bg-amber-500/5";

  const totalShocks = (shock_counts?.major ?? 0) + (shock_counts?.shock ?? 0);
  const msiLevel = market_stress_index?.level ?? "Low";
  const msiValue = market_stress_index?.msi ?? 0;

  // Sector priority: sort by normalized risk (removes Banking weight bias)
  const sectorsByRisk = [...benchmark].sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk);

  // Opportunities: positive signal, good CSI, manageable risk
  const opportunities = [...benchmark]
    .filter((s: any) => s.composite_sentiment_index > 10 && s.avg_weighted_risk < 35)
    .sort((a: any, b: any) => b.composite_sentiment_index - a.composite_sentiment_index)
    .slice(0, 4);

  // Risk alerts: high risk sectors
  const riskSectors = sectorsByRisk.filter((s: any) => s.avg_weighted_risk >= 20).slice(0, 5);

  const msiColors = {
    Low: { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", bar: "#22c55e" },
    Elevated: { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", bar: "#f59e0b" },
    High: { text: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", bar: "#f97316" },
    Critical: { text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", bar: "#ef4444" },
  };
  const msiStyle = msiColors[msiLevel as keyof typeof msiColors] ?? msiColors.Low;

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-8">

        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl bg-[#080808] border border-white/5 fade-in">
          <div className="absolute -top-1/2 -left-[5%] w-1/2 h-[150%] bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-primary uppercase">Live Intelligence</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Built by</span>
                  <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Satyam</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-border" />
                  <span className="text-[9px] text-foreground/60 uppercase tracking-wider">PGDM IMI Delhi</span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                  Market Outlook
                </h1>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 opacity-50" />
                  <span>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  {lastFetch && <><span className="opacity-30">·</span><span>{lastFetch.toLocaleTimeString()}</span></>}
                </div>
              </div>
            </div>
            <button onClick={refetch} className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs text-foreground/80 hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              Sync Pipeline
            </button>
          </div>
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in">
          {/* Headlines */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="label-text">Headlines Scored</p>
              <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{summary_stats.total_headlines}</p>
            <p className="text-[10px] text-muted-foreground mt-1">from {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          </div>

          {/* Regime */}
          <div className={`glass-card p-4 border ${regimeBorder}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="label-text">Market Regime</p>
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className={`text-lg font-bold ${regimeColor}`}>{market_regime.regime}</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{market_regime.nifty_implication}</p>
          </div>

          {/* Market Stress Index */}
          <div className={`glass-card p-4 border ${msiStyle.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="label-text">Market Stress</p>
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${msiStyle.text}`}>{msiValue}</p>
              <p className={`text-xs font-semibold ${msiStyle.text}`}>{msiLevel}</p>
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${msiValue}%`, background: msiStyle.bar }} />
            </div>
          </div>

          {/* Shocks */}
          <div className={`glass-card p-4 ${totalShocks > 0 ? "border border-warning/20 bg-warning/5" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="label-text">Shock Events</p>
              <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-semibold ${totalShocks > 0 ? "text-warning" : "text-muted-foreground"}`}>{totalShocks}</p>
            <div className="flex gap-2 mt-1">
              {(shock_counts?.major ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-rose-400">{shock_counts.major} major</span>
              )}
              {(shock_counts?.shock ?? 0) > 0 && (
                <span className="text-[10px] font-bold text-amber-400">{shock_counts.shock} shock</span>
              )}
              {totalShocks === 0 && <span className="text-[10px] text-muted-foreground">none today</span>}
            </div>
          </div>
        </div>

        {/* SECTOR RISK & OPPORTUNITY PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">

          {/* Risk Priority Stack */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-foreground">Risk Priority</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">sorted by weighted risk score</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">All sectors ranked by actual risk today — not structural weight bias</p>
            <div className="space-y-2">
              {sectorsByRisk.map((s: any, i: number) => {
                const risk = Number(s.avg_weighted_risk);
                const maxRisk = Number(sectorsByRisk[0]?.avg_weighted_risk ?? 1);
                const pct = Math.max((risk / maxRisk) * 100, 4);
                const color = risk >= 45 ? "#ef4444" : risk >= 25 ? "#f97316" : risk >= 15 ? "#f59e0b" : "#22c55e";
                const sColor = SECTOR_COLORS[s.sector] ?? "#64748b";
                return (
                  <div key={s.sector} className="flex items-center gap-2.5">
                    <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">{i + 1}</span>
                    <span className="text-[11px] font-medium text-foreground w-24 shrink-0" style={{ color: sColor }}>
                      {s.sector}
                    </span>
                    <div className="flex-1 h-5 bg-white/4 rounded overflow-hidden">
                      <div
                        className="h-full rounded flex items-center px-2 transition-all"
                        style={{ width: `${pct}%`, background: `${color}22`, borderLeft: `2px solid ${color}` }}
                      >
                        <span className="text-[10px] font-semibold font-mono" style={{ color }}>
                          {risk.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <SignalChip signal={s.investment_signal ?? "NEUTRAL"} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opportunities + Regime */}
          <div className="flex flex-col gap-3">

            {/* Opportunities */}
            <div className="glass-card p-4 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Opportunities</h3>
                <span className="text-[10px] text-muted-foreground ml-auto">positive CSI + manageable risk</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Sectors with bullish momentum and contained risk exposure</p>
              {opportunities.length > 0 ? (
                <div className="space-y-2">
                  {opportunities.map((s: any) => {
                    const csi = Number(s.composite_sentiment_index);
                    const vel = Number(s.sentiment_velocity ?? 0);
                    const sColor = SECTOR_COLORS[s.sector] ?? "#64748b";
                    return (
                      <div key={s.sector} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                        <span className="text-[11px] font-bold w-24 shrink-0" style={{ color: sColor }}>
                          {s.sector}
                        </span>
                        <div className="flex-1 flex items-center gap-3 text-[10px]">
                          <span className="text-emerald-400 font-mono font-bold">CSI {csi > 0 ? "+" : ""}{csi.toFixed(1)}</span>
                          {vel !== 0 && (
                            <span className={`font-mono ${vel > 0 ? "text-cyan-400" : "text-rose-400"}`}>
                              {vel > 0 ? "▲" : "▼"} {vel > 0 ? "+" : ""}{vel.toFixed(1)}
                            </span>
                          )}
                          <span className="text-muted-foreground ml-auto">Risk {Number(s.avg_weighted_risk).toFixed(1)}</span>
                        </div>
                        <SignalChip signal={s.investment_signal ?? "NEUTRAL"} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-accent/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  No clear opportunities identified — defensive positioning favored
                </div>
              )}
            </div>

            {/* Regime card compact */}
            <div className={`glass-card p-4 border ${regimeBorder}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-base font-bold ${regimeColor}`}>{market_regime.regime}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-background/50 border border-border/50 px-2 py-0.5 rounded text-muted-foreground">System Classification</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Focus", value: market_regime.watch,            color: "text-primary"  },
                  { label: "Avoid", value: market_regime.avoid,            color: "text-rose-400" },
                  { label: "Nifty", value: market_regime.nifty_implication, color: "text-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex gap-2 text-[11px]">
                    <span className={`font-bold uppercase tracking-wide w-10 shrink-0 ${color}`}>{label}</span>
                    <span className="text-foreground/80 leading-snug">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PARETO CHART */}
        <div className="glass-card p-4 fade-in">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Risk Concentration — Pareto</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">which sectors drive 80% of total market risk today</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={pareto} margin={{ top: 5, right: 32, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="sector" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={40} dy={5} />
              <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={TT} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <ReferenceLine yAxisId="r" y={80} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: "80%", fill: "rgba(245,158,11,0.8)", fontSize: 9, position: "insideBottomRight", dy: -4 }} />
              <Bar yAxisId="l" dataKey="avg_weighted_risk" radius={[3, 3, 0, 0]} maxBarSize={44}>
                {pareto.map((e: any, i: number) => (
                  <Cell key={i} fill={e.cumulative_pct <= 80 ? "#e11d48" : e.avg_weighted_risk > 10 ? "#d97706" : "#059669"} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line yAxisId="r" type="monotone" dataKey="cumulative_pct" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#0f172a", stroke: "#3b82f6", strokeWidth: 1.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* AI BRIEF */}
        <div className="fade-in">
          {!brief ? (
            <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Strategy Synthesis
                </h3>
                <p className="text-xs text-muted-foreground max-w-lg">
                  Compile {summary_stats.total_headlines} headlines, risk stack, and regime data into a cohesive trading narrative.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={generateBrief}
                  disabled={briefLoading || briefRemaining <= 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {briefLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing...</> : <>Generate Outlook <ChevronRight className="w-3.5 h-3.5" /></>}
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> {briefRemaining} of 2 runs remaining today
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#0a0a0a] border border-primary/20 overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/5 bg-primary/5">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Synthesized Market Outlook</h3>
                    <p className="text-[9px] text-primary/70 font-mono uppercase tracking-wider">AI-Narrated · Python-Scored</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{briefRemaining} runs left</span>
                  <button
                    onClick={generateBrief}
                    disabled={briefLoading || briefRemaining <= 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all disabled:opacity-50"
                  >
                    {briefLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Regenerate
                  </button>
                </div>
              </div>
              <div className="p-5 sm:p-7">
                <div className="prose prose-sm prose-invert max-w-3xl mx-auto text-foreground/80 [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-1.5 [&_p]:text-[13px] [&_p]:leading-relaxed [&_li]:text-[13px] [&_strong]:text-white">
                  <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HEADLINES TABLE */}
        <div className="bg-background/40 border border-white/10 rounded-xl overflow-hidden fade-in">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-foreground">Live Impact Feed</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-foreground/80 border border-border/50">{headlines.length}</span>
              {totalShocks > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/20 text-warning border border-warning/30"><Zap className="w-2.5 h-2.5 inline mr-0.5" />{totalShocks} shocks</span>}
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:block">Click headline to open source</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[820px] max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#0a0a0a]/95 border-b border-white/10">
                  <tr>
                    {[
                      { key: "title",        label: "HEADLINE",   w: "w-[34%]" },
                      { key: "sector",       label: "SECTOR",     w: "w-[11%]" },
                      { key: "sentiment",    label: "BIAS",       w: "w-[9%]"  },
                      { key: "impact_score", label: "IMPACT",     w: "w-[8%]"  },
                      { key: "z_score",      label: "ALERT",      w: "w-[12%]" },
                      { key: null,           label: "AI INSIGHT", w: "w-[26%]" },
                    ].map(({ key, label, w }) => (
                      <th
                        key={label + (key ?? "")}
                        className={`px-4 py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider ${w} ${key ? "cursor-pointer hover:text-foreground hover:bg-white/5 transition-colors" : ""}`}
                        onClick={() => key && handleSort(key as SortKey)}
                      >
                        <span className="flex items-center gap-1.5">
                          {label}
                          {key && <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sorted.map((h: any, i: number) => {
                    const shock = h.shock_status ?? "Normal";
                    const url   = h["url"] as string | undefined;
                    const sColor = SECTOR_COLORS[h.sector] ?? "#64748b";
                    const rowBg =
                      shock === "Major Shock" ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.08]" :
                      shock === "Shock"       ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]" :
                      "hover:bg-white/[0.02]";
                    const borderL =
                      shock === "Major Shock" ? "border-l-2 border-l-rose-500" :
                      shock === "Shock"       ? "border-l-2 border-l-amber-500" :
                      "border-l-2 border-l-transparent";
                    return (
                      <tr key={i} className={`transition-colors duration-150 ${rowBg}`}>
                        <td className={`px-4 py-3 ${borderL}`}>
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              className="line-clamp-2 text-[13px] font-medium text-blue-400 hover:text-blue-300 hover:underline leading-snug transition-colors">
                              {h.title}
                            </a>
                          ) : (
                            <span className="line-clamp-2 text-[13px] font-medium text-foreground/90 leading-snug">{h.title}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-white/10" style={{ background: `${sColor}18`, color: sColor }}>
                            {h.sector}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <SentimentBadge sentiment={h.sentiment} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm font-bold ${h.impact_score >= 8 ? "text-rose-400" : h.impact_score >= 6 ? "text-amber-400" : "text-muted-foreground"}`}>
                            {h.impact_score}<span className="text-[9px] text-muted-foreground font-normal">/10</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ShockBadge status={shock} zScore={h.z_score != null ? Number(h.z_score) : null} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed pr-2">{h.one_line_insight}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
