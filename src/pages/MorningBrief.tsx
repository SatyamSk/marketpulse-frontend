import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Newspaper, AlertTriangle, Globe, Sparkles, ArrowUpDown, Activity, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";

type SortKey = "impact_score" | "sector" | "sentiment" | "z_score";

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 };

export default function MorningBrief() {
  const { data, loading, error, refetch, lastFetch } = useDashboard();
  const [brief, setBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const generateBrief = async () => {
    if (!data) return;
    setBriefLoading(true);
    try {
      const result = await api.generateBrief({
        top_headlines: data.headlines.slice(0, 10),
        sector_summary: data.benchmark,
        regime: data.market_regime,
      });
      setBrief(result.brief);
    } catch {
      setBrief("Could not generate brief. Check API connection.");
    } finally {
      setBriefLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading live pipeline data...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="glass-card p-6 max-w-lg"><p className="text-bearish font-medium mb-2">Pipeline not connected</p><p className="text-sm text-muted-foreground mb-4">{error}</p></div></DashboardLayout>;
  if (!data) return null;

  const { market_regime, benchmark, headlines, pareto, summary_stats } = data;
  const sorted = [...headlines].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const regimeColor = market_regime.regime === "Risk On" ? "text-bullish" : market_regime.regime === "Panic" ? "text-bearish" : "text-warning";
  const regimeBg = market_regime.regime === "Risk On" ? "border-bullish/30 bg-bullish/5" : market_regime.regime === "Panic" ? "border-bearish/30 bg-bearish/5" : "border-warning/30 bg-warning/5";

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6 fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Morning Brief</h1>
            <p className="text-sm text-muted-foreground">Today's market intelligence snapshot</p>
          </div>
          <button onClick={refetch} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Headlines Analyzed" value={summary_stats.total_headlines} icon={<Newspaper className="w-4 h-4" />} />
          <MetricCard label="Highest Risk Sector" value={benchmark.sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk)[0]?.sector ?? "—"} icon={<AlertTriangle className="w-4 h-4" />} colorClass="text-bearish" />
          <MetricCard label="Market Regime" value={market_regime.regime} icon={<Activity className="w-4 h-4" />} colorClass={regimeColor} />
          <MetricCard label="Geopolitical Flags" value={summary_stats.geopolitical_flags} icon={<Globe className="w-4 h-4" />} colorClass={summary_stats.geopolitical_flags > 3 ? "text-warning" : "text-muted-foreground"} />
        </div>

        <div className={`glass-card p-6 mb-6 border ${regimeBg} fade-in`}>
          <p className={`text-xl font-semibold ${regimeColor} mb-1`}>{market_regime.regime}</p>
          <p className="text-sm text-secondary-foreground mb-4">{market_regime.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div><p className="label-text mb-1">Watch</p><p className="text-secondary-foreground">{market_regime.watch}</p></div>
            <div><p className="label-text mb-1">Avoid</p><p className="text-secondary-foreground">{market_regime.avoid}</p></div>
            <div><p className="label-text mb-1">Nifty Outlook</p><p className="text-secondary-foreground">{market_regime.nifty_implication}</p></div>
          </div>
        </div>

        <button onClick={generateBrief} disabled={briefLoading} className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 fade-in">
          <Sparkles className="w-4 h-4" />
          {briefLoading ? "Generating..." : brief ? "Regenerate Brief" : "Generate AI Morning Brief"}
        </button>

        {brief && (
          <div className="glass-card p-5 mb-6 fade-in">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-primary" /><span className="label-text">AI-Generated Morning Brief</span></div>
            <div className="prose prose-sm prose-invert max-w-none text-secondary-foreground"><ReactMarkdown>{brief}</ReactMarkdown></div>
          </div>
        )}

        <div className="glass-card p-5 mb-6 fade-in">
          <h3 className="label-text mb-1">Pareto Risk Concentration</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={pareto}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="5 5" />
              <Bar yAxisId="left" dataKey="avg_weighted_risk" radius={[4, 4, 0, 0]}>
                {pareto.map((entry: any, i: number) => <Cell key={i} fill={entry.cumulative_pct <= 80 ? "#ef4444" : entry.avg_weighted_risk > 10 ? "#f59e0b" : "#22c55e"} />)}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: "#60a5fa" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card overflow-hidden fade-in">
          <div className="p-4 border-b border-border"><h3 className="label-text">Top headlines by impact</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {[{ key: "title", label: "Headline" }, { key: "sector", label: "Sector" }, { key: "sentiment", label: "Sentiment" }, { key: "impact_score", label: "Impact" }, { key: "z_score", label: "Shock" }, { key: null, label: "AI Insight" }].map(({ key, label }) => (
                    <th key={label} className="text-left p-3 label-text font-medium cursor-pointer whitespace-nowrap" onClick={() => key && handleSort(key as SortKey)}>
                      <span className="inline-flex items-center gap-1">{label}{key && <ArrowUpDown className="w-3 h-3 opacity-40" />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-accent/20">
                    <td className="p-3 text-foreground max-w-xs"><span className="line-clamp-2 text-sm">{h.title}</span></td>
                    <td className="p-3 text-muted-foreground text-sm whitespace-nowrap">{h.sector}</td>
                    <td className="p-3"><SentimentBadge sentiment={h.sentiment} /></td>
                    <td className="p-3 whitespace-nowrap"><span className={`font-semibold text-sm ${h.impact_score >= 8 ? "text-bearish" : h.impact_score >= 6 ? "text-warning" : "text-muted-foreground"}`}>{h.impact_score}/10</span></td>
                    <td className="p-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded text-xs font-medium ${h.shock_status === "Major Shock" ? "bg-bearish/15 text-bearish" : h.shock_status === "Shock" ? "bg-warning/15 text-warning" : "bg-accent text-muted-foreground"}`}>{h.shock_status}</span></td>
                    <td className="p-3 text-muted-foreground text-xs max-w-sm">{h.one_line_insight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
