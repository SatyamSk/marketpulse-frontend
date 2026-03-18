import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Newspaper, AlertTriangle, Globe, Sparkles,
  Activity, RefreshCw, Clock, ExternalLink, ArrowUpDown
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

export default function MorningBrief() {
  const { data, loading, error, refetch, lastFetch } = useDashboard();
  const [brief, setBrief]                   = useState<string | null>(null);
  const [briefLoading, setBriefLoading]     = useState(false);
  const [briefUsed, setBriefUsed]           = useState(0);
  const [briefRemaining, setBriefRemaining] = useState(2);
  const [sortKey, setSortKey] = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    api.briefStatus?.().then((s: any) => {
      setBriefUsed(s.used ?? 0);
      setBriefRemaining(s.remaining ?? 2);
    }).catch(() => {});
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
        setBrief("Could not generate brief — check API connection.");
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
      <div className="glass-card p-6 max-w-lg">
        <p className="text-bearish font-semibold mb-2">Pipeline not connected</p>
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <code className="text-xs bg-accent px-2 py-1 rounded">python api.py</code>
      </div>
    </DashboardLayout>
  );

  if (!data) return null;

  const { market_regime, benchmark, headlines, pareto, summary_stats } = data;

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

  const topRisk = [...benchmark].sort((a: any, b: any) =>
    b.avg_weighted_risk - a.avg_weighted_risk
  )[0];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 fade-in">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Morning Brief</h1>
            <p className="text-xs text-muted-foreground">
              Expected conditions for {new Date().toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long"
              })}
              {lastFetch && (
                <span className="ml-2 opacity-50">
                  · {lastFetch.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in">
          <MetricCard
            label="Headlines"
            value={summary_stats.total_headlines}
            icon={<Newspaper className="w-4 h-4" />}
          />
          <MetricCard
            label="Top Risk"
            value={topRisk?.sector ?? "—"}
            icon={<AlertTriangle className="w-4 h-4" />}
            colorClass="text-bearish"
          />
          <MetricCard
            label="Regime"
            value={market_regime.regime}
            icon={<Activity className="w-4 h-4" />}
            colorClass={regimeColor}
          />
          <MetricCard
            label="Geo Flags"
            value={summary_stats.geopolitical_flags}
            icon={<Globe className="w-4 h-4" />}
            colorClass={
              summary_stats.geopolitical_flags > 3 ? "text-warning" : "text-muted-foreground"
            }
          />
        </div>

        {/* Regime + Pareto side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">

          {/* Regime Banner */}
          <div className={`glass-card p-5 border ${regimeBorder}`}>
            <div className="flex items-center gap-2 mb-2">
             <span className={`text-base font-semibold ${regimeColor}`}>
              {market_regime.regime}
            </span>
            <span className="tag bg-accent text-muted-foreground">
              Expected Regime
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              · based on {data?.summary_stats?.total_headlines ?? 0} headlines
            </span>
            </div>
            <p className="text-xs text-secondary-foreground mb-4 leading-relaxed">
              {market_regime.description}
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Watch",  value: market_regime.watch          },
                { label: "Avoid",  value: market_regime.avoid          },
                { label: "Nifty",  value: market_regime.nifty_implication },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2.5 text-xs">
                  <span className="label-text shrink-0 pt-0.5 w-10">{label}</span>
                  <span className="text-secondary-foreground leading-relaxed">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pareto Chart — compact */}
          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">Pareto Risk Concentration</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              Top sectors driving 80% of market risk
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={pareto} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="sector"
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={36}
                />
                <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 9 }} width={24} />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 9 }} width={24} />
                <Tooltip contentStyle={TT} />
                <ReferenceLine yAxisId="r" y={80} stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: "80%", fill: "#f59e0b", fontSize: 9, position: "insideRight" }}
                />
                <Bar yAxisId="l" dataKey="avg_weighted_risk" radius={[2, 2, 0, 0]}>
                  {pareto.map((e: any, i: number) => (
                    <Cell key={i}
                      fill={e.cumulative_pct <= 80 ? "#ef4444" :
                            e.avg_weighted_risk > 10 ? "#f59e0b" : "#22c55e"} />
                  ))}
                </Bar>
                <Line yAxisId="r" type="monotone" dataKey="cumulative_pct"
                  stroke="#60a5fa" strokeWidth={1.5}
                  dot={{ r: 2.5, fill: "#60a5fa" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brief Generator */}
        <div className="fade-in">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <button
              onClick={generateBrief}
              disabled={briefLoading || briefRemaining <= 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/85 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {briefLoading ? "Generating..." :
               brief ? "Regenerate Brief" : "Generate AI Morning Brief"}
            </button>
            <div className="flex items-center gap-2">
              {[0, 1].map(i => (
                <div key={i} className={`w-5 h-1.5 rounded-full transition-colors ${
                  i < briefUsed ? "bg-primary" : "bg-accent border border-border"
                }`} />
              ))}
              <span className="text-[11px] text-muted-foreground">
                {briefRemaining}/2 today
              </span>
              {briefRemaining === 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> resets midnight
                </span>
              )}
            </div>
          </div>

          {brief && (
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-accent/25">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="label-text">AI Morning Brief</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {summary_stats.total_headlines} headlines · Python-scored
                </span>
              </div>
              <div className="p-5">
                <div className="
                  prose prose-sm prose-invert max-w-none text-secondary-foreground
                  [&_h2]:text-foreground [&_h2]:text-sm [&_h2]:font-semibold
                  [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2]:border-b [&_h2]:border-border/40
                  [&_h2]:pb-1
                  [&_p]:text-[13px] [&_p]:leading-relaxed
                  [&_ul]:text-[13px] [&_li]:leading-relaxed [&_li]:mb-1
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
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="label-text">Headlines by impact</h3>
            <span className="text-[10px] text-muted-foreground">
              {headlines.length} total · click row to open source
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-accent/15">
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
                      className="text-left px-3 py-2.5 label-text cursor-pointer whitespace-nowrap"
                      onClick={() => key && handleSort(key as SortKey)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {key && <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h: any, i: number) => {
                  const isShock = h.shock_status === "Major Shock" || h.shock_status === "Shock";
                  return (
                    <tr
                      key={i}
                      className={`border-b border-border/30 hover:bg-accent/25 transition-colors ${
                        h.shock_status === "Major Shock"
                          ? "shadow-[inset_3px_0_0_#ef4444]"
                          : h.shock_status === "Shock"
                          ? "shadow-[inset_3px_0_0_#f59e0b]"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 max-w-[180px] lg:max-w-xs">
                        <span className="line-clamp-2 text-xs text-foreground leading-relaxed">
                          {h.title}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="tag bg-accent text-muted-foreground">{h.sector}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <SentimentBadge sentiment={h.sentiment} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`font-semibold text-xs ${
                          h.impact_score >= 8 ? "text-bearish" :
                          h.impact_score >= 6 ? "text-warning" : "text-muted-foreground"
                        }`}>
                          {h.impact_score}/10
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`tag ${
                          h.shock_status === "Major Shock"
                            ? "bg-bearish/15 text-bearish"
                            : h.shock_status === "Shock"
                            ? "bg-warning/15 text-warning"
                            : "bg-accent/60 text-muted-foreground"
                        }`}>
                          {h.shock_status ?? "Normal"}
                          {h.z_score != null && (
                            <span className="ml-1 opacity-60">
                              Z:{Number(h.z_score).toFixed(1)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-[11px] max-w-[180px] lg:max-w-xs">
                        {h.one_line_insight}
                      </td>
                      <td className="px-3 py-2.5">
                        {h.url && (
                          
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                            title="Open source"
                          >
                            <ExternalLink className="w-3 h-3" />
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
    </DashboardLayout>
  );
}
