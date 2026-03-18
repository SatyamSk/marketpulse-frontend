import { DashboardLayout } from "@/components/DashboardLayout";
import { benchmarkData, riskTrendData, correlationMatrix } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, LineChart, Line, Legend, ReferenceLine, Cell
} from "recharts";

const COLORS: Record<string, string> = {
  "Watch Closely": "#ef4444",
  "Opportunity": "#22c55e",
  "Monitor Risk": "#f59e0b",
  "Low Priority": "#6b7280",
};

const scatterData = benchmarkData.map(s => ({
  x: s.avg_impact,
  y: s.avg_weighted_risk,
  z: s.total_mentions * 120,
  sector: s.sector,
  classification: s.sector_classification,
}));

const sectorColors: Record<string, string> = {
  Geopolitics: "#ef4444",
  IT: "#f59e0b",
  Banking: "#22c55e",
  Energy: "#3b82f6",
  FMCG: "#a855f7",
  Startup: "#06b6d4",
  Manufacturing: "#ec4899",
};

// Velocity arrow data
const velocityData = benchmarkData.map(s => ({
  sector: s.sector,
  velocity: s.sentiment_velocity,
})).sort((a, b) => Math.abs(b.velocity) - Math.abs(a.velocity));

const tooltipStyle = { background: "hsl(240 15% 10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" };

export default function SectorWatchlist() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Sector Watchlist</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in fade-in-delay-1">Risk analysis and sentiment tracking across sectors</p>

        {/* Row 1: Risk + NSS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-5 fade-in fade-in-delay-1">
            <h3 className="label-text mb-4">Weighted Risk Score</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={benchmarkData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 60]} tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fill: "#ccc", fontSize: 12 }} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avg_weighted_risk" radius={[0, 4, 4, 0]}>
                  {benchmarkData.map((entry, i) => (
                    <Cell key={i} fill={entry.risk_level === "HIGH" ? "#ef4444" : entry.risk_level === "MEDIUM" ? "#f59e0b" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5 fade-in fade-in-delay-2">
            <h3 className="label-text mb-4">Net Sentiment Score (NSS)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={benchmarkData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[-100, 110]} tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fill: "#ccc", fontSize: 12 }} width={90} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="sentiment_nss" radius={[0, 4, 4, 0]}>
                  {benchmarkData.map((entry, i) => (
                    <Cell key={i} fill={entry.sentiment_nss >= 0 ? "#22c55e" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: BCG + Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-5 fade-in fade-in-delay-3">
            <h3 className="label-text mb-4">BCG Sector Classification</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="Avg Impact" tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Avg Impact →", position: "bottom", fill: "#666", fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Risk Score" tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Risk Score →", angle: -90, position: "insideLeft", fill: "#666", fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[80, 500]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(_: any, __: string, props: any) => {
                    const d = props.payload;
                    return [`${d.sector} · ${d.classification}`, ""];
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.classification] || "#6b7280"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 flex-wrap">
              {Object.entries(COLORS).map(([label, color]) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Sentiment Velocity Arrows */}
          <div className="glass-card p-5 fade-in fade-in-delay-4">
            <h3 className="label-text mb-1">Sentiment Velocity</h3>
            <p className="text-xs text-muted-foreground mb-4">Rate of change of NSS — direction & speed</p>
            <div className="space-y-3">
              {velocityData.map(d => {
                const maxAbs = Math.max(...velocityData.map(v => Math.abs(v.velocity)));
                const widthPct = (Math.abs(d.velocity) / maxAbs) * 100;
                const isPositive = d.velocity >= 0;
                return (
                  <div key={d.sector} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0">{d.sector}</span>
                    <div className="flex-1 flex items-center h-6 relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-px bg-border" />
                      </div>
                      <div className="absolute inset-0 flex items-center" style={{ justifyContent: isPositive ? "flex-start" : "flex-end" }}>
                        <div
                          className={`h-5 rounded-sm flex items-center ${isPositive ? "justify-end pr-1" : "justify-start pl-1"}`}
                          style={{
                            width: `${widthPct}%`,
                            minWidth: 24,
                            background: isPositive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                          }}
                        >
                          <span className={`text-xs font-medium ${isPositive ? "text-bullish" : "text-bearish"}`}>
                            {isPositive ? "→" : "←"} {d.velocity > 0 ? "+" : ""}{d.velocity.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Correlation Matrix */}
        <div className="glass-card p-5 mb-4 fade-in fade-in-delay-4">
          <h3 className="label-text mb-1">Sector Correlation Matrix</h3>
          <p className="text-xs text-muted-foreground mb-4">Pearson correlation of sentiment movements</p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-2" />
                  {correlationMatrix.sectors.map(s => (
                    <th key={s} className="p-2 text-muted-foreground font-medium text-center min-w-[72px]">{s.slice(0, 5)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationMatrix.sectors.map((row, ri) => (
                  <tr key={row}>
                    <td className="p-2 text-muted-foreground font-medium text-right pr-3">{row}</td>
                    {correlationMatrix.values[ri].map((val, ci) => {
                      const abs = Math.abs(val);
                      const bg = val > 0
                        ? `rgba(34,197,94,${abs * 0.5})`
                        : `rgba(239,68,68,${abs * 0.5})`;
                      return (
                        <td key={ci} className="p-2 text-center font-mono" style={{ background: ri === ci ? "rgba(255,255,255,0.05)" : bg }}>
                          <span className="text-foreground">{val.toFixed(2)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scorecard Table */}
        <div className="glass-card overflow-hidden fade-in fade-in-delay-4">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Sector Scorecard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Sector", "Risk", "NSS", "Impact-Wtd", "CSI", "Velocity", "Risk Level", "Classification", "Index"].map(h => (
                    <th key={h} className="text-left p-3 label-text font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benchmarkData.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{s.sector}</td>
                    <td className="p-3">{s.avg_weighted_risk.toFixed(1)}</td>
                    <td className={`p-3 font-medium ${s.sentiment_nss >= 0 ? 'text-bullish' : 'text-bearish'}`}>{s.sentiment_nss.toFixed(1)}</td>
                    <td className={`p-3 ${s.impact_weighted_sentiment >= 0 ? 'text-bullish' : 'text-bearish'}`}>{s.impact_weighted_sentiment.toFixed(1)}</td>
                    <td className={`p-3 font-medium ${s.composite_sentiment_index >= 0 ? 'text-bullish' : 'text-bearish'}`}>{s.composite_sentiment_index.toFixed(1)}</td>
                    <td className={`p-3 ${s.sentiment_velocity >= 0 ? 'text-bullish' : 'text-bearish'}`}>{s.sentiment_velocity > 0 ? '+' : ''}{s.sentiment_velocity.toFixed(1)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.risk_level === 'HIGH' ? 'bg-bearish/15 text-bearish' : s.risk_level === 'MEDIUM' ? 'bg-warning/15 text-warning' : 'bg-bullish/15 text-bullish'}`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.sector_classification}</td>
                    <td className="p-3 font-medium">{s.benchmark_index.toFixed(1)}</td>
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
