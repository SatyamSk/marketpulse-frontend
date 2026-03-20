import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Newspaper, AlertTriangle, Globe, Sparkles,
  Activity, RefreshCw, Clock, ExternalLink,
  ArrowUpDown, Zap, ChevronRight, BarChart3
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard"; 
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, ReferenceLine
} from "recharts";

type SortKey = "impact_score" | "sector" | "sentiment" | "z_score";

// Ultra-premium tooltip styling
const TT = {
  background: "rgba(10, 10, 10, 0.85)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#f8fafc",
  fontSize: "12px",
  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
  padding: "10px 14px"
};

function ShockBadge({ status, zScore }: { status: string; zScore: number | null }) {
  if (!status || status === "Normal") {
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-accent/40 text-muted-foreground border border-border/40">Normal</span>;
  }
  if (status === "Watch") {
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_-3px_rgba(var(--primary),0.3)] flex items-center gap-1.5 w-fit">
        Watch {zScore != null ? `Z: ${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  if (status === "Shock") {
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-warning/10 text-warning border border-warning/20 shadow-[0_0_10px_-3px_rgba(245,158,11,0.3)] flex items-center gap-1.5 w-fit">
        <Zap className="w-3 h-3" />
        Shock {zScore != null ? `Z: ${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  if (status === "Major Shock") {
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-bearish/10 text-bearish border border-bearish/20 shadow-[0_0_10px_-3px_rgba(239,68,68,0.3)] flex items-center gap-1.5 w-fit">
        <Zap className="w-3 h-3 animate-pulse" />
        MAJOR SHOCK {zScore != null ? `Z: ${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  return <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-accent/40 text-muted-foreground border border-border/40">{status}</span>;
}

export default function MorningBrief() {
  const { data, loading, error, refetch, lastFetch } = useDashboard();
  const [brief, setBrief]                   = useState<string | null>(null);
  const [briefLoading, setBriefLoading]     = useState(false);
  const [briefUsed, setBriefUsed]           = useState(0);
  const [briefRemaining, setBriefRemaining] = useState(2);
  const [sortKey, setSortKey] = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (api.briefStatus) {
      api.briefStatus()
        .then((s: any) => {
          setBriefUsed(s.used ?? 0);
          setBriefRemaining(s.remaining ?? 2);
        })
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
        top_headlines:  data.headlines.slice(0, 10),
        sector_summary: data.benchmark,
        regime:         data.market_regime,
      });
      setBrief(result.brief);
      setBriefUsed(result.used ?? briefUsed + 1);
      setBriefRemaining(result.remaining ?? Math.max(0, briefRemaining - 1));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail?.error === "daily_limit_reached") {
        setBriefRemaining(0);
      } else {
        setBrief("Could not generate outlook — check API connection.");
      }
    } finally {
      setBriefLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 fade-in">
        <div className="relative flex h-8 w-8">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50"></span>
          <span className="relative inline-flex rounded-full h-8 w-8 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]"></span>
        </div>
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Initializing Pipeline...</p>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh] fade-in">
        <div className="bg-background/40 backdrop-blur-xl border border-bearish/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center">
          <AlertTriangle className="w-12 h-12 text-bearish mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-foreground mb-2">Pipeline Disconnected</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <div className="inline-flex items-center justify-center gap-2 bg-accent/50 border border-border/50 px-4 py-2 rounded-lg text-xs font-mono text-foreground/80">
            <span className="text-primary">$</span> python api.py
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  if (!data) return null;

  const { market_regime, benchmark, headlines, pareto, summary_stats, shock_counts } = data;

  const sorted = [...headlines].sort((a: any, b: any) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const isRiskOn = market_regime.regime === "Risk On";
  const isPanic = market_regime.regime === "Panic";
  
  const regimeColor = isRiskOn ? "text-emerald-400" : isPanic ? "text-rose-400" : "text-amber-400";
  const regimeGlow = isRiskOn ? "shadow-[0_0_30px_-10px_rgba(52,211,153,0.2)] border-emerald-500/20" : 
                     isPanic ? "shadow-[0_0_30px_-10px_rgba(244,63,94,0.2)] border-rose-500/20" : 
                     "shadow-[0_0_30px_-10px_rgba(251,191,36,0.2)] border-amber-500/20";
  const regimeBg = isRiskOn ? "bg-gradient-to-br from-emerald-500/5 to-transparent" : 
                   isPanic ? "bg-gradient-to-br from-rose-500/5 to-transparent" : 
                   "bg-gradient-to-br from-amber-500/5 to-transparent";

  const topRisk = [...benchmark].sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk)[0];
  const totalShocks = (shock_counts?.major ?? 0) + (shock_counts?.shock ?? 0);

  return (
    <DashboardLayout>
      <div className="w-full xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-12">

        {/* --- ULTRA PREMIUM HERO SECTION --- */}
        <div className="relative overflow-hidden rounded-3xl bg-[#050505] border border-white/5 shadow-2xl fade-in">
          {/* Subtle background gradients */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[50%] -left-[10%] w-[70%] h-[150%] bg-primary/5 blur-[120px] rounded-full rotate-12"></div>
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[100%] bg-blue-500/5 blur-[100px] rounded-full"></div>
          </div>

          <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Live Intelligence</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Built By</span>
                  <span className="text-[11px] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Satyam</span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider">PGDM IMI Delhi</span>
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-3">
                Market Outlook
              </h1>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                <Clock className="w-4 h-4 opacity-50" />
                <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                {lastFetch && (
                  <>
                    <span className="opacity-30">|</span>
                    <span className="text-foreground/60">Updated {lastFetch.toLocaleTimeString()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col justify-end gap-3 shrink-0">
              <button
                onClick={refetch}
                className="group relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <RefreshCw className="w-4 h-4 text-foreground/70 group-hover:text-foreground group-hover:rotate-180 transition-all duration-500" /> 
                <span className="font-semibold text-sm text-foreground/90 group-hover:text-foreground tracking-wide">Sync Pipeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- METRICS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 fade-in" style={{ animationDelay: '0.1s' }}>
          <MetricCard label="Headlines Scored" value={summary_stats.total_headlines} icon={<Newspaper className="w-4 h-4" />} />
          <MetricCard label="Highest Risk Sector" value={topRisk?.sector ?? "—"} icon={<AlertTriangle className="w-4 h-4" />} colorClass="text-bearish" />
          <MetricCard label="Expected Regime" value={market_regime.regime} icon={<Activity className="w-4 h-4" />} colorClass={regimeColor} />
          <MetricCard label="Statistical Shocks" value={totalShocks} icon={<Zap className="w-4 h-4" />} colorClass={totalShocks > 0 ? "text-warning" : "text-muted-foreground"} />
        </div>

        {/* --- MID SECTION: REGIME & PARETO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in" style={{ animationDelay: '0.2s' }}>
          
          {/* Regime Card */}
          <div className={`lg:col-span-5 relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border ${regimeGlow} ${regimeBg} p-6 sm:p-8 flex flex-col justify-center transition-all hover:shadow-2xl`}>
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Activity className={`w-32 h-32 ${regimeColor}`} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${regimeColor}`}>
                  {market_regime.regime}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase bg-background/50 border border-border/50 text-muted-foreground backdrop-blur-sm">
                  System Classification
                </span>
              </div>
              <p className="text-sm sm:text-base text-foreground/80 mb-8 leading-relaxed font-medium">
                {market_regime.description}
              </p>
              <div className="space-y-4">
                {[
                  { label: "Focus",  value: market_regime.watch, color: "text-primary" },
                  { label: "Avoid",  value: market_regime.avoid, color: "text-bearish" },
                  { label: "Nifty",  value: market_regime.nifty_implication, color: "text-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-background/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-background/60 transition-colors">
                    <span className={`text-xs font-bold uppercase tracking-wider w-16 shrink-0 ${color}`}>{label}</span>
                    <span className="text-sm text-foreground/90 leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pareto Card */}
          <div className="lg:col-span-7 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Risk Concentration
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">
                  Top sectors driving 80% of expected market volatility
                </p>
              </div>
            </div>
            <div className="flex-1 min-h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pareto} margin={{ top: 10, right: 30, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="sector" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={50} dy={10} />
                  <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={TT} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <ReferenceLine yAxisId="r" y={80} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: "80% Threshold", fill: "rgba(245,158,11,0.8)", fontSize: 10, position: "insideBottomRight", dy: -5 }} />
                  <Bar yAxisId="l" dataKey="avg_weighted_risk" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {pareto.map((e: any, i: number) => (
                      <Cell key={i} fill={e.cumulative_pct <= 80 ? "#e11d48" : e.avg_weighted_risk > 10 ? "#d97706" : "#059669"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                  <Line yAxisId="r" type="monotone" dataKey="cumulative_pct" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#0f172a", stroke: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff" }} style={{ filter: 'drop-shadow(0px 4px 6px rgba(59,130,246,0.4))' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- AI GENERATOR SECTION --- */}
        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
          {!brief ? (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_40px_-15px_rgba(var(--primary),0.3)]">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Strategy Synthesis
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Compile the {summary_stats.total_headlines} analyzed headlines, shock events, and systemic regime data into a cohesive, actionable trading narrative.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  onClick={generateBrief}
                  disabled={briefLoading || briefRemaining <= 0}
                  className="group relative w-full sm:w-auto overflow-hidden rounded-xl bg-primary px-8 py-4 font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <span className="relative flex items-center justify-center gap-2 text-sm tracking-wide">
                    {briefLoading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Data...</>
                    ) : (
                      <>Generate Outlook <ChevronRight className="w-4 h-4" /></>
                    )}
                  </span>
                </button>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                  <Clock className="w-3 h-3" /> {briefRemaining} of 2 generations remaining
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl bg-[#0a0a0a] border border-primary/30 shadow-[0_0_50px_-15px_rgba(var(--primary),0.2)] overflow-hidden">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground tracking-wide">Synthesized Market Outlook</h3>
                    <p className="text-[11px] text-primary/70 font-mono mt-0.5 uppercase tracking-wider">AI-Narrated • Python-Scored</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                    {briefRemaining} runs left
                  </span>
                  <button
                    onClick={generateBrief}
                    disabled={briefLoading || briefRemaining <= 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all disabled:opacity-50"
                  >
                    {briefLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Regenerate
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="p-6 sm:p-8 md:p-10 relative">
                {/* Decorative quote mark */}
                <div className="absolute top-6 left-6 text-primary/5 text-8xl font-serif leading-none select-none pointer-events-none">"</div>
                <div className="
                  relative z-10 prose prose-sm sm:prose-base prose-invert max-w-4xl mx-auto
                  text-foreground/80 leading-relaxed
                  [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight
                  [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2
                  [&_h2]:before:content-[''] [&_h2]:before:block [&_h2]:before:w-2 [&_h2]:before:h-6 [&_h2]:before:bg-primary [&_h2]:before:rounded-full
                  [&_p]:mb-5 [&_p]:text-[15px]
                  [&_ul]:my-5 [&_li]:mb-2 [&_li]:pl-1
                  [&_strong]:text-white [&_strong]:font-semibold
                ">
                  <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- HEADLINES DATA TABLE --- */}
        <div className="bg-background/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-foreground tracking-wide">Live Impact Feed</h3>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-accent text-foreground/80 border border-border/50">
                  {headlines.length} Events
                </span>
                {totalShocks > 0 && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-warning/20 text-warning border border-warning/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {totalShocks} Shocks
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Click icon to read source
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px] max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 shadow-sm">
                  <tr>
                    {[
                      { key: "title",        label: "HEADLINE", width: "w-[30%]" },
                      { key: "sector",       label: "SECTOR",   width: "w-[12%]" },
                      { key: "sentiment",    label: "BIAS",     width: "w-[12%]" },
                      { key: "impact_score", label: "IMPACT",   width: "w-[8%]" },
                      { key: "z_score",      label: "ALERT",    width: "w-[13%]" },
                      { key: null,           label: "AI INSIGHT", width: "w-[20%]" },
                      { key: null,           label: "",         width: "w-[5%]" },
                    ].map(({ key, label, width }) => (
                      <th
                        key={label + (key ?? "")}
                        className={`px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ${width} ${key ? "cursor-pointer hover:text-foreground hover:bg-white/5 transition-colors" : ""}`}
                        onClick={() => key && handleSort(key as SortKey)}
                      >
                        <span className="flex items-center gap-2">
                          {label}
                          {key && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sorted.map((h: any, i: number) => {
                    const shockStatus = h.shock_status ?? "Normal";
                    const sourceUrl   = h["url"] as string | undefined;
                    
                    // Style row based on shock level
                    const rowStyles = 
                      shockStatus === "Major Shock" ? "bg-rose-500/[0.03] hover:bg-rose-500/[0.08]" : 
                      shockStatus === "Shock" ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.08]" : 
                      "hover:bg-white/[0.02]";

                    const borderLeft = 
                      shockStatus === "Major Shock" ? "border-l-2 border-l-rose-500" : 
                      shockStatus === "Shock" ? "border-l-2 border-l-amber-500" : 
                      "border-l-2 border-l-transparent";

                    return (
                      <tr key={i} className={`transition-colors duration-200 ${rowStyles}`}>
                        <td className={`px-5 py-4 ${borderLeft}`}>
                          <span className="line-clamp-2 text-sm font-medium text-foreground/90 leading-snug">
                            {h.title}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/50 text-foreground/70 border border-white/5">
                            {h.sector}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <SentimentBadge sentiment={h.sentiment} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${h.impact_score >= 8 ? "text-bearish" : h.impact_score >= 6 ? "text-warning" : "text-muted-foreground"}`}>
                            {h.impact_score}<span className="text-[10px] text-muted-foreground font-normal">/10</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <ShockBadge status={shockStatus} zScore={h.z_score != null ? Number(h.z_score) : null} />
                        </td>
                        <td className="px-5 py-4">
                          <p className="line-clamp-2 text-[12px] text-muted-foreground leading-relaxed">
                            {h.one_line_insight}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-right pr-6">
                          {sourceUrl && (
                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent/40 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-transparent hover:border-primary/30 transition-all" title="Read Source">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
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
