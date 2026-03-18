import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis, LineChart,
  Line, Legend, ReferenceLine, Cell
} from "recharts";

const TT = {
  background: "hsl(228 18% 7%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#e2e8f0", fontSize: 12,
};

const SECTOR_COLORS: Record<string, string> = {
  IT:            "#f59e0b",
  Banking:       "#22c55e",
  Energy:        "#3b82f6",
  FMCG:          "#a78bfa",
  Startup:       "#06b6d4",
  Manufacturing: "#f472b6",
  Healthcare:    "#10b981",
  Fintech:       "#818cf8",
  Retail:        "#fb923c",
  Other:         "#64748b",
};

const BCG_COLORS: Record<string, string> = {
  "Watch Closely": "#ef4444",
  "Opportunity":   "#22c55e",
  "Monitor Risk":  "#f59e0b",
  "Low Priority":  "#64748b",
};

const BCG_DESCRIPTIONS: Record<string, string> = {
  "Watch Closely": "High impact + high risk. Needs immediate attention and hedging.",
  "Opportunity":   "High impact + low risk. Potential entry point for informed positions.",
  "Monitor Risk":  "Low impact + high risk. Underlying risk present despite low headlines.",
  "Low Priority":  "Low impact + low risk. No urgent action required.",
};

function CustomBCGTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: "hsl(228 18% 7%)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8, padding: "10px 12px", maxWidth: 220,
    }}>
      <p style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
        {d.sector}
      </p>
      <p style={{
        color: BCG_COLORS[d.classification] ?? "#94a3b8",
        fontSize: 11, fontWeight: 600, marginBottom: 6,
      }}>
        {d.classification}
      </p>
      <p style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.5 }}>
        {BCG_DESCRIPTIONS[d.classification] ?? ""}
      </p>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8, paddingTop: 8 }}>
        <p style={{ color: "#64748b", fontSize: 10 }}>
          Avg Impact: <span style={{ color: "#e2e8f0" }}>{d.x?.toFixed(1)}</span>
          &nbsp;·&nbsp; Risk Score: <span style={{ color: "#e2e8f0" }}>{d.y?.toFixed(1)}</span>
          &nbsp;·&nbsp; Mentions: <span style={{ color: "#e2e8f0" }}>{d.mentions}</span>
        </p>
      </div>
    </div>
  );
}

function InvestmentSignal({ s }: { s: any }) {
  const csi      = s.composite_sentiment_index ?? 0;
  const risk     = s.avg_weighted_risk ?? 0;
  const velocity = s.sentiment_velocity ?? 0;
  const diverge  = s.divergence_flag === "High Divergence";

  let signal = "NEUTRAL";
  let color  = "#64748b";
  let detail = "Mixed signals. No clear directional bias.";

  if (csi > 30 && risk < 25 && velocity > 0) {
    signal = "BUY BIAS";
    color  = "#22c55e";
    detail = "Positive sentiment momentum with low risk exposure.";
  } else if (csi < -20 || (risk > 50 && velocity < 0)) {
    signal = "AVOID";
    color  = "#ef4444";
    detail = "Elevated risk or deteriorating sentiment. Exercise caution.";
  } else if (diverge) {
    signal = "CAUTION";
    color  = "#f59e0b";
    detail = "Divergence detected. Surface positives may mask underlying risk.";
  } else if (velocity > 5 && csi > 0) {
    signal = "IMPROVING";
    color  = "#06b6d4";
    detail = "Sentiment recovering. Watch for confirmation.";
  }

  return (
    <span
      className="tag"
      style={{ background: `${color}18`, color }}
      title={detail}
    >
      {signal}
    </span>
  );
}

export default function SectorWatchlist() {
  const { data, loading, error } = useDashboard();
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading sector data...
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout>
      <div className="glass-card p-6 text-sm text-bearish">{error ?? "No data"}</div>
    </DashboardLayout>
  );

  const { benchmark, velocity_trend, correlation_matrix } = data;

  const scatterData = benchmark.map((s: any) => ({
    x:              s.avg_impact,
    y:              s.avg_weighted_risk,
    z:              s.total_mentions * 140,
    sector:         s.sector,
    classification: s.sector_classification,
    mentions:       s.total_mentions,
  }));

  const velocityData = [...benchmark].sort(
    (a: any, b: any) => Math.abs(b.sentiment_velocity) - Math.abs(a.sentiment_velocity)
  );
  const maxVel = Math.max(...velocityData.map((d: any) => Math.abs(d.sentiment_velocity)), 1);

  const sectorTrendKeys = Object.keys(SECTOR_COLORS).filter(
    k => velocity_trend?.[0] && k in (velocity_trend[0] as any)
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">

        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Sector Watchlist</h1>
          <p className="text-xs text-muted-foreground">
            Investment-grade sector analytics · {benchmark.length} sectors · All scores Python-calculated
          </p>
        </div>

        {/* Row 1 — Risk + NSS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">
          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">Weighted Risk Score</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              Impact × Sentiment × Sector Weight × Geo Bonus — higher = more dangerous
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...benchmark].sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk)}
                layout="vertical" margin={{ left: 0, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis type="category" dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 11 }} width={88} />
                <Tooltip
                  contentStyle={TT}
                  formatter={(v: any, _: any, props: any) => {
                    const s = props.payload;
                    return [
                      `${Number(v).toFixed(1)} — ${s.risk_level} risk`,
                      "Weighted Risk"
                    ];
                  }}
                />
                <Bar dataKey="avg_weighted_risk" radius={[0, 3, 3, 0]}>
                  {[...benchmark].sort((a: any, b: any) => b.avg_weighted_risk - a.avg_weighted_risk).map((e: any, i: number) => (
                    <Cell key={i} fill={
                      e.risk_level === "HIGH"   ? "#ef4444" :
                      e.risk_level === "MEDIUM" ? "#f59e0b" : "#22c55e"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">Composite Sentiment Index (CSI)</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              25% NSS + 50% Impact-Weighted + 25% Confidence-Weighted · Range −100 to +100
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[...benchmark].sort((a: any, b: any) => b.composite_sentiment_index - a.composite_sentiment_index)}
                layout="vertical" margin={{ left: 0, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" domain={[-100, 110]} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis type="category" dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 11 }} width={88} />
                <Tooltip
                  contentStyle={TT}
                  formatter={(v: any, _: any, props: any) => {
                    const s = props.payload;
                    return [
                      `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(1)} · Velocity: ${Number(s.sentiment_velocity) > 0 ? "+" : ""}${Number(s.sentiment_velocity).toFixed(1)}`,
                      "CSI"
                    ];
                  }}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                <Bar dataKey="composite_sentiment_index" radius={[0, 3, 3, 0]}>
                  {[...benchmark].sort((a: any, b: any) => b.composite_sentiment_index - a.composite_sentiment_index).map((e: any, i: number) => (
                    <Cell key={i} fill={e.composite_sentiment_index >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2 — BCG + Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">
          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">BCG-Style Sector Classification</h3>
            <p className="text-[10px] text-muted-foreground mb-2">
              Avg Impact vs Risk Score · Bubble = headline volume · Hover for investment signal
            </p>
            <div className="flex gap-3 flex-wrap mb-2">
              {Object.entries(BCG_COLORS).map(([label, color]) => (
                <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ bottom: 20, left: 0, right: 16, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number" dataKey="x" name="Avg Impact"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  label={{ value: "Avg Impact →", position: "bottom", fill: "#475569", fontSize: 10 }}
                />
                <YAxis
                  type="number" dataKey="y" name="Risk Score"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  label={{ value: "Risk →", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10 }}
                />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip content={<CustomBCGTooltip />} />
                <Scatter
                  data={scatterData}
                  label={{ dataKey: "sector", fill: "#94a3b8", fontSize: 9 }}
                >
                  {scatterData.map((e: any, i: number) => (
                    <Cell
                      key={i}
                      fill={BCG_COLORS[e.classification] ?? "#64748b"}
                      opacity={hoveredSector === null || hoveredSector === e.sector ? 1 : 0.25}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="label-text mb-0.5">Sentiment Velocity</h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Rate of CSI change — predicts turning points before price action
            </p>
            <div className="space-y-2.5">
              {velocityData.map((d: any) => {
                const pct  = (Math.abs(d.sentiment_velocity) / maxVel) * 100;
                const isPos = d.sentiment_velocity >= 0;
                return (
                  <div
                    key={d.sector}
                    className="flex items-center gap-2.5 cursor-default"
                    onMouseEnter={() => setHoveredSector(d.sector)}
                    onMouseLeave={() => setHoveredSector(null)}
                  >
                    <span className="text-[11px] text-muted-foreground w-22 text-right shrink-0 min-w-[88px]">
                      {d.sector}
                    </span>
                    <div className="flex-1 relative h-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-px bg-border" />
                      </div>
                      <div
                        className="absolute inset-0 flex items-center"
                        style={{ justifyContent: isPos ? "flex-start" : "flex-end" }}
                      >
                        <div
                          className="h-5 rounded-sm flex items-center px-2"
                          style={{
                            width: `${Math.max(pct, 10)}%`,
                            background: isPos ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
                            borderLeft:  isPos ? "2px solid #22c55e" : "none",
                            borderRight: isPos ? "none" : "2px solid #ef4444",
                          }}
                        >
                          <span className={`text-[10px] font-semibold font-mono ${
                            isPos ? "text-bullish" : "text-bearish"
                          }`}>
                            {isPos ? "▲" : "▼"} {d.sentiment_velocity > 0 ? "+" : ""}{Number(d.sentiment_velocity).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold w-10 text-right shrink-0 ${
                      d.risk_level === "HIGH"   ? "text-bearish" :
                      d.risk_level === "MEDIUM" ? "text-warning" : "text-bullish"
                    }`}>
                      {d.risk_level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Correlation Matrix */}
        {correlation_matrix?.sectors?.length >= 2 && (
          <div className="glass-card p-4 fade-in">
            <h3 className="label-text mb-0.5">Sector Correlation Matrix</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              Pearson correlation of CSI movements · +1 = move together · −1 = move opposite · Use for portfolio diversification
            </p>
            <div className="overflow-x-auto">
              <table className="text-[10px]">
                <thead>
                  <tr>
                    <th className="p-1.5" />
                    {correlation_matrix.sectors.map((s: string) => (
                      <th key={s} className="p-1.5 text-muted-foreground font-medium text-center min-w-[60px]">
                        {s.slice(0, 5)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlation_matrix.sectors.map((row: string, ri: number) => (
                    <tr key={row}>
                      <td className="p-1.5 text-muted-foreground font-medium text-right pr-3 whitespace-nowrap">
                        {row}
                      </td>
                      {correlation_matrix.values[ri].map((val: number, ci: number) => {
                        const abs = Math.abs(val);
                        const bg  = ri === ci
                          ? "rgba(255,255,255,0.04)"
                          : val > 0
                            ? `rgba(34,197,94,${abs * 0.5})`
                            : `rgba(239,68,68,${abs * 0.5})`;
                        const textColor = abs > 0.5
                          ? (val > 0 ? "#bbf7d0" : "#fecaca")
                          : "#94a3b8";
                        return (
                          <td
                            key={ci}
                            className="p-1.5 text-center rounded"
                            style={{ background: bg }}
                            title={`${row} vs ${correlation_matrix.sectors[ci]}: ${val}`}
                          >
                            <span style={{ color: textColor, fontFamily: "DM Mono, monospace" }}>
                              {val.toFixed(2)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-6 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded" style={{ background: "rgba(34,197,94,0.5)" }} />
                Positive correlation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded" style={{ background: "rgba(239,68,68,0.5)" }} />
                Negative correlation
              </span>
            </div>
          </div>
        )}

        {/* Velocity Trend */}
        {velocity_trend && velocity_trend.length > 1 && (
          <div className="glass-card p-4 fade-in">
            <h3 className="label-text mb-0.5">CSI Velocity Trend</h3>
            <p className="text-[10px] text-muted-foreground mb-3">
              3-day moving average of Composite Sentiment Index per sector
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={velocity_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="run" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                {sectorTrendKeys.map(sector => (
                  <Line key={sector} type="monotone" dataKey={sector}
                    stroke={SECTOR_COLORS[sector] ?? "#64748b"}
                    strokeWidth={1.5} dot={{ r: 2.5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Investment-grade Scorecard */}
        <div className="glass-card overflow-hidden fade-in">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="label-text">Investment Scorecard</h3>
            <span className="text-[10px] text-muted-foreground">
              Signal = Python-derived · hover for definition
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60 bg-accent/15">
                  {[
                    { label: "Sector",    title: ""                                              },
                    { label: "Signal",    title: "Investment signal derived from CSI + Risk + Velocity" },
                    { label: "Risk",      title: "Weighted risk score 0–100"                    },
                    { label: "CSI",       title: "Composite Sentiment Index −100 to +100"       },
                    { label: "Velocity",  title: "Rate of CSI change since last run"            },
                    { label: "Divergence",title: "Gap between NSS and impact-weighted score"   },
                    { label: "Level",     title: "HIGH / MEDIUM / LOW risk classification"     },
                    { label: "Class",     title: "BCG-style strategic quadrant"                },
                    { label: "Mentions",  title: "Total headlines today"                       },
                  ].map(({ label, title }) => (
                    <th
                      key={label}
                      className="text-left px-3 py-2.5 label-text whitespace-nowrap"
                      title={title}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...benchmark].sort((a: any, b: any) => b.benchmark_index - a.benchmark_index).map((s: any, i: number) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-accent/15 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground text-sm">
                      {s.sector}
                    </td>
                    <td className="px-3 py-2.5">
                      <InvestmentSignal s={s} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground">
                      {Number(s.avg_weighted_risk).toFixed(1)}
                    </td>
                    <td className={`px-3 py-2.5 font-mono text-xs font-semibold ${
                      s.composite_sentiment_index >= 0 ? "text-bullish" : "text-bearish"
                    }`}>
                      {s.composite_sentiment_index > 0 ? "+" : ""}{Number(s.composite_sentiment_index).toFixed(1)}
                    </td>
                    <td className={`px-3 py-2.5 font-mono text-xs ${
                      s.sentiment_velocity >= 0 ? "text-bullish" : "text-bearish"
                    }`}>
                      {s.sentiment_velocity > 0 ? "+" : ""}{Number(s.sentiment_velocity).toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      {s.divergence_flag === "High Divergence" ? (
                        <span className="tag bg-warning/15 text-warning">Divergence ⚠</span>
                      ) : (
                        <span className="tag bg-accent/60 text-muted-foreground">Normal</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`tag ${
                        s.risk_level === "HIGH"   ? "bg-bearish/15 text-bearish" :
                        s.risk_level === "MEDIUM" ? "bg-warning/15 text-warning" :
                                                    "bg-bullish/15 text-bullish"
                      }`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-[11px] whitespace-nowrap">
                      {s.sector_classification}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs font-mono">
                      {s.total_mentions}
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
