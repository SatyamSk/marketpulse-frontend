import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { benchmarkData, velocityTrend } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Cell, LineChart, Line, Legend, ReferenceLine
} from "recharts";

// Use Banking as the example sector for comparison cards
const exampleSector = benchmarkData.find(s => s.sector === "Banking")!;

const tooltipStyle = { background: "hsl(240 15% 10%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" };

// Divergence data
const divergenceData = benchmarkData.map(s => ({
  sector: s.sector,
  nss: s.sentiment_nss,
  impact_weighted: s.impact_weighted_sentiment,
  divergence: Math.abs(s.sentiment_nss - s.impact_weighted_sentiment),
  hasDivergence: (s.sentiment_nss >= 0) !== (s.impact_weighted_sentiment >= 0),
}));

// Valence-Arousal data
const vaData = benchmarkData.map(s => ({
  x: s.valence,
  y: s.arousal,
  sector: s.sector,
  z: s.total_mentions * 120,
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

export default function SentimentLab() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Sentiment Lab</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in fade-in-delay-1">Analytical depth behind the sentiment numbers</p>

        {/* Section 1: Method Comparison */}
        <h2 className="text-sm font-semibold text-foreground mb-3 fade-in fade-in-delay-1">Sentiment Method Comparison — {exampleSector.sector}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Net Sentiment Score"
            value={`${exampleSector.sentiment_nss > 0 ? '+' : ''}${exampleSector.sentiment_nss.toFixed(1)}`}
            colorClass={exampleSector.sentiment_nss >= 0 ? "text-bullish" : "text-bearish"}
            delay={1}
          />
          <MetricCard
            label="Impact-Weighted"
            value={`${exampleSector.impact_weighted_sentiment > 0 ? '+' : ''}${exampleSector.impact_weighted_sentiment.toFixed(1)}`}
            colorClass={exampleSector.impact_weighted_sentiment >= 0 ? "text-bullish" : "text-bearish"}
            delay={2}
          />
          <MetricCard
            label="Confidence-Weighted"
            value={`${exampleSector.confidence_weighted_sentiment > 0 ? '+' : ''}${exampleSector.confidence_weighted_sentiment.toFixed(1)}`}
            colorClass={exampleSector.confidence_weighted_sentiment >= 0 ? "text-bullish" : "text-bearish"}
            delay={3}
          />
          <MetricCard
            label="Composite Index (CSI)"
            value={`${exampleSector.composite_sentiment_index > 0 ? '+' : ''}${exampleSector.composite_sentiment_index.toFixed(1)}`}
            colorClass={exampleSector.composite_sentiment_index >= 0 ? "text-bullish" : "text-bearish"}
            delay={4}
          />
        </div>

        {/* Section 2: Divergence */}
        <h2 className="text-sm font-semibold text-foreground mb-3 fade-in fade-in-delay-2">Sentiment Divergence — NSS vs Impact-Weighted</h2>
        <p className="text-xs text-muted-foreground mb-4 fade-in fade-in-delay-2">Where bars point opposite directions, mild positives may be masking severe negatives (or vice versa)</p>
        <div className="glass-card p-5 mb-8 fade-in fade-in-delay-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={divergenceData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[-100, 110]} tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis type="category" dataKey="sector" tick={{ fill: "#ccc", fontSize: 12 }} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
              <Bar dataKey="nss" name="NSS" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="impact_weighted" name="Impact-Weighted" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={12} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Section 3: Valence-Arousal */}
        <h2 className="text-sm font-semibold text-foreground mb-3 fade-in fade-in-delay-3">Valence-Arousal Map</h2>
        <p className="text-xs text-muted-foreground mb-4 fade-in fade-in-delay-3">Two-dimensional sentiment: Positive/Negative × Calm/Alarming</p>
        <div className="glass-card p-5 mb-8 fade-in fade-in-delay-3">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ bottom: 20, left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" name="Valence" domain={[0, 1]} tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Valence (Negative ← → Positive)", position: "bottom", fill: "#666", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Arousal" domain={[0, 1]} tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Arousal (Calm ← → Alarming)", angle: -90, position: "insideLeft", fill: "#666", fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[100, 500]} />
              <ReferenceLine x={0.5} stroke="rgba(255,255,255,0.15)" />
              <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.15)" />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(_: any, __: string, props: any) => {
                  const d = props.payload;
                  const quadrant = d.x >= 0.5
                    ? (d.y >= 0.5 ? "Positive Alarming" : "Positive Calm")
                    : (d.y >= 0.5 ? "Negative Alarming" : "Negative Calm");
                  return [`${d.sector} — ${quadrant}`, ""];
                }}
              />
              <Scatter data={vaData}>
                {vaData.map((entry, i) => (
                  <Cell key={i} fill={sectorColors[entry.sector] || "#6b7280"} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
            <div className="text-left">↙ Negative Calm (slow deterioration)</div>
            <div className="text-right">↘ Positive Calm (steady bullish)</div>
            <div className="text-left">↖ Negative Alarming (panic/crisis)</div>
            <div className="text-right">↗ Positive Alarming (euphoric/volatile)</div>
          </div>
        </div>

        {/* Section 4: Velocity Over Time */}
        <h2 className="text-sm font-semibold text-foreground mb-3 fade-in fade-in-delay-4">Sentiment Velocity Over Time</h2>
        <p className="text-xs text-muted-foreground mb-4 fade-in fade-in-delay-4">Composite Sentiment Index trend across last 5 pipeline runs</p>
        <div className="glass-card p-5 fade-in fade-in-delay-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={velocityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="run" tick={{ fill: "#888", fontSize: 11 }} label={{ value: "Pipeline Run", position: "bottom", fill: "#666", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              {Object.keys(sectorColors).map(sector => (
                <Line key={sector} type="monotone" dataKey={sector} stroke={sectorColors[sector]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
