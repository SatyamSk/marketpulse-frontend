import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Newspaper, AlertTriangle, Globe, Sparkles,
  Activity, RefreshCw, Clock, ExternalLink,
  ArrowUpDown, Zap
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

const TT = {
  background: "hsl(228 18% 7%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#e2e8f0", fontSize: 12,
};

function ShockBadge({ status, zScore }: { status: string; zScore: number | null }) {
  if (!status || status === "Normal") {
    return <span className="tag bg-accent/60 text-muted-foreground">Normal</span>;
  }
  if (status === "Watch") {
    return (
      <span className="tag bg-primary/15 text-primary">
        Watch {zScore != null ? `Z:${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  if (status === "Shock") {
    return (
      <span className="tag bg-warning/15 text-warning" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <Zap style={{ width: 10, height: 10 }} />
        Shock {zScore != null ? `Z:${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  if (status === "Major Shock") {
    return (
      <span className="tag bg-bearish/15 text-bearish" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <Zap style={{ width: 10, height: 10 }} />
        Major Shock {zScore != null ? `Z:${Number(zScore).toFixed(1)}` : ""}
      </span>
    );
  }
  return <span className="tag bg-accent/60 text-muted-foreground">{status}</span>;
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
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading pipeline data...
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="glass-card p-6 max-w-lg mx-auto mt-10">
        <p className="text-bearish font-semibold mb-2">Pipeline not connected</p>
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <code className="text-xs bg-accent px-2 py-1 rounded">python api.py</code>
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

  const regimeColor =
    market_regime.regime === "Risk On"  ? "text-bullish" :
    market_regime.regime === "Panic"    ? "text-bearish" : "text-warning";

  const regimeBorder =
    market_regime.regime === "Risk On"  ? "border-bullish/25 bg-bullish/4" :
    market_regime.regime === "Panic"    ? "border-bearish/25 bg-bearish/4" :
                                          "border-warning/25 bg-warning/4";

  const topRisk = [...benchmark].sort(
    (a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk
  )[0];

  const totalShocks = (shock_counts?.major ?? 0) + (shock_counts?.shock ?? 0);

  return (
    <DashboardLayout>
      {/* w-full and responsive max-widths allow it to stretch nicely on PC */}
      <div className="w-full xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-4 sm:space-y-6">

        {/* --- CREATIVE BRANDING HEADER --- */}
        <div className="fade-in">
          <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-gradient-to-r from-background to-accent/10 border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-widest uppercase">Live Intelligence Pipeline</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Built by</span>
              <span className="font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-sm sm:text-base">
                Satyam
              </span>
              <span className="opacity-40 hidden sm:inline">|</span>
              <span className="font-medium text-foreground/70">PGDM IMI Delhi</span>
            </div>
          </div>
        </div>

        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Market Outlook</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Expected conditions for{" "}
              <span className="font-medium text-foreground/80">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              {lastFetch && (
                <span className="ml-2 opacity-50 text-xs">
                  · updated {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm bg-accent/50 text-foreground hover:bg-accent transition-colors w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 fade-in">
          <MetricCard label="Headlines Analyzed" value={summary_stats.total_headlines} icon={<Newspaper className="w-4 h-4" />} />
          <MetricCard label="Highest Risk Sector" value={topRisk?.sector ?? "—"} icon={<AlertTriangle className="w-4 h-4" />} colorClass="text-bearish" />
          <MetricCard label="Expected Regime" value={market_regime.regime} icon={<Activity className="w-4 h-4" />} colorClass={regimeColor} />
          <MetricCard label="Shock Events" value={totalShocks} icon={<Zap className="w-4 h-4" />} colorClass={totalShocks > 0 ? "text-warning" : "text-muted-foreground"} />
        </div>

        {/* Regime + Pareto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 fade-in">
          <div className={`glass-card p-5 sm:p-6 border ${regimeBorder} flex flex-col justify-center`}>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`text-lg sm:text-xl font-bold ${regimeColor}`}>
                {market_regime.regime}
              </span>
              <span className="tag bg-accent text-muted-foreground text-xs">Expected Regime</span>
            </div>
            <p className="text-sm text-secondary-foreground mb-6 leading-relaxed">
              {market_regime.description}
            </p>
            <div className="space-y-3.5">
              {[
                { label: "Watch",  value: market_regime.watch            },
                { label: "Avoid",  value: market_regime.avoid            },
                { label: "Nifty",  value: market_regime.nifty_implication },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:gap-3 text-sm">
                  <span className="label-text shrink-0 sm:pt-0.5 sm:w-12 mb-1 sm:mb-0">{label}</span>
                  <span className="text-secondary-foreground leading-relaxed">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6">
            <h3 className="label-text mb-1">Pareto Risk Concentration</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Top sectors driving 80% of expected market risk
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={pareto} margin={{ top: 4, right: 28, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="sector" tick={{ fill: "#64748b", fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={40} />
                <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} width={30} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} width={30} />
                <Tooltip contentStyle={TT} />
                <ReferenceLine yAxisId="r" y={80} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "80%", fill: "#f59e0b", fontSize: 10, position: "insideRight" }} />
                <Bar yAxisId="l" dataKey="avg_weighted_risk" radius={[3, 3, 0, 0]} maxBarSize={60}>
                  {pareto.map((e: any, i: number) => (
                    <Cell key={i} fill={e.cumulative_pct <= 80 ? "#ef4444" : e.avg_weighted_risk > 10 ? "#f59e0b" : "#22c55e"} />
                  ))}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="cumulative_pct" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shock Summary */}
        {totalShocks > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-warning/25 bg-warning/5 fade-in">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning shrink-0" />
              <span className="text-sm font-semibold text-warning">
                {totalShocks} statistical shock event{totalShocks > 1 ? "s" : ""} detected today
              </span>
            </div>
            <div className="flex gap-2 flex-wrap sm:ml-auto">
              {(shock_counts?.major ?? 0) > 0 && (
                <span className="tag bg-bearish/15 text-bearish text-xs px-2.5 py-1">
                  {shock_counts.major} major shock{shock_counts.major > 1 ? "s" : ""}
                </span>
              )}
              {(shock_counts?.shock ?? 0) > 0 && (
                <span className="tag bg-warning/15 text-warning text-xs px-2.5 py-1">
                  {shock_counts.shock} shock{shock_counts.shock > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Brief Generator */}
        <div className="fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <button
              onClick={generateBrief}
              disabled={briefLoading || briefRemaining <= 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50 w-full sm:w-auto shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              {briefLoading ? "Analyzing Data & Generating..." : brief ? "Regenerate Outlook" : "Generate Expected Market Outlook"}
            </button>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              {[0, 1].map(i => (
                <div key={i} className={`w-6 h-1.5 rounded-full transition-colors ${i < briefUsed ? "bg-primary" : "bg-accent border border-border"}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {briefRemaining}/2 runs today
              </span>
            </div>
          </div>

          {brief && (
            <div className="glass-card overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 border-b border-border/60 bg-accent/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="label-text text-sm">Expected Market Outlook</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Python-scored · AI-narrated
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="
                  prose prose-sm sm:prose-base prose-invert max-w-none text-secondary-foreground
                  [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold
                  [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-2
                  [&_p]:leading-relaxed
                  [&_ul]:leading-relaxed [&_li]:mb-1.5
                  [&_strong]:text-foreground [&_strong]:font-semibold
                ">
                  <ReactMarkdown>{brief}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Headlines Table */}
        <div className="glass-card overflow-hidden fade-in">
          <div className="px-4 sm:px-5 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="label-text text-sm">Headlines by Impact</h3>
              <span className="tag bg-accent/60 text-muted-foreground">
                {headlines.length} total
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Click source icon to open original article
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px] max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <tr className="border-b border-border/60">
                    {[
                      { key: "title",        label: "Headline"  },
                      { key: "sector",       label: "Sector"    },
                      { key: "sentiment",    label: "Sentiment" },
                      { key: "impact_score", label: "Impact"    },
                      { key: "z_score",      label: "Shock"     },
                      { key: null,           label: "AI Insight"},
                      { key: null,           label: ""          },
                    ].map(({ key, label }) => (
                      <th
                        key={label + (key ?? "")}
                        className="text-left px-4 py-3 label-text text-xs cursor-pointer whitespace-nowrap bg-accent/10"
                        onClick={() => key && handleSort(key as SortKey)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {label}
                          {key && <ArrowUpDown className="w-3 h-3 opacity-40" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((h: any, i: number) => {
                    const shockStatus = h.shock_status ?? "Normal";
                    const sourceUrl   = h["url"] as string | undefined;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-border/25 hover:bg-accent/30 transition-colors ${
                          shockStatus === "Major Shock" ? "bg-bearish/5" : shockStatus === "Shock" ? "bg-warning/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3 max-w-[200px] lg:max-w-[300px]">
                          <span className="line-clamp-2 text-sm text-foreground leading-relaxed">
                            {h.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="tag bg-accent text-muted-foreground">{h.sector}</span>
                        </td>
                        <td className="px-4 py-3">
                          <SentimentBadge sentiment={h.sentiment} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-semibold text-sm ${h.impact_score >= 8 ? "text-bearish" : h.impact_score >= 6 ? "text-warning" : "text-muted-foreground"}`}>
                            {h.impact_score}/10
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ShockBadge status={shockStatus} zScore={h.z_score != null ? Number(h.z_score) : null} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] lg:max-w-md leading-relaxed">
                          {h.one_line_insight}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {sourceUrl && (
                            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-primary hover:bg-accent transition-colors" title="Open source">
                              <ExternalLink className="w-3.5 h-3.5" />
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
