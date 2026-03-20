import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Newspaper, AlertTriangle, Globe, Sparkles,
  Activity, RefreshCw, Clock, ExternalLink,
  ArrowUpDown, Zap, ChevronRight, BarChart3, Send
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

// Compact premium tooltip
const TT = {
  background: "rgba(10, 10, 10, 0.9)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#f8fafc",
  fontSize: "11px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  padding: "8px 12px"
};

function ShockBadge({ status, zScore }: { status: string; zScore: number | null }) {
  if (!status || status === "Normal") {
    return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/40 text-muted-foreground border border-border/40">Normal</span>;
  }
  if (status === "Watch") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_-3px_rgba(var(--primary),0.3)] flex items-center gap-1 w-fit">
        Watch {zScore != null ? `Z: ${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  if (status === "Shock") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 shadow-[0_0_8px_-3px_rgba(245,158,11,0.3)] flex items-center gap-1 w-fit">
        <Zap className="w-3 h-3" />
        Shock {zScore != null ? `Z: ${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  if (status === "Major Shock") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bearish/10 text-bearish border border-bearish/20 shadow-[0_0_8px_-3px_rgba(239,68,68,0.3)] flex items-center gap-1 w-fit">
        <Zap className="w-3 h-3 animate-pulse" />
        MAJOR {zScore != null ? `Z: ${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/40 text-muted-foreground border border-border/40">{status}</span>;
}

export default function MorningBrief() {
  const { data, loading, error, refetch, lastFetch } = useDashboard();
  
  // Static Brief States
  const [brief, setBrief]                   = useState<string | null>(null);
  const [briefLoading, setBriefLoading]     = useState(false);
  const [briefUsed, setBriefUsed]           = useState(0);
  const [briefRemaining, setBriefRemaining] = useState(2);
  
  // Table Sorting States
  const [sortKey, setSortKey] = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  // 🤖 AI COPILOT CHAT STATES
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState([
    { role: "ai", text: "I've loaded the latest IST market data. Ask me to drill down into any sector, headline, or macro implication above." }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, aiLoading]);

  // Fetch Brief Status
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

  // 🤖 AI COPILOT SUBMIT LOGIC
  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !data) return;

    const userMsg = query;
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setQuery("");
    setAiLoading(true);

    try {
      const res = await fetch("https://marketpulse-ai-xkpg.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: chat.map(c => ({ role: c.role === 'ai' ? 'assistant' : 'user', content: c.text })),
          context_headlines: data.headlines || [],
          context_sectors: data.benchmark || []
        })
      });
      const responseData = await res.json();
      setChat(prev => [...prev, { role: "ai", text: responseData.answer }]);
    } catch (error) {
      setChat(prev => [...prev, { role: "ai", text: "Network error. The market is moving fast, and my servers are catching up. Try again." }]);
    }
    setAiLoading(false);
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 fade-in">
        <div className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></span>
        </div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Initializing Pipeline...</p>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh] fade-in">
        <div className="bg-background/40 backdrop-blur-md border border-bearish/20 p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
          <AlertTriangle className="w-10 h-10 text-bearish mx-auto mb-3 opacity-80" />
          <h2 className="text-lg font-bold text-foreground mb-1.5">Pipeline Disconnected</h2>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <div className="inline-flex items-center justify-center gap-2 bg-accent/50 border border-border/50 px-3 py-1.5 rounded-md text-xs font-mono text-foreground/80">
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
  const regimeGlow = isRiskOn ? "shadow-[0_0_20px_-8px_rgba(52,211,153,0.15)] border-emerald-500/20" : 
                     isPanic ? "shadow-[0_0_20px_-8px_rgba(244,63,94,0.15)] border-rose-500/20" : 
                     "shadow-[0_0_20px_-8px_rgba(251,191,36,0.15)] border-amber-500/20";
  const regimeBg = isRiskOn ? "bg-gradient-to-br from-emerald-500/5 to-transparent" : 
                   isPanic ? "bg-gradient-to-br from-rose-500/5 to-transparent" : 
                   "bg-gradient-to-br from-amber-500/5 to-transparent";

  const topRisk = [...benchmark].sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk)[0];
  const totalShocks = (shock_counts?.major ?? 0) + (shock_counts?.shock ?? 0);

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-8">

        {/* --- COMPACT HERO HEADER --- */}
        <div className="relative overflow-hidden rounded-xl bg-[#080808] border border-white/5 shadow-lg fade-in">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[50%] -left-[5%] w-[50%] h-[150%] bg-primary/5 blur-[80px] rounded-full rotate-12"></div>
          </div>

          <div className="relative z-10 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-primary uppercase">Live Intelligence</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Built By</span>
                  <span className="text-[10px] font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Satyam</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-border"></span>
                  <span className="text-[9px] font-medium text-foreground/70 uppercase tracking-wider">PGDM IMI Delhi</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                  Market Outlook
                </h1>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span className="opacity-30">|</span>
                  <Clock className="w-3.5 h-3.5 opacity-60" />
                  <span>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  {lastFetch && (
                    <>
                      <span className="opacity-30">•</span>
                      <span>{lastFetch.toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={refetch}
                className="group w-full sm:w-auto relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-foreground/70 group-hover:text-foreground transition-all" /> 
                <span className="font-medium text-xs text-foreground/90 group-hover:text-foreground">Sync Pipeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- METRICS GRID --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in" style={{ animationDelay: '0.1s' }}>
          <MetricCard label="Headlines Scored" value={summary_stats.total_headlines} icon={<Newspaper className="w-3.5 h-3.5" />} />
          <MetricCard label="Top Risk Sector" value={topRisk?.sector ?? "—"} icon={<AlertTriangle className="w-3.5 h-3.5" />} colorClass="text-bearish" />
          <MetricCard label="Expected Regime" value={market_regime.regime} icon={<Activity className="w-3.5 h-3.5" />} colorClass={regimeColor} />
          <MetricCard label="Statistical Shocks" value={totalShocks} icon={<Zap className="w-3.5 h-3.5" />} colorClass={totalShocks > 0 ? "text-warning" : "text-muted-foreground"} />
        </div>

        {/* --- MID SECTION: REGIME & PARETO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 fade-in" style={{ animationDelay: '0.2s' }}>
          
          {/* Regime Card */}
          <div className={`lg:col-span-5 relative overflow-hidden rounded-xl bg-background/60 backdrop-blur-md border ${regimeGlow} ${regimeBg} p-5 flex flex-col justify-center`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${regimeColor}`}>
                  {market_regime.regime}
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-background/50 border border-border/50 text-muted-foreground">
                  System Classification
                </span>
              </div>
              <p className="text-[13px] text-foreground/80 mb-5 leading-relaxed">
                {market_regime.description}
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Focus",  value: market_regime.watch, color: "text-primary" },
                  { label: "Avoid",  value: market_regime.avoid, color: "text-bearish" },
                  { label: "Nifty",  value: market_regime.nifty_implication, color: "text-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-background/40 border border-white/5 rounded-lg px-3 py-2.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                    <span className={`text-[11px] font-bold uppercase tracking-wider w-12 shrink-0 ${color}`}>{label}</span>
                    <span className="text-[13px] text-foreground/90 leading-snug">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pareto Card */}
          <div className="lg:col-span-7 bg-background/60 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-primary" /> Risk Concentration
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Top sectors driving 80% of expected market volatility
              </p>
            </div>
            <div className="flex-1 min-h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pareto} margin={{ top: 5, right: 30, bottom: 0, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="sector" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={40} dy={5} />
                  <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={TT} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <ReferenceLine yAxisId="r" y={80} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" label={{ value: "80%", fill: "rgba(245,158,11,0.8)", fontSize: 9, position: "insideBottomRight", dy: -5 }} />
                  <Bar yAxisId="l" dataKey="avg_weighted_risk" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {pareto.map((e: any, i: number) => (
                      <Cell key={i} fill={e.cumulative_pct <= 80 ? "#e11d48" : e.avg_weighted_risk > 10 ? "#d97706" : "#059669"} fillOpacity={0.8} />
                    ))}
                  </Bar>
                  <Line yAxisId="r" type="monotone" dataKey="cumulative_pct" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#0f172a", stroke: "#3b82f6", strokeWidth: 1.5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Shock Summary */}
        {totalShocks > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-warning/25 bg-warning/5 fade-in">
            <Zap className="w-4 h-4 text-warning shrink-0" />
            <span className="text-sm font-semibold text-warning">
              {totalShocks} statistical shock event{totalShocks > 1 ? "s" : ""} detected today
            </span>
            <div className="hidden sm:flex gap-2 ml-auto">
              {(shock_counts?.major ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bearish/15 text-bearish border border-bearish/20">
                  {shock_counts.major} Major
                </span>
              )}
              {(shock_counts?.shock ?? 0) > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/15 text-warning border border-warning/20">
                  {shock_counts.shock} Shock
                </span>
              )}
            </div>
          </div>
        )}

        {/* --- AI GENERATOR SECTION --- */}
        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
          {!brief ? (
            <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Strategy Synthesis
                </h3>
                <p className="text-xs text-muted-foreground max-w-lg">
                  Compile {summary_stats.total_headlines} headlines and shock events into a cohesive trading narrative.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={generateBrief}
                  disabled={briefLoading || briefRemaining <= 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {briefLoading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing...</>
                  ) : (
                    <>Generate Outlook <ChevronRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> {briefRemaining} of 2 runs remaining
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#0a0a0a] border border-primary/20 shadow-[0_0_30px_-10px_rgba(var(--primary),0.15)] overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/5 bg-primary/5">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Synthesized Market Outlook</h3>
                    <p className="text-[9px] text-primary/70 font-mono uppercase tracking-wider">AI-Narrated • Python-Scored</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {briefRemaining} runs left
                  </span>
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
              <div className="p-5 sm:p-6 lg:p-8">
                <div className="
                  prose prose-sm prose-invert max-w-3xl mx-auto
                  text-foreground/80 leading-relaxed
                  [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-bold
                  [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-1.5
                  [&_p]:mb-4 [&_p]:text-[13px]
                  [&_ul]:my-3 [&_li]:mb-1.5
                  [&_strong]:text-white
                ">
                  <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- 🤖 GLASSMORPHISM AI COPILOT CHAT WIDGET --- */}
        <div className="my-8 relative group fade-in" style={{ animationDelay: '0.35s' }}>
          {/* Glowing Border Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          
          <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col h-[400px] overflow-hidden">
            
            {/* Copilot Header */}
            <div className="bg-white/[0.03] px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  MarketPulse Copilot
                </h3>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono bg-black/40 px-2 py-1 rounded-md border border-white/5">
                Live Context Active
              </span>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/90 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white/5 text-gray-200 rounded-2xl rounded-tl-sm border border-white/10'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-2" />
            </div>

            {/* Input Form Area */}
            <div className="p-3 bg-black/40 border-t border-white/10">
              <form onSubmit={handleAskCopilot} className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about sector impacts, specific stocks, or macro implications..."
                  className="w-full bg-white/5 border border-white/10 text-foreground text-[13px] rounded-full pl-5 pr-12 py-3 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-muted-foreground"
                  disabled={aiLoading}
                />
                <button 
                  type="submit" 
                  disabled={aiLoading || !query.trim()}
                  className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-muted-foreground text-white rounded-full transition-all"
                >
                  <Send className="w-3.5 h-3.5 ml-px" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* --- HEADLINES DATA TABLE --- */}
        <div className="bg-background/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-foreground">Live Impact Feed</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent text-foreground/80 border border-border/50">
                {headlines.length} Events
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Click headline to open source
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[850px] max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
                  <tr>
                    {[
                      { key: "title",        label: "HEADLINE",   width: "w-[35%]" },
                      { key: "sector",       label: "SECTOR",     width: "w-[12%]" },
                      { key: "sentiment",    label: "BIAS",       width: "w-[10%]" },
                      { key: "impact_score", label: "IMPACT",     width: "w-[8%]" },
                      { key: "z_score",      label: "ALERT",      width: "w-[12%]" },
                      { key: null,           label: "AI INSIGHT", width: "w-[23%]" },
                    ].map(({ key, label, width }) => (
                      <th
                        key={label + (key ?? "")}
                        className={`px-4 py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider ${width} ${key ? "cursor-pointer hover:text-foreground hover:bg-white/5 transition-colors" : ""}`}
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
                    const shockStatus = h.shock_status ?? "Normal";
                    const sourceUrl   = h["url"] as string | undefined;
                    
                    const rowStyles = 
                      shockStatus === "Major Shock" ? "bg-rose-500/[0.03] hover:bg-rose-500/[0.08]" : 
                      shockStatus === "Shock" ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.08]" : 
                      "hover:bg-white/[0.02]";

                    const borderLeft = 
                      shockStatus === "Major Shock" ? "border-l-2 border-l-rose-500" : 
                      shockStatus === "Shock" ? "border-l-2 border-l-amber-500" : 
                      "border-l-2 border-l-transparent";

                    return (
                      <tr key={i} className={`transition-colors duration-150 ${rowStyles}`}>
                        <td className={`px-4 py-3 ${borderLeft}`}>
                          {sourceUrl ? (
                            <a 
                              href={sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="line-clamp-2 text-[13px] font-medium text-blue-400 hover:text-blue-300 hover:underline leading-snug transition-colors"
                              title="Read original article"
                            >
                              {h.title}
                            </a>
                          ) : (
                            <span className="line-clamp-2 text-[13px] font-medium text-foreground/90 leading-snug">
                              {h.title}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/50 text-foreground/70 border border-white/5">
                            {h.sector}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <SentimentBadge sentiment={h.sentiment} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm font-bold ${h.impact_score >= 8 ? "text-bearish" : h.impact_score >= 6 ? "text-warning" : "text-muted-foreground"}`}>
                            {h.impact_score}<span className="text-[9px] text-muted-foreground font-normal">/10</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ShockBadge status={shockStatus} zScore={h.z_score != null ? Number(h.z_score) : null} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed pr-2">
                            {h.one_line_insight}
                          </p>
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
