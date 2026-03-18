import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Newspaper, AlertTriangle, Globe, Sparkles, ArrowUpDown, Activity, RefreshCw, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";

type SortKey = "impact_score" | "sector" | "sentiment" | "z_score";

const tooltipStyle = {
  background: "hsl(240 15% 8%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: 12,
};

export default function MorningBrief() {
  const { data, loading, error, refetch, lastFetch } = useDashboard();
  const [brief, setBrief]               = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefUsed, setBriefUsed]       = useState(0);
  const [briefRemaining, setBriefRemaining] = useState(2);
  const [sortKey, setSortKey] = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  // Load brief limit status on mount
  useEffect(() => {
    api.briefStatus().then((s: any) => {
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
        top_headlines: data.headlines.slice(0, 10),
        sector_summary: data.benchmark,
        regime: data.market_regime,
      });
      setBrief(result.brief);
      setBriefUsed(result.used ?? briefUsed + 1);
      setBriefRemaining(result.remaining ?? briefRemaining - 1);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail?.error === "daily_limit_reached") {
        setBriefRemaining(0);
        setBrief("You have used both daily brief generations. Resets at midnight.");
      } else {
        setBrief("Could not generate brief. Check API connection.");
      }
    } finally {
      setBriefLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading live pipeline data...
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="glass-card p-6 max-w-lg">
        <p className="text-bearish font-medium mb-2">Pipeline not connected</p>
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <p className="text-xs text-muted-foreground">
          Run <code className="bg-accent px-1.5 py-0.5 rounded">python api.py</code> in your Downloads folder.
        </p>
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

  const regimeColor = market_regime.regime === "Risk On"  ? "text-bullish"
                    : market_regime.regime === "Panic"    ? "text-bearish"
                    : "text-warning";
  const regimeBg    = market_regime.regime === "Risk On"  ? "border-bullish/30 bg-bullish/5"
                    : market_regime.regime === "Panic"    ? "border-bearish/30 bg-bearish/5"
                    : "border-warning/30 bg-warning/5";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 fade-in">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Morning Brief</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              {lastFetch && (
                <span className="ml-2 opacity-60">· Updated {lastFetch.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MetricCard
            label="Headlines Analyzed"
            value={summary_stats.total_headlines}
            icon={<Newspaper className="w-4 h-4" />}
          />
          <MetricCard
            label="Highest Risk"
            value={[...benchmark].sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk)[0]?.sector ?? "—"}
            icon={<AlertTriangle className="w-4 h-4" />}
            colorClass="text-bearish"
          />
          <MetricCard
            label="Market Regime"
            value={market_regime.regime}
            icon={<Activity className="w-4 h-4" />}
            colorClass={regimeColor}
          />
          <MetricCard
            label="Geo Flags"
            value={summary_stats.geopolitical_flags}
            icon={<Globe className="w-4 h-4" />}
            colorClass={summary_stats.geopolitical_flags > 3 ? "text-warning" : "text-muted-foreground"}
          />
        </div>

        {/* Regime Banner */}
        <div className={`glass-card p-5 mb-5 border ${regimeBg} fade-in`}>
          <p className={`text-lg font-semibold ${regimeColor} mb-1`}>{market_regime.regime}</p>
          <p className="text-sm text-secondary-foreground mb-3">{market_regime.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="label-text mb-1">Watch</p>
              <p className="text-secondary-foreground text-xs">{market_regime.watch}</p>
            </div>
            <div>
              <p className="label-text mb-1">Avoid</p>
              <p className="text-secondary-foreground text-xs">{market_regime.avoid}</p>
            </div>
            <div>
              <p className="label-text mb-1">Nifty Outlook</p>
              <p className="text-secondary-foreground text-xs">{market_regime.nifty_implication}</p>
            </div>
          </div>
        </div>

        {/* Generate Brief */}
        <div className="flex flex-wrap items-center gap-3 mb-4 fade-in">
          <button
            onClick={generateBrief}
            disabled={briefLoading || briefRemaining <= 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {briefLoading ? "Generating..." : brief ? "Regenerate Brief" : "Generate AI Morning Brief"}
          </button>

          {/* Usage indicator */}
          <div className="flex items-center gap-2">
            {[0, 1].map(i => (
              <div
                key={i}
                className={`w-6 h-2 rounded-full transition-colors ${
                  i < briefUsed ? "bg-primary" : "bg-accent border border-border"
                }`}
                title={i < briefUsed ? "Used" : "Available"}
              />
            ))}
            <span className="text-xs text-muted-foreground">
              {briefRemaining} / 2 remaining today
            </span>
          </div>

          {briefRemaining === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Resets at midnight
            </div>
          )}
        </div>

        {/* Brief Output */}
        {brief && (
          <div className="glass-card mb-5 overflow-hidden fade-in">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-accent/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="label-text">AI Morning Brief</span>
              <span className="text-xs text-muted-foreground ml-auto">
                Grounded in {summary_stats.total_headlines} live headlines
              </span>
            </div>
            <div className="p-5">
              <div className="prose prose-sm prose-invert max-w-none text-secondary-foreground leading-relaxed
                [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-sm [&_h2]:mt-4 [&_h2]:mb-1
                [&_p]:text-sm [&_p]:leading-relaxed
                [&_ul]:text-sm [&_li]:leading-relaxed
                [&_strong]:text-foreground">
                <ReactMarkdown>{brief}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Pareto Chart */}
        <div className="glass-card p-4 mb-5 fade-in">
          <h3 className="label-text mb-0.5">Pareto Risk Concentration</h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            Which 20% of sectors drive 80% of total market risk today
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={pareto} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 10 }} width={30} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "80%", fill: "#f59e0b", fontSize: 10 }} />
              <Bar yAxisId="left" dataKey="avg_weighted_risk" radius={[3, 3, 0, 0]}>
                {pareto.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.cumulative_pct <= 80 ? "#ef4444" : entry.avg_weighted_risk > 10 ? "#f59e0b" : "#22c55e"} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" stroke="#60a5fa" strokeWidth={1.5} dot={{ r: 3, fill: "#60a5fa" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Headlines Table */}
        <div className="glass-card overflow-hidden fade-in">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="label-text">Headlines by impact</h3>
            <span className="text-xs text-muted-foreground">{headlines.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {[
                    { key: "title",        label: "Headline"  },
                    { key: "sector",       label: "Sector"    },
                    { key: "sentiment",    label: "Sentiment" },
                    { key: "impact_score", label: "Impact"    },
                    { key: "z_score",      label: "Shock"     },
                    { key: null,           label: "AI Insight"},
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      className="text-left p-3 label-text font-medium cursor-pointer whitespace-nowrap"
                      onClick={() => key && handleSort(key as SortKey)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {key && <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h: any, i: number) => (
                  <tr
                    key={i}
                    className={`border-b border-border/40 hover:bg-accent/20 transition-colors ${
                      h.shock_status !== "Normal" ? "shadow-[inset_2px_0_0_rgba(239,68,68,0.4)]" : ""
                    }`}
                  >
                    <td className="p-3 max-w-[200px] lg:max-w-xs">
                      <span className="line-clamp-2 text-xs text-foreground">{h.title}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{h.sector}</td>
                    <td className="p-3"><SentimentBadge sentiment={h.sentiment} /></td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`font-semibold text-xs ${
                        h.impact_score >= 8 ? "text-bearish" :
                        h.impact_score >= 6 ? "text-warning" : "text-muted-foreground"
                      }`}>{h.impact_score}/10</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        h.shock_status === "Major Shock" ? "bg-bearish/15 text-bearish" :
                        h.shock_status === "Shock"       ? "bg-warning/15 text-warning" :
                                                           "bg-accent text-muted-foreground"
                      }`}>{h.shock_status}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-[11px] max-w-[200px] lg:max-w-sm">
                      {h.one_line_insight}
                    </td>
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
