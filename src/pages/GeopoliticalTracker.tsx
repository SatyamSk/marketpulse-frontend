import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SentimentBadge } from "@/components/SentimentBadge";
import { useDashboard } from "@/hooks/useDashboard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, ScatterChart, Scatter,
  ZAxis, ReferenceLine
} from "recharts";

const TT = {
  background: "hsl(228 18% 7%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#e2e8f0", fontSize: 12,
};

export default function GeopoliticalTracker() {
  const { data, loading, error } = useDashboard();
  const [expanded, setExpanded]  = useState<number | null>(null);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading geopolitical data...
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout>
      <div className="glass-card p-6 text-sm text-bearish">{error ?? "No data"}</div>
    </DashboardLayout>
  );

  const { headlines, contagion_flows } = data;

  const geoHeadlines = headlines
    .filter((h: any) =>
      String(h.geopolitical_risk).toLowerCase() === "true" || h.geopolitical_risk === true
    )
    .sort((a: any, b: any) => b.impact_score - a.impact_score);

  const allShocks = headlines
    .map((h: any, i: number) => ({
      x:     i + 1,
      y:     Number(h.z_score ?? 0),
      title: h.title,
      sector: h.sector,
      shock:  h.shock_status ?? "Normal",
      impact: h.impact_score,
    }))
    .filter(h => !isNaN(h.y));

  const sectorCounts = Object.entries(
    geoHeadlines.reduce<Record<string, number>>((acc: any, h: any) => {
      acc[h.sector] = (acc[h.sector] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => (b.count as number) - (a.count as number));

  const sentCounts = [
    { name: "Negative", value: geoHeadlines.filter((h: any) => h.sentiment === "negative").length, fill: "#ef4444" },
    { name: "Neutral",  value: geoHeadlines.filter((h: any) => h.sentiment === "neutral").length,  fill: "#f59e0b" },
    { name: "Positive", value: geoHeadlines.filter((h: any) => h.sentiment === "positive").length, fill: "#22c55e" },
  ].filter(d => d.value > 0);

  const maxContagion = Math.max(...contagion_flows.map((f: any) => f.value), 1);
  const totalContagion = contagion_flows.reduce((s: number, f: any) => s + f.value, 0);

  const majorShocks  = allShocks.filter(h => h.shock === "Major Shock").length;
  const shocks       = allShocks.filter(h => h.shock === "Shock").length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">

        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Geopolitical Risk Tracker</h1>
          <p className="text-xs text-muted-foreground">
            Events with cross-sector cascade potential · {geoHeadlines.length} geo-flagged today
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-in">
          {[
            { label: "Geo Events",    value: geoHeadlines.length,       color: geoHeadlines.length > 3 ? "text-bearish" : "text-warning" },
            { label: "Major Shocks",  value: majorShocks,               color: majorShocks > 0 ? "text-bearish" : "text-muted-foreground" },
            { label: "Shocks",        value: shocks,                    color: shocks > 0 ? "text-warning" : "text-muted-foreground"    },
            { label: "Sectors Hit",   value: sectorCounts.length,       color: "text-foreground"                                        },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-4">
              <p className="label-text mb-2">{label}</p>
              <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {geoHeadlines.length > 0 && (
          <div className="p-3.5 rounded-xl border border-bearish/25 bg-bearish/5 fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-bearish shrink-0" />
              <span className="text-sm font-medium text-bearish">
                {geoHeadlines.length} geopolitical risk event{geoHeadlines.length > 1 ? "s" : ""} detected
              </span>
              {majorShocks > 0 && (
                <span className="tag bg-bearish/20 text-bearish ml-2">
                  {majorShocks} major shock{majorShocks > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">
          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">Events by Sector</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              Number of geo-flagged headlines per sector
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectorCounts} margin={{ top: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} width={20} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {sectorCounts.map((_: any, i: number) => (
                    <Cell key={i} fill={
                      ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a78bfa"][i % 5]
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">Geo Sentiment Split</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              Overall tone of geopolitical headlines today
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentCounts}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#475569", strokeWidth: 0.5 }}
                >
                  {sentCounts.map((e: any, i: number) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TT} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contagion Map */}
        {contagion_flows.length > 0 && (
          <div className="glass-card p-4 fade-in">
            <h3 className="label-text mb-0.5">Geopolitical Contagion Map</h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              How geo events cascade into sectors · bar width = average impact score · use for second-order risk assessment
            </p>
            <div className="space-y-2.5">
              {contagion_flows
                .sort((a: any, b: any) => b.value - a.value)
                .map((flow: any) => {
                  const pct   = (flow.value / maxContagion) * 100;
                  const share = totalContagion > 0 ? (flow.value / totalContagion * 100).toFixed(0) : 0;
                  const color = flow.value >= 7 ? "#ef4444" : flow.value >= 5 ? "#f59e0b" : "#22c55e";
                  return (
                    <div key={flow.target} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-28 text-right shrink-0">
                        → {flow.target}
                      </span>
                      <div className="flex-1 relative h-7 rounded overflow-hidden bg-accent/20">
                        <div
                          className="h-full flex items-center px-3 transition-all"
                          style={{
                            width: `${Math.max(pct, 8)}%`,
                            background: `${color}18`,
                            borderLeft: `3px solid ${color}`,
                          }}
                        >
                          <span className="text-[11px] font-medium text-foreground">
                            {flow.target}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="font-mono text-[11px] font-semibold w-8 text-right"
                          style={{ color }}
                        >
                          {flow.value.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">
                          {share}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Impact score is avg across geo-flagged headlines in that sector. {">"}7 = high cascade risk.
            </p>
          </div>
        )}

        {/* Z-Score Shock Index */}
        <div className="glass-card p-4 fade-in">
          <h3 className="label-text mb-0.5">News Shock Index — Z-Score Distribution</h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            Statistical outliers vs sector average impact · Z {">"} 1.5 = Shock · Z {">"} 2.5 = Major Shock
          </p>
          <div className="flex gap-4 mb-2 text-[10px] text-muted-foreground">
            {[
              { color: "#ef4444", label: "Major Shock (Z>2.5)" },
              { color: "#f59e0b", label: "Shock (Z>1.5)"       },
              { color: "#22c55e", label: "Normal"              },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ bottom: 24, left: 0, right: 20, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                type="number" dataKey="x" name="Headline"
                tick={{ fill: "#64748b", fontSize: 10 }}
                label={{ value: "Publication sequence →", position: "bottom", fill: "#475569", fontSize: 10 }}
              />
              <YAxis
                type="number" dataKey="y" name="Z-Score"
                tick={{ fill: "#64748b", fontSize: 10 }}
                domain={[-2, 4]}
                width={24}
              />
              <ZAxis range={[70, 70]} />
              <ReferenceLine
                y={1.5} stroke="#f59e0b" strokeDasharray="4 4"
                label={{ value: "Shock", fill: "#f59e0b", fontSize: 9, position: "right" }}
              />
              <ReferenceLine
                y={2.5} stroke="#ef4444" strokeDasharray="4 4"
                label={{ value: "Major", fill: "#ef4444", fontSize: 9, position: "right" }}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
              <Tooltip
                contentStyle={TT}
                formatter={(_: any, __: any, props: any) => {
                  const d = props.payload;
                  return [
                    `${d.title?.slice(0, 55)}… | ${d.sector} | Z: ${Number(d.y).toFixed(2)} | Impact: ${d.impact}/10`,
                    ""
                  ];
                }}
              />
              <Scatter data={allShocks}>
                {allShocks.map((e: any, i: number) => (
                  <Cell key={i} fill={
                    e.y >= 2.5 ? "#ef4444" :
                    e.y >= 1.5 ? "#f59e0b" : "#22c55e"
                  } />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Event Cards */}
        {geoHeadlines.length > 0 && (
          <div className="fade-in">
            <h3 className="label-text mb-3">Geopolitical Risk Events — Full Detail</h3>
            <div className="space-y-2.5">
              {geoHeadlines.map((event: any, i: number) => (
                <div key={i} className="glass-card-hover overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full p-4 flex items-start justify-between gap-4 text-left"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="tag bg-accent text-muted-foreground">
                          {event.sector}
                        </span>
                        <SentimentBadge sentiment={event.sentiment} />
                        <span className={`tag ${
                          event.impact_score >= 8
                            ? "bg-bearish/15 text-bearish"
                            : "bg-warning/15 text-warning"
                        }`}>
                          Impact {event.impact_score}/10
                        </span>
                        {event.shock_status && event.shock_status !== "Normal" && (
                          <span className={`tag flex items-center gap-1 ${
                            event.shock_status === "Major Shock"
                              ? "bg-bearish/15 text-bearish"
                              : "bg-warning/15 text-warning"
                          }`}>
                            <Zap className="w-2.5 h-2.5" />
                            {event.shock_status}
                            {event.z_score != null && (
                              <span className="ml-0.5 opacity-70">
                                Z:{Number(event.z_score).toFixed(1)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                        {event.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      {event.url && (
                        
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                          title="Open source"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {expanded === i
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </button>

                  {expanded === i && (
                    <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
                      <p className="text-sm text-secondary-foreground leading-relaxed">
                        {event.one_line_insight}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {[
                          { label: "Sentiment Confidence",
                            value: event.sentiment_confidence
                              ? `${(Number(event.sentiment_confidence) * 100).toFixed(0)}%` : "—" },
                          { label: "Valence",
                            value: event.valence ? Number(event.valence).toFixed(2) : "—" },
                          { label: "Arousal",
                            value: event.arousal ? Number(event.arousal).toFixed(2) : "—" },
                          { label: "Source",  value: event.source ?? "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-accent/30 rounded-lg p-2">
                            <p className="label-text mb-1">{label}</p>
                            <p className="text-foreground font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                      {event.affected_companies &&
                        String(event.affected_companies) !== "" &&
                        String(event.affected_companies) !== "[]" && (
                        <div>
                          <p className="label-text mb-1.5">Affected Companies</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(event.affected_companies)
                              ? event.affected_companies
                              : String(event.affected_companies)
                                  .replace(/[\[\]'"]/g, "").split(",").map((s: string) => s.trim()).filter(Boolean)
                            ).map((c: string) => (
                              <span key={c} className="tag bg-accent text-muted-foreground">{c}</span>
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
        )}

      </div>
    </DashboardLayout>
  );
}
