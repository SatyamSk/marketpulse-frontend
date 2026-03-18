import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis, LineChart, Line, Legend, ReferenceLine, Cell } from "recharts";

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 };
const SECTOR_COLORS: Record<string, string> = { Geopolitics: "#ef4444", IT: "#f59e0b", Banking: "#22c55e", Energy: "#3b82f6", FMCG: "#a855f7", Startup: "#06b6d4", Manufacturing: "#ec4899", Healthcare: "#10b981", Fintech: "#8b5cf6", Retail: "#f97316", Other: "#64748b" };

export default function SectorWatchlist() {
  const { data, loading, error } = useDashboard();
  const [hoverSector, setHoverSector] = useState<string | null>(null);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading sector data...</div></DashboardLayout>;
  if (error || !data) return <DashboardLayout><div className="glass-card p-6 text-sm text-bearish">{error ?? "No data"}</div></DashboardLayout>;

  const { benchmark, velocity_trend, correlation_matrix } = data;
  const scatterData = benchmark.map((s: any) => ({ x: s.avg_impact, y: s.avg_weighted_risk, z: s.total_mentions * 120, sector: s.sector, classification: s.sector_classification }));
  const velocityData = [...benchmark].sort((a, b) => Math.abs(b.sentiment_velocity) - Math.abs(a.sentiment_velocity));
  const maxVelocity = Math.max(...velocityData.map(d => Math.abs(d.sentiment_velocity)));

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Sector Watchlist</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in">Live risk and sentiment analytics across {benchmark.length} sectors</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-1">Weighted Risk Score</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...benchmark].sort((a, b) => b.avg_weighted_risk - a.avg_weighted_risk)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 12 }} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg_weighted_risk" radius={[0, 4, 4, 0]}>
                  {[...benchmark].sort((a, b) => b.avg_weighted_risk - a.avg_weighted_risk).map((entry, i) => (
                    <Cell key={i} fill={entry.risk_level === "HIGH" ? "#ef4444" : entry.risk_level === "MEDIUM" ? "#f59e0b" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-1">Net Sentiment Score (NSS)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...benchmark].sort((a, b) => b.sentiment_nss - a.sentiment_nss)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 12 }} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="sentiment_nss" radius={[0, 4, 4, 0]}>
                  {[...benchmark].sort((a, b) => b.sentiment_nss - a.sentiment_nss).map((entry, i) => (
                    <Cell key={i} fill={entry.sentiment_nss >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-1">BCG-Style Sector Classification</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ bottom: 20, left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="Avg Impact" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Risk Score" tick={{ fill: "#64748b", fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[80, 500]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(_: any, __: any, props: any) => [`${props.payload.sector} · ${props.payload.classification}`, ""]} />
                <Scatter data={scatterData} label={{ dataKey: "sector", fill: "#94a3b8", fontSize: 10 }}>
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={entry.classification === "Watch Closely" ? "#ef4444" : entry.classification === "Opportunity" ? "#22c55e" : entry.classification === "Monitor Risk" ? "#f59e0b" : "#64748b"} opacity={hoverSector === null || hoverSector === entry.sector ? 1 : 0.3} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-4">Sentiment Velocity</h3>
            <div className="space-y-3">
              {velocityData.map(d => {
                const pct = maxVelocity > 0 ? (Math.abs(d.sentiment_velocity) / maxVelocity) * 100 : 0;
                const isPos = d.sentiment_velocity >= 0;
                return (
                  <div key={d.sector} className="flex items-center gap-3" onMouseEnter={() => setHoverSector(d.sector)} onMouseLeave={() => setHoverSector(null)}>
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{d.sector}</span>
                    <div className="flex-1 relative h-7">
                      <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-border" /></div>
                      <div className="absolute inset-0 flex items-center" style={{ justifyContent: isPos ? "flex-start" : "flex-end" }}>
                        <div className="h-6 rounded flex items-center px-2" style={{ width: `${Math.max(pct, 8)}%`, background: isPos ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", borderLeft: isPos ? "2px solid #22c55e" : "none", borderRight: isPos ? "none" : "2px solid #ef4444" }}>
                          <span className={`text-xs font-medium ${isPos ? "text-bullish" : "text-bearish"}`}>{isPos ? "↑" : "↓"} {d.sentiment_velocity > 0 ? "+" : ""}{d.sentiment_velocity.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden fade-in">
          <div className="p-4 border-b border-border"><h3 className="label-text">Full Sector Scorecard</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20">
                  {["Sector", "Risk", "NSS", "Impact-Wtd", "CSI", "Velocity", "Level", "Class"].map(h => <th key={h} className="text-left p-3 label-text font-medium whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...benchmark].sort((a, b) => b.benchmark_index - a.benchmark_index).map((s, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-accent/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{s.sector}</td>
                    <td className="p-3 font-mono text-sm">{s.avg_weighted_risk.toFixed(1)}</td>
                    <td className={`p-3 font-medium font-mono text-sm ${s.sentiment_nss >= 0 ? "text-bullish" : "text-bearish"}`}>{s.sentiment_nss > 0 ? "+" : ""}{s.sentiment_nss.toFixed(1)}</td>
                    <td className={`p-3 font-mono text-sm ${s.impact_weighted_sentiment >= 0 ? "text-bullish" : "text-bearish"}`}>{s.impact_weighted_sentiment > 0 ? "+" : ""}{s.impact_weighted_sentiment.toFixed(1)}</td>
                    <td className={`p-3 font-medium font-mono text-sm ${s.composite_sentiment_index >= 0 ? "text-bullish" : "text-bearish"}`}>{s.composite_sentiment_index > 0 ? "+" : ""}{s.composite_sentiment_index.toFixed(1)}</td>
                    <td className={`p-3 font-mono text-sm ${s.sentiment_velocity >= 0 ? "text-bullish" : "text-bearish"}`}>{s.sentiment_velocity > 0 ? "+" : ""}{s.sentiment_velocity.toFixed(1)}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${s.risk_level === "HIGH" ? "bg-bearish/15 text-bearish" : s.risk_level === "MEDIUM" ? "bg-warning/15 text-warning" : "bg-bullish/15 text-bullish"}`}>{s.risk_level}</span></td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">{s.sector_classification}</td>
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
