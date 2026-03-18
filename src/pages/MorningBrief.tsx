import { useState } from "react";
import { Newspaper, AlertTriangle, TrendingUp, Globe, Sparkles, ArrowUpDown, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { benchmarkData, headlinesData, marketRegime, paretoData } from "@/data/mockData";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine
} from "recharts";

type SortKey = "impact_score" | "sector" | "sentiment" | "z_score";

export default function MorningBrief() {
  const [briefVisible, setBriefVisible] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("impact_score");
  const [sortAsc, setSortAsc] = useState(false);

  const highRisk = benchmarkData.reduce((a, b) => a.avg_weighted_risk > b.avg_weighted_risk ? a : b);
  const geoFlags = headlinesData.filter(h => h.geopolitical_risk).length;

  const sorted = [...headlinesData].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    if (typeof va === "number" && typeof vb === "number") return sortAsc ? va - vb : vb - va;
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const regime = marketRegime.regime as string;
  const regimeColor = regime === "Risk On" ? "text-bullish" : regime === "Panic" ? "text-bearish" : "text-warning";

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Morning Brief</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in fade-in-delay-1">Today's market intelligence snapshot</p>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Headlines Analyzed" value={headlinesData.length} icon={<Newspaper className="w-4 h-4" />} delay={1} />
          <MetricCard label="Highest Risk Sector" value={`${highRisk.sector} (${highRisk.avg_weighted_risk})`} icon={<AlertTriangle className="w-4 h-4" />} colorClass="text-bearish" delay={2} />
          <MetricCard label="Market Regime" value={marketRegime.regime} icon={<Activity className="w-4 h-4" />} colorClass={regimeColor} delay={3} />
          <MetricCard label="Geopolitical Flags" value={geoFlags} icon={<Globe className="w-4 h-4" />} colorClass="text-warning" delay={4} />
        </div>

        {/* Regime Banner */}
        <div className="glass-card p-6 mb-6 fade-in fade-in-delay-2">
          <h2 className={`text-xl font-semibold ${regimeColor} mb-2`}>{marketRegime.regime}</h2>
          <p className="text-sm text-secondary-foreground mb-4">{marketRegime.description}</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📌 <strong className="text-foreground">Watch:</strong> {marketRegime.watch}</p>
            <p>🚫 <strong className="text-foreground">Avoid:</strong> {marketRegime.avoid}</p>
            <p>📊 <strong className="text-foreground">Nifty:</strong> {marketRegime.nifty_implication}</p>
          </div>
        </div>

        {/* Generate Brief */}
        <button
          onClick={() => setBriefVisible(!briefVisible)}
          className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors fade-in fade-in-delay-2"
        >
          <Sparkles className="w-4 h-4" />
          {briefVisible ? "Hide Brief" : "Generate AI Morning Brief"}
        </button>

        {briefVisible && (
          <div className="glass-card p-6 mb-6 fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> AI-Generated Morning Brief
            </h3>
            <div className="space-y-3 text-sm text-secondary-foreground leading-relaxed">
              <p>🔴 <strong>Overall Mood: Risk Off.</strong> Market regime classification triggered by elevated geopolitical risk (50.0 weighted score) combined with deteriorating Energy sector sentiment (CSI: -50.1, velocity: -22.1). Capital preservation should dominate this session.</p>
              <p>🟡 <strong>Top 2 Sectors to Watch:</strong> Geopolitics (highest risk, Major Shock detected on Hormuz news) and Energy (strong negative momentum, highest contagion potential). Banking remains the lone bright spot with CSI +70.2 and positive velocity.</p>
              <p>🔴 <strong>Key Risk Event:</strong> Trump's Strait of Hormuz U-turn (Z-score 2.8, Major Shock). This single headline cascades into Energy, Manufacturing, and FMCG through crude input cost channels.</p>
              <p className="text-muted-foreground italic">Trading Implication: Avoid fresh long positions in Energy and IT. Banking dips are accumulation opportunities. Set tight stop-losses on manufacturing positions. Gap-down open likely — don't chase early moves below 22,000.</p>
            </div>
          </div>
        )}

        {/* Pareto Chart */}
        <div className="glass-card p-5 mb-6 fade-in fade-in-delay-3">
          <h3 className="label-text mb-1">Pareto Risk Concentration</h3>
          <p className="text-xs text-muted-foreground mb-4">Which 20% of sectors cause 80% of market risk</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={paretoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="sector" tick={{ fill: "#ccc", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Risk Score", angle: -90, position: "insideLeft", fill: "#666", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Cumulative %", angle: 90, position: "insideRight", fill: "#666", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(240 15% 10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "80% threshold", fill: "#f59e0b", fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="risk" radius={[4, 4, 0, 0]}>
                {paretoData.map((entry, i) => (
                  <Cell key={i} fill={entry.cumulative_pct <= 80 ? "#ef4444" : entry.risk > 10 ? "#f59e0b" : "#22c55e"} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: "#60a5fa" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Headlines Table */}
        <div className="glass-card overflow-hidden fade-in fade-in-delay-3">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Top Headlines</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 label-text font-medium">Headline</th>
                  <th className="text-left p-4 label-text font-medium cursor-pointer" onClick={() => handleSort("sector")}>
                    <span className="inline-flex items-center gap-1">Sector <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-4 label-text font-medium cursor-pointer" onClick={() => handleSort("sentiment")}>
                    <span className="inline-flex items-center gap-1">Sentiment <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-4 label-text font-medium cursor-pointer" onClick={() => handleSort("impact_score")}>
                    <span className="inline-flex items-center gap-1">Impact <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-4 label-text font-medium cursor-pointer" onClick={() => handleSort("z_score")}>
                    <span className="inline-flex items-center gap-1">Shock <ArrowUpDown className="w-3 h-3" /></span>
                  </th>
                  <th className="text-left p-4 label-text font-medium">AI Insight</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((h, i) => (
                  <tr key={i} className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${h.shock_status !== "Normal" ? "shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]" : ""}`}>
                    <td className="p-4 text-foreground font-medium max-w-xs">{h.title}</td>
                    <td className="p-4 text-muted-foreground">{h.sector}</td>
                    <td className="p-4"><SentimentBadge sentiment={h.sentiment} /></td>
                    <td className="p-4">
                      <span className={`font-semibold ${h.impact_score >= 8 ? 'text-bearish' : h.impact_score >= 6 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {h.impact_score}/10
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        h.shock_status === "Major Shock" ? "bg-bearish/15 text-bearish" :
                        h.shock_status === "Shock" ? "bg-warning/15 text-warning" :
                        "bg-accent text-muted-foreground"
                      }`}>
                        {h.shock_status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs max-w-sm">{h.one_line_insight}</td>
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
