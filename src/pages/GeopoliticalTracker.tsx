import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SentimentBadge } from "@/components/SentimentBadge";
import { geopoliticalEvents, headlinesData, contagionFlows } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, ScatterChart, Scatter, ZAxis, ReferenceLine
} from "recharts";

const geoHeadlines = headlinesData.filter(h => h.geopolitical_risk);

const sectorCounts: Record<string, number> = {};
geoHeadlines.forEach(h => { sectorCounts[h.sector] = (sectorCounts[h.sector] || 0) + 1; });
const sectorBarData = Object.entries(sectorCounts).map(([sector, count]) => ({ sector, count }));

const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
geoHeadlines.forEach(h => { sentimentCounts[h.sentiment]++; });
const pieData = [
  { name: "Negative", value: sentimentCounts.negative, fill: "#ef4444" },
  { name: "Neutral", value: sentimentCounts.neutral, fill: "#f59e0b" },
  { name: "Positive", value: sentimentCounts.positive, fill: "#22c55e" },
].filter(d => d.value > 0);

const tooltipStyle = { background: "hsl(240 15% 10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" };

// Shock scatter data
const shockScatterData = headlinesData.map((h, i) => ({
  x: i + 1,
  y: h.z_score,
  title: h.title,
  sector: h.sector,
  insight: h.one_line_insight,
  shock: h.shock_status,
}));

// Contagion severity colors
const contagionColors: Record<string, string> = {};
contagionFlows.forEach(f => {
  contagionColors[f.target] = f.value >= 7 ? "#ef4444" : f.value >= 5 ? "#f59e0b" : "#22c55e";
});

export default function GeopoliticalTracker() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Geopolitical Tracker</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in fade-in-delay-1">Monitor geopolitical risks impacting Indian markets</p>

        {/* Warning Banner */}
        <div className="glass-card p-4 mb-6 border-warning/30 flex items-center gap-3 fade-in fade-in-delay-1">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-warning">{geopoliticalEvents.length} geopolitical events</span> detected today that may impact Indian market sectors.
          </p>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-5 fade-in fade-in-delay-2">
            <h3 className="label-text mb-4">Events by Sector</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sector" tick={{ fill: "#ccc", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {sectorBarData.map((_, i) => (
                    <Cell key={i} fill={["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5 fade-in fade-in-delay-3">
            <h3 className="label-text mb-4">Sentiment Split</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contagion Map (visual bar representation) */}
        <div className="glass-card p-5 mb-4 fade-in fade-in-delay-3">
          <h3 className="label-text mb-1">Geopolitical Contagion Map</h3>
          <p className="text-xs text-muted-foreground mb-4">How geopolitical events cascade across sectors — flow thickness = avg impact score</p>
          <div className="space-y-3">
            {contagionFlows.map(flow => {
              const maxVal = Math.max(...contagionFlows.map(f => f.value));
              const pct = (flow.value / maxVal) * 100;
              const color = flow.value >= 7 ? "#ef4444" : flow.value >= 5 ? "#f59e0b" : "#22c55e";
              return (
                <div key={flow.target} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 text-right shrink-0">Geopolitical Event</span>
                  <div className="flex-1 relative h-7 rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div
                      className="h-full rounded flex items-center px-3 transition-all"
                      style={{ width: `${pct}%`, background: `${color}30`, borderLeft: `3px solid ${color}` }}
                    >
                      <span className="text-xs font-medium text-foreground">{flow.target} — Impact {flow.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* News Shock Index */}
        <div className="glass-card p-5 mb-6 fade-in fade-in-delay-3">
          <h3 className="label-text mb-1">News Shock Index</h3>
          <p className="text-xs text-muted-foreground mb-4">Headlines by Z-score — above 1.5 = Shock, above 2.5 = Major Shock</p>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" name="Headline #" tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Headline →", position: "bottom", fill: "#666", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Z-Score" tick={{ fill: "#888", fontSize: 11 }} domain={[-1, 4]} />
              <ZAxis range={[80, 80]} />
              <ReferenceLine y={1.5} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Shock (Z=1.5)", fill: "#f59e0b", fontSize: 10 }} />
              <ReferenceLine y={2.5} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Major Shock (Z=2.5)", fill: "#ef4444", fontSize: 10 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(_: any, __: string, props: any) => {
                  const d = props.payload;
                  return [`${d.title} (${d.sector}) — Z: ${d.y.toFixed(1)}`, ""];
                }}
              />
              <Scatter data={shockScatterData}>
                {shockScatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.y >= 2.5 ? "#ef4444" : entry.y >= 1.5 ? "#f59e0b" : "#22c55e"} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Event Cards */}
        <div className="space-y-3">
          {geopoliticalEvents.map((event) => (
            <div key={event.id} className="glass-card-hover fade-in fade-in-delay-3">
              <button
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                className="w-full p-5 flex items-start justify-between gap-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground">{event.sector}</span>
                    <SentimentBadge sentiment={event.sentiment} />
                    <span className={`text-xs font-semibold ${event.impact_score >= 8 ? 'text-bearish' : 'text-warning'}`}>
                      Impact: {event.impact_score}/10
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      event.shock_status === "Major Shock" ? "bg-bearish/15 text-bearish" :
                      event.shock_status === "Shock" ? "bg-warning/15 text-warning" :
                      "bg-accent text-muted-foreground"
                    }`}>
                      {event.shock_status} (Z: {event.z_score.toFixed(1)})
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                </div>
                {expanded === event.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
              </button>
              {expanded === event.id && (
                <div className="px-5 pb-5 space-y-3 border-t border-border/50 pt-4">
                  <p className="text-sm text-secondary-foreground leading-relaxed">{event.one_line_insight}</p>
                  {event.affected_companies.length > 0 && (
                    <div>
                      <p className="label-text mb-2">Affected Companies</p>
                      <div className="flex gap-2 flex-wrap">
                        {event.affected_companies.map(c => (
                          <span key={c} className="px-2.5 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
