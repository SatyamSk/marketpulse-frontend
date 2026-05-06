import { useState, useEffect } from "react";
import { AlertTriangle, BarChart3, Brain, ChevronDown, ChevronRight, Clock, Eye, Shield, TrendingDown, TrendingUp, Zap, ArrowUpDown, Newspaper } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";

const TT = { background: "rgba(11,13,17,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", color: "#E8ECF1", fontSize: "11px", boxShadow: "0 4px 16px rgba(0,0,0,0.6)", padding: "8px 12px" };
const SECTOR_COLORS: Record<string, string> = { Banking: "#22c55e", Energy: "#3b82f6", IT: "#f59e0b", Fintech: "#818cf8", Manufacturing: "#f472b6", Healthcare: "#10b981", FMCG: "#a78bfa", Startup: "#06b6d4", Retail: "#fb923c", Other: "#64748b" };

type Tab = "agents" | "sectors" | "headlines" | "regime" | "accuracy";

function AgentCard({ name, data }: { name: string; data: any }) {
  const [open, setOpen] = useState(false);
  const icons: Record<string, string> = { macro: "🌍", supply_chain: "🔗", behavioral: "🧠", flow: "💰", historical_analog: "📚", temporal_delay: "⏱️", noise_filter: "🔇", contradiction: "⚔️", self_eval: "🎯" };
  const labels: Record<string, string> = { macro: "Macro Intelligence", supply_chain: "Supply Chain", behavioral: "Behavioral Psychology", flow: "Institutional Flow", historical_analog: "Historical Analog", temporal_delay: "Delayed Effects", noise_filter: "Noise Filter", contradiction: "Contradiction", self_eval: "Self-Evaluation" };
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left">
        <span className="text-xl">{icons[name] || "🤖"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{labels[name] || name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{data?.summary || "No output"}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/5">
          <pre className="mt-3 text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function FullAnalysis() {
  const { data: dashData, loading: dashLoading } = useDashboard();
  const [tab, setTab] = useState<Tab>("agents");
  const [agents, setAgents] = useState<any>(null);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    api.getAnalysisAgents().then(d => { setAgents(d.agents || {}); setAgentsLoading(false); }).catch(() => setAgentsLoading(false));
  }, []);

  const handleSort = (key: string) => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(false); } };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "agents", label: "Agents", icon: Brain },
    { key: "sectors", label: "Sectors", icon: BarChart3 },
    { key: "headlines", label: "Headlines", icon: Newspaper },
    { key: "regime", label: "Regime", icon: Shield },
    { key: "accuracy", label: "Accuracy", icon: TrendingUp },
  ];

  if (dashLoading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="relative flex h-6 w-6"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50" /><span className="relative inline-flex rounded-full h-6 w-6 bg-primary" /></div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Loading Analysis...</p>
      </div>
    </DashboardLayout>
  );

  const headlines = dashData?.headlines || [];
  const benchmark = dashData?.benchmark || [];
  const pareto = dashData?.pareto || [];
  const regime = dashData?.market_regime;
  const stats = dashData?.summary_stats;
  const msi = dashData?.market_stress_index;

  const sorted = [...headlines].sort((a: any, b: any) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1400px] mx-auto space-y-4 pb-8">
        <div className="flex items-center justify-between fade-in">
          <h1 className="text-xl font-bold text-foreground">Full Analysis</h1>
          <a href="/" className="text-xs text-primary hover:underline flex items-center gap-1">← Back to Today</a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5 fade-in overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Agents Tab */}
        {tab === "agents" && (
          <div className="space-y-2 fade-in">
            {agentsLoading ? <p className="text-sm text-muted-foreground p-4">Loading agent data...</p> :
              !agents || Object.keys(agents).length === 0 ? <p className="text-sm text-muted-foreground p-4">No agent data available. Run the pipeline first.</p> :
              Object.entries(agents).map(([name, data]) => <AgentCard key={name} name={name} data={data} />)
            }
          </div>
        )}

        {/* Sectors Tab */}
        {tab === "sectors" && (
          <div className="space-y-4 fade-in">
            {/* Pareto Chart */}
            {pareto.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Risk Concentration</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={pareto} margin={{ top: 5, right: 32, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="sector" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={40} dy={5} />
                    <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                    <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={TT} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    <ReferenceLine yAxisId="r" y={80} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" />
                    <Bar yAxisId="l" dataKey="avg_weighted_risk" radius={[3, 3, 0, 0]} maxBarSize={44}>
                      {pareto.map((e: any, i: number) => <Cell key={i} fill={e.cumulative_pct <= 80 ? "#e11d48" : e.avg_weighted_risk > 10 ? "#d97706" : "#059669"} fillOpacity={0.85} />)}
                    </Bar>
                    <Line yAxisId="r" type="monotone" dataKey="cumulative_pct" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#0f172a", stroke: "#3b82f6", strokeWidth: 1.5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Sector Detail Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02] border-b border-white/5">
                    <tr>
                      {["Sector", "Signal", "CSI", "NSS", "Risk", "Velocity", "Headlines"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {benchmark.map((s: any) => (
                      <tr key={s.sector} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: SECTOR_COLORS[s.sector] || "#64748b" }}>{s.sector}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.investment_signal === "BUY BIAS" ? "bg-emerald-500/15 text-emerald-400" : s.investment_signal === "AVOID" ? "bg-rose-500/15 text-rose-400" : "bg-accent/40 text-muted-foreground"} border border-white/10`}>{s.investment_signal || "NEUTRAL"}</span></td>
                        <td className="px-4 py-3 text-xs font-mono">{Number(s.composite_sentiment_index || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs font-mono">{Number(s.net_sentiment_score || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs font-mono">{Number(s.avg_weighted_risk || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs font-mono">{Number(s.sentiment_velocity || 0).toFixed(1)}</td>
                        <td className="px-4 py-3 text-xs">{s.headline_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Headlines Tab */}
        {tab === "headlines" && (
          <div className="glass-card overflow-hidden fade-in">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">All Scored Headlines ({headlines.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="sticky top-0 z-20 bg-[#0a0a0a]/95 border-b border-white/10">
                  <tr>
                    {[{ k: "title", l: "Headline" }, { k: "sector", l: "Sector" }, { k: "sentiment", l: "Bias" }, { k: "impact_score", l: "Impact" }, { k: null as any, l: "Insight" }].map(({ k, l }) => (
                      <th key={l} className={`px-4 py-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider ${k ? "cursor-pointer hover:text-foreground" : ""}`} onClick={() => k && handleSort(k)}>
                        <span className="flex items-center gap-1">{l} {k && <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sorted.map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 max-w-[300px]">
                        {h.url ? <a href={h.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-[13px] font-medium text-blue-400 hover:underline">{h.title}</a> : <span className="line-clamp-2 text-[13px] text-foreground/90">{h.title}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-white/10" style={{ background: `${SECTOR_COLORS[h.sector] || "#64748b"}18`, color: SECTOR_COLORS[h.sector] || "#64748b" }}>{h.sector}</span></td>
                      <td className="px-4 py-3"><SentimentBadge sentiment={h.sentiment} /></td>
                      <td className="px-4 py-3"><span className={`text-sm font-bold ${h.impact_score >= 8 ? "text-rose-400" : h.impact_score >= 6 ? "text-amber-400" : "text-muted-foreground"}`}>{h.impact_score}<span className="text-[9px] text-muted-foreground font-normal">/10</span></span></td>
                      <td className="px-4 py-3"><p className="line-clamp-2 text-[11px] text-muted-foreground">{h.one_line_insight}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Regime Tab */}
        {tab === "regime" && regime && (
          <div className="space-y-4 fade-in">
            <div className={`glass-card p-5 border ${regime.regime === "Risk On" ? "border-emerald-500/20 bg-emerald-500/5" : regime.regime === "Panic" ? "border-rose-500/20 bg-rose-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
              <p className={`text-2xl font-bold ${regime.regime === "Risk On" ? "text-emerald-400" : regime.regime === "Panic" ? "text-rose-400" : "text-amber-400"}`}>{regime.regime}</p>
              <div className="mt-3 space-y-2">
                {[{ l: "Watch", v: regime.watch, c: "text-primary" }, { l: "Avoid", v: regime.avoid, c: "text-rose-400" }, { l: "Nifty", v: regime.nifty_implication, c: "text-foreground" }].map(({ l, v, c }) => (
                  <div key={l} className="flex gap-2 text-sm"><span className={`font-bold uppercase w-12 shrink-0 ${c}`}>{l}</span><span className="text-foreground/80">{v}</span></div>
                ))}
              </div>
            </div>
            {msi && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-foreground mb-2">Market Stress Index</h3>
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-bold ${msi.level === "Low" ? "text-emerald-400" : msi.level === "Critical" ? "text-rose-400" : "text-amber-400"}`}>{msi.msi}</span>
                  <span className="text-sm text-muted-foreground">{msi.level}</span>
                </div>
                <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${msi.msi}%`, background: msi.level === "Low" ? "#22c55e" : msi.level === "Critical" ? "#ef4444" : "#f59e0b" }} /></div>
              </div>
            )}
          </div>
        )}

        {/* Accuracy Tab */}
        {tab === "accuracy" && (
          <div className="glass-card p-5 fade-in">
            <h3 className="text-sm font-bold text-foreground mb-2">Prediction Accuracy</h3>
            <p className="text-xs text-muted-foreground">Historical accuracy data will appear here after multiple pipeline runs and backtests. Run Admin → Backtest to populate.</p>
            {stats && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5"><p className="text-[10px] text-muted-foreground uppercase">Headlines Today</p><p className="text-xl font-bold text-foreground">{stats.total_headlines}</p></div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5"><p className="text-[10px] text-muted-foreground uppercase">Sectors Covered</p><p className="text-xl font-bold text-foreground">{stats.sectors_covered}</p></div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
