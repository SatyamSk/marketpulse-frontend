import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis, ReferenceLine } from "recharts";

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 };

export default function GeopoliticalTracker() {
  const { data, loading, error } = useDashboard();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading geopolitical data...</div></DashboardLayout>;
  if (error || !data) return <DashboardLayout><div className="glass-card p-6 text-sm text-bearish">{error ?? "No data"}</div></DashboardLayout>;

  const { headlines, contagion_flows } = data;
  const geoHeadlines = headlines.filter(h => String(h.geopolitical_risk).toLowerCase() === "true" || h.geopolitical_risk === true).sort((a: any, b: any) => b.impact_score - a.impact_score);

  const sectorCounts = Object.entries(geoHeadlines.reduce<Record<string, number>>((acc, h) => { acc[h.sector] = (acc[h.sector] || 0) + 1; return acc; }, {})).map(([sector, count]) => ({ sector, count })).sort((a, b) => b.count - a.count);
  const sentimentCounts = [
    { name: "Negative", value: geoHeadlines.filter(h => h.sentiment === "negative").length, fill: "#ef4444" },
    { name: "Neutral", value: geoHeadlines.filter(h => h.sentiment === "neutral").length, fill: "#f59e0b" },
    { name: "Positive", value: geoHeadlines.filter(h => h.sentiment === "positive").length, fill: "#22c55e" },
  ].filter(d => d.value > 0);

  const shockData = headlines.map((h, i) => ({ x: i + 1, y: h.z_score ?? 0, title: h.title, sector: h.sector, shock: h.shock_status }));
  const maxContagion = Math.max(...contagion_flows.map((f: any) => f.value), 1);

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Geopolitical Risk Tracker</h1>
        <p className="text-sm text-muted-foreground mb-4 fade-in">Events that could move Indian markets today</p>

        {geoHeadlines.length === 0 ? (
          <div className="glass-card p-6 text-bullish text-sm">No geopolitical risk events detected in today's headlines.</div>
        ) : (
          <div className="mb-6 p-4 rounded-lg border border-bearish/30 bg-bearish/5 fade-in">
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-bearish" /><span className="text-sm font-medium text-bearish">{geoHeadlines.length} geopolitical risk event{geoHeadlines.length > 1 ? "s" : ""} detected today</span></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-4">Events by Sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {sectorCounts.map((_, i) => <Cell key={i} fill={["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7"][i % 5]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-4">Sentiment Split</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sentimentCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {sentimentCounts.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 mb-4 fade-in">
          <h3 className="label-text mb-1">Geopolitical Contagion Impact</h3>
          <div className="space-y-3 mt-4">
            {contagion_flows.map((flow: any) => {
              const pct = (flow.value / maxContagion) * 100;
              const color = flow.value >= 7 ? "#ef4444" : flow.value >= 5 ? "#f59e0b" : "#22c55e";
              return (
                <div key={flow.target} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-28 text-right shrink-0">Geo Event</span>
                  <div className="flex-1 relative h-8 rounded overflow-hidden bg-accent/30">
                    <div className="h-full rounded flex items-center px-3" style={{ width: `${Math.max(pct, 10)}%`, background: `${color}20`, borderLeft: `3px solid ${color}` }}>
                      <span className="text-xs font-medium text-foreground">{flow.target}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium w-12 shrink-0" style={{ color }}>{flow.value.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5 mb-6 fade-in">
          <h3 className="label-text mb-1">News Shock Index (Z-Score)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ bottom: 20, left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" name="Headline" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Z-Score" tick={{ fill: "#64748b", fontSize: 11 }} domain={[-2, 4]} />
              <ZAxis range={[80, 80]} />
              <ReferenceLine y={1.5} stroke="#f59e0b" strokeDasharray="5 5" />
              <ReferenceLine y={2.5} stroke="#ef4444" strokeDasharray="5 5" />
              <Tooltip contentStyle={tooltipStyle} formatter={(_: any, __: any, props: any) => [`${props.payload.title?.slice(0, 50)}... | ${props.payload.sector}`, ""]} />
              <Scatter data={shockData}>
                {shockData.map((entry, i) => <Cell key={i} fill={entry.y >= 2.5 ? "#ef4444" : entry.y >= 1.5 ? "#f59e0b" : "#22c55e"} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <h3 className="label-text mb-3 fade-in">Geopolitical Risk Events</h3>
        <div className="space-y-3 fade-in">
          {geoHeadlines.map((event: any, i: number) => (
            <div key={i} className="glass-card overflow-hidden">
              <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full p-5 flex items-start justify-between gap-4 text-left">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent text-muted-foreground">{event.sector}</span>
                    <SentimentBadge sentiment={event.sentiment} />
                    <span className={`text-xs font-semibold ${event.impact_score >= 8 ? "text-bearish" : "text-warning"}`}>Impact {event.impact_score}/10</span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{event.title}</h3>
                </div>
                {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
              </button>
              {expanded === i && (
                <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                  <p className="text-sm text-secondary-foreground leading-relaxed">{event.one_line_insight}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
