import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { useDashboard } from "@/hooks/useDashboard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, ZAxis, Cell, LineChart, Line, Legend, ReferenceLine } from "recharts";

const tooltipStyle = { background: "hsl(240 15% 8%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 };
const SECTOR_COLORS: Record<string, string> = { Geopolitics: "#ef4444", IT: "#f59e0b", Banking: "#22c55e", Energy: "#3b82f6", FMCG: "#a855f7", Startup: "#06b6d4", Manufacturing: "#ec4899", Healthcare: "#10b981", Fintech: "#8b5cf6", Retail: "#f97316", Other: "#64748b" };

export default function SentimentLab() {
  const { data, loading, error } = useDashboard();
  const [selectedSector, setSelectedSector] = useState<string>("");

  useEffect(() => {
    if (data?.benchmark?.length && !selectedSector) {
      setSelectedSector(data.benchmark[0].sector);
    }
  }, [data]);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading sentiment data...</div></DashboardLayout>;
  if (error || !data) return <DashboardLayout><div className="glass-card p-6 text-sm text-bearish">{error ?? "No data"}</div></DashboardLayout>;

  const { benchmark, velocity_trend } = data;
  const activeSector = benchmark.find((s: any) => s.sector === selectedSector) ?? benchmark[0];
  
  const divergenceData = benchmark.map((s: any) => ({ sector: s.sector, nss: s.sentiment_nss, impact_weighted: s.impact_weighted_sentiment, divergence: s.divergence, flagged: s.divergence_flag === "High Divergence" }));
  const vaData = benchmark.map((s: any) => ({ x: s.valence, y: s.arousal, sector: s.sector, z: s.total_mentions * 120, csi: s.composite_sentiment_index }));

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">Sentiment Lab</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in">Four sentiment methodologies applied to live news data</p>

        <div className="flex items-center gap-3 mb-4 flex-wrap fade-in">
          <span className="text-xs text-muted-foreground">Analyzing:</span>
          {benchmark.map((s: any) => (
            <button key={s.sector} onClick={() => setSelectedSector(s.sector)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedSector === s.sector ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"}`}>
              {s.sector}
            </button>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-3 fade-in">Sentiment Method Comparison — {selectedSector}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Net Sentiment Score (NSS)" value={`${activeSector.sentiment_nss > 0 ? "+" : ""}${activeSector.sentiment_nss.toFixed(1)}`} colorClass={activeSector.sentiment_nss >= 0 ? "text-bullish" : "text-bearish"} />
          <MetricCard label="Impact-Weighted" value={`${activeSector.impact_weighted_sentiment > 0 ? "+" : ""}${activeSector.impact_weighted_sentiment.toFixed(1)}`} colorClass={activeSector.impact_weighted_sentiment >= 0 ? "text-bullish" : "text-bearish"} />
          <MetricCard label="Confidence-Weighted" value={`${activeSector.confidence_weighted_sentiment > 0 ? "+" : ""}${activeSector.confidence_weighted_sentiment.toFixed(1)}`} colorClass={activeSector.confidence_weighted_sentiment >= 0 ? "text-bullish" : "text-bearish"} />
          <MetricCard label="Composite Index (CSI)" value={`${activeSector.composite_sentiment_index > 0 ? "+" : ""}${activeSector.composite_sentiment_index.toFixed(1)}`} colorClass={activeSector.composite_sentiment_index >= 0 ? "text-bullish" : "text-bearish"} />
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-1 fade-in">Sentiment Divergence</h2>
        <div className="glass-card p-5 mb-8 fade-in">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={divergenceData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis type="category" dataKey="sector" tick={{ fill: "#94a3b8", fontSize: 12 }} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.25)" />
              <Bar dataKey="nss" name="NSS" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="impact_weighted" name="Impact-Weighted" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={10} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h2 className="text-sm font-semibold text-foreground mb-1 fade-in">Valence-Arousal Map</h2>
        <div className="glass-card p-5 mb-8 fade-in">
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ bottom: 30, left: 20, right: 20, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" name="Valence" domain={[0, 1]} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Arousal" domain={[0, 1]} tick={{ fill: "#64748b", fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[100, 600]} />
              <ReferenceLine x={0.5} stroke="rgba(255,255,255,0.12)" />
              <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.12)" />
              <Tooltip contentStyle={tooltipStyle} formatter={(_: any, __: any, props: any) => [`${props.payload.sector}`, ""]} />
              <Scatter data={vaData}>
                {vaData.map((entry: any, i: number) => <Cell key={i} fill={SECTOR_COLORS[entry.sector] || "#64748b"} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
