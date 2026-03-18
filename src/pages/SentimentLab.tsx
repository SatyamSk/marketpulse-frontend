import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis, Cell,
  LineChart, Line, Legend, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const TT = {
  background: "hsl(228 18% 7%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#e2e8f0", fontSize: 12,
};

const SECTOR_COLORS: Record<string, string> = {
  Geopolitics:   "#ef4444", IT:      "#f59e0b",
  Banking:       "#22c55e", Energy:  "#3b82f6",
  FMCG:          "#a78bfa", Startup: "#06b6d4",
  Manufacturing: "#f472b6", Healthcare: "#10b981",
  Fintech:       "#818cf8", Retail:  "#fb923c",
  Other:         "#64748b",
};

const TABS = [
  { id: "radar",      label: "Radar Profile"     },
  { id: "overview",   label: "Score Comparison"  },
  { id: "divergence", label: "Divergence"        },
  { id: "va",         label: "Valence-Arousal"   },
  { id: "velocity",   label: "Velocity Trend"    },
];

const quadrant = (v: number, a: number) =>
  v >= 0.5
    ? a >= 0.5 ? "Positive Alarming" : "Positive Calm"
    : a >= 0.5 ? "Negative Alarming" : "Negative Calm";

const quadrantColor: Record<string, string> = {
  "Positive Calm":     "#22c55e",
  "Positive Alarming": "#f59e0b",
  "Negative Calm":     "#64748b",
  "Negative Alarming": "#ef4444",
};

export default function SentimentLab() {
  const { data, loading, error } = useDashboard();
  const [sector, setSector]           = useState<string>("");
  const [tab, setTab]                 = useState("radar");   // radar is default
  const [sectorDetail, setSectorDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Auto-select first sector
  useEffect(() => {
    if (data?.benchmark?.length && !sector) {
      setSector(data.benchmark[0].sector);
    }
  }, [data]);

  // Fetch sector detail whenever sector changes
  useEffect(() => {
    if (!sector || !data) return;
    setDetailLoading(true);
    api.getSector(sector)
      .then((r: any) => {
        if (r?.metrics) setSectorDetail(r.metrics);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [sector]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading sentiment data...
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout>
      <div className="glass-card p-6 text-sm text-bearish">{error ?? "No data"}</div>
    </DashboardLayout>
  );

  const { benchmark, velocity_trend } = data;

  // Active sector — prefer fresh detail from API, fallback to benchmark
  const activeSector: any =
    sectorDetail ??
    benchmark.find((s: any) => s.sector === sector) ??
    benchmark[0];

  const sectorColor = SECTOR_COLORS[activeSector?.sector ?? ""] ?? "#22c55e";

  // ── Derived data — all recalculate when sector changes ──

  const radarData = [
    { metric: "NSS",        value: Math.min(100, Math.max(0, (Number(activeSector?.sentiment_nss ?? 0) + 100) / 2)) },
    { metric: "CSI",        value: Math.min(100, Math.max(0, (Number(activeSector?.composite_sentiment_index ?? 0) + 100) / 2)) },
    { metric: "Confidence", value: Math.min(100, Math.max(0, (Number(activeSector?.confidence_weighted_sentiment ?? 0) + 100) / 2)) },
    { metric: "Valence",    value: Math.round((activeSector?.valence ?? 0.5) * 100) },
    { metric: "Low Risk",   value: Math.max(0, 100 - Number(activeSector?.avg_weighted_risk ?? 0)) },
    { metric: "Momentum",   value: Math.min(100, Math.max(0, (Number(activeSector?.sentiment_velocity ?? 0) + 30) / 0.6)) },
  ];

  const divergenceData = benchmark.map((s: any) => ({
    sector:          s.sector,
    nss:             s.sentiment_nss,
    impact_weighted: s.impact_weighted_sentiment,
    divergence:      s.divergence,
    flagged:         s.divergence_flag === "High Divergence",
    // Highlight selected sector
    isSelected:      s.sector === sector,
  }));

  const vaData = benchmark.map((s: any) => ({
    x:      s.valence  ?? 0.5,
    y:      s.arousal  ?? 0.5,
    sector: s.sector,
    z:      s.total_mentions * 130,
    csi:    s.composite_sentiment_index,
    isSelected: s.sector === sector,
  }));

  const sectorTrendKeys = Object.keys(SECTOR_COLORS).filter(
    k => velocity_trend?.[0] && k in (velocity_trend[0] as any)
  );

  const scoreComparisonData = [
    { name: "NSS",         value: Number(activeSector?.sentiment_nss ?? 0) },
    { name: "Impact-Wtd",  value: Number(activeSector?.impact_weighted_sentiment ?? 0) },
    { name: "Conf-Wtd",    value: Number(activeSector?.confidence_weighted_sentiment ?? 0) },
    { name: "CSI",         value: Number(activeSector?.composite_sentiment_index ?? 0) },
  ];

  const pos   = activeSector?.positive_count ?? 0;
  const neu   = activeSector?.neutral_count  ?? 0;
  const neg   = activeSector?.negative_count ?? 0;
  const total = pos + neu + neg;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Sentiment Lab</h1>
          <p className="text-xs text-muted-foreground">
            Multi-dimensional sentiment analysis · All scores Python-calculated · AI classifies only
          </p>
        </div>

        {/* Sector selector */}
        <div className="flex flex-wrap gap-2 fade-in">
          <span className="text-xs text-muted-foreground self-center">Sector:</span>
          {benchmark.map((s: any) => (
            <button
              key={s.sector}
              onClick={() => setSector(s.sector)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                sector === s.sector
                  ? { background: SECTOR_COLORS[s.sector] ?? "#22c55e", color: "#fff" }
                  : { background: "rgba(255,255,255,0.05)", color: "#94a3b8" }
              }
            >
              {s.sector}
            </button>
          ))}
          {detailLoading && (
            <span className="text-[11px] text-muted-foreground self-center ml-1">
              Loading...
            </span>
          )}
        </div>

        {/* Active sector summary strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border fade-in"
          style={{
            background: `${sectorColor}08`,
            borderColor: `${sectorColor}30`,
          }}
        >
          {[
            { label: "Sector",    value: activeSector?.sector ?? "—",                         isColor: false },
            { label: "CSI",       value: `${Number(activeSector?.composite_sentiment_index ?? 0) > 0 ? "+" : ""}${Number(activeSector?.composite_sentiment_index ?? 0).toFixed(1)}`, isColor: true, positive: Number(activeSector?.composite_sentiment_index ?? 0) >= 0 },
            { label: "Risk",      value: Number(activeSector?.avg_weighted_risk ?? 0).toFixed(1), isColor: false },
            { label: "Signal",    value: (() => {
              const csi = Number(activeSector?.composite_sentiment_index ?? 0);
              const risk = Number(activeSector?.avg_weighted_risk ?? 0);
              const vel  = Number(activeSector?.sentiment_velocity ?? 0);
              if (csi > 30 && risk < 25 && vel > 0) return "BUY BIAS";
              if (csi < -20 || (risk > 50 && vel < 0)) return "AVOID";
              if (activeSector?.divergence_flag === "High Divergence") return "CAUTION";
              if (vel > 5 && csi > 0) return "IMPROVING";
              return "NEUTRAL";
            })(), isColor: false },
          ].map(({ label, value, isColor, positive }) => (
            <div key={label}>
              <p className="label-text mb-1">{label}</p>
              <p className={`text-sm font-semibold ${
                isColor
                  ? (positive ? "text-bullish" : "text-bearish")
                  : "text-foreground"
              }`} style={label === "Sector" ? { color: sectorColor } : {}}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit flex-wrap fade-in"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={tab === t.id
                ? { background: sectorColor, color: "#fff" }
                : { color: "#64748b" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── RADAR (default) ── */}
        {tab === "radar" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in">
            <div className="glass-card p-5">
              <h3 className="label-text mb-0.5">
                {activeSector?.sector} — Multi-Dimensional Profile
              </h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                Normalized 0–100 · Higher area = stronger overall signal · All Python-calculated
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name={activeSector?.sector ?? "Sector"}
                    dataKey="value"
                    stroke={sectorColor}
                    fill={sectorColor}
                    fillOpacity={0.22}
                    strokeWidth={2}
                  />
                  <Tooltip contentStyle={TT} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension breakdown bars */}
            <div className="glass-card p-5">
              <h3 className="label-text mb-4">Dimension Breakdown</h3>
              <div className="space-y-3">
                {radarData.map(({ metric, value }) => (
                  <div key={metric}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{metric}</span>
                      <span className="font-mono font-semibold text-foreground">
                        {value.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${value}%`,
                          background: value >= 60 ? sectorColor :
                                      value >= 40 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Headline breakdown */}
              {total > 0 && (
                <div className="mt-5 pt-4 border-t border-border/40">
                  <h3 className="label-text mb-3">Headline Breakdown</h3>
                  <div className="flex gap-3 text-xs mb-2 flex-wrap">
                    {[
                      { label: "Positive", count: pos, color: "#22c55e" },
                      { label: "Neutral",  count: neu, color: "#f59e0b" },
                      { label: "Negative", count: neg, color: "#ef4444" },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="text-foreground font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex">
                    <div style={{ width: `${(pos/total)*100}%`, background: "#22c55e" }} />
                    <div style={{ width: `${(neu/total)*100}%`, background: "#f59e0b" }} />
                    <div style={{ width: `${(neg/total)*100}%`, background: "#ef4444" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCORE COMPARISON ── */}
        {tab === "overview" && (
          <div className="space-y-4 fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Net Sentiment Score", sub: "(%pos − %neg) × 100",         key: "sentiment_nss"                  },
                { label: "Impact-Weighted",      sub: "High-impact weighted more",    key: "impact_weighted_sentiment"      },
                { label: "Confidence-Weighted",  sub: "AI certainty weighted",        key: "confidence_weighted_sentiment"  },
                { label: "Composite CSI",        sub: "25% NSS · 50% IWS · 25% CWS", key: "composite_sentiment_index"      },
              ].map(({ label, sub, key }) => {
                const val   = Number(activeSector?.[key] ?? 0);
                const isPos = val >= 0;
                return (
                  <div key={key} className="glass-card p-4">
                    <p className="label-text mb-0.5">{label}</p>
                    <p className="text-[10px] text-muted-foreground mb-3">{sub}</p>
                    <p className={`text-2xl font-semibold font-mono ${isPos ? "text-bullish" : "text-bearish"}`}>
                      {val > 0 ? "+" : ""}{val.toFixed(1)}
                    </p>
                    <div className={`mt-2 h-1 rounded-full ${isPos ? "bg-bullish/20" : "bg-bearish/20"}`}>
                      <div
                        className={`h-full rounded-full transition-all ${isPos ? "bg-bullish" : "bg-bearish"}`}
                        style={{ width: `${Math.min(Math.abs(val), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar comparison chart */}
            <div className="glass-card p-4">
              <h3 className="label-text mb-1">
                {activeSector?.sector} — Score Comparison Chart
              </h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                All four sentiment methods side by side for {activeSector?.sector}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreComparisonData} margin={{ top: 4, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis domain={[-100, 100]} tick={{ fill: "#64748b", fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={TT} formatter={(v: any) => [`${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(1)}`, "Score"]} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {scoreComparisonData.map((e, i) => (
                      <Cell key={i} fill={e.value >= 0 ? sectorColor : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DIVERGENCE ── */}
        {tab === "divergence" && (
          <div className="space-y-4 fade-in">
            <div className="glass-card p-4">
              <h3 className="label-text mb-0.5">NSS vs Impact-Weighted Divergence</h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                When bars point in opposite directions: mild positives masking severe negatives
                — hidden risk signal · {activeSector?.sector} highlighted
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={divergenceData}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" domain={[-100, 110]} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <YAxis type="category" dataKey="sector"
                    tick={({ x, y, payload }: any) => (
                      <text
                        x={x} y={y} dy={4}
                        textAnchor="end"
                        fontSize={11}
                        fill={payload.value === sector ? sectorColor : "#94a3b8"}
                        fontWeight={payload.value === sector ? 600 : 400}
                      >
                        {payload.value}
                      </text>
                    )}
                    width={88}
                  />
                  <Tooltip contentStyle={TT} formatter={(v: any, name: string) => [
                    `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(1)}`, name
                  ]} />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                  <Bar dataKey="nss" name="NSS" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={9} />
                  <Bar dataKey="impact_weighted" name="Impact-Weighted" fill="#a78bfa" radius={[0, 3, 3, 0]} barSize={9} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {divergenceData.some((d: any) => d.flagged) && (
              <div className="p-4 rounded-xl border border-warning/25 bg-warning/5">
                <p className="text-xs font-semibold text-warning mb-1">High Divergence Detected</p>
                <p className="text-xs text-muted-foreground mb-2">
                  These sectors have NSS and Impact-Weighted scores pointing in opposite directions.
                  Surface sentiment is misleading.
                </p>
                <div className="flex flex-wrap gap-2">
                  {divergenceData.filter((d: any) => d.flagged).map((d: any) => (
                    <span key={d.sector} className="tag bg-warning/15 text-warning">
                      {d.sector} Δ{Number(d.divergence).toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VALENCE-AROUSAL ── */}
        {tab === "va" && (
          <div className="space-y-4 fade-in">
            <div className="glass-card p-4">
              <h3 className="label-text mb-0.5">Valence-Arousal Map</h3>
              <p className="text-[10px] text-muted-foreground mb-3">
                Two-dimensional sentiment · {activeSector?.sector} highlighted
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
                {[
                  { q: "Positive Calm",     color: "#22c55e", desc: "Steady bullish. Accumulation zone."       },
                  { q: "Positive Alarming", color: "#f59e0b", desc: "Euphoric/volatile. Watch for reversal."   },
                  { q: "Negative Calm",     color: "#64748b", desc: "Slow deterioration. Monitor closely."     },
                  { q: "Negative Alarming", color: "#ef4444", desc: "Panic/crisis. Reduce exposure."           },
                ].map(({ q, color, desc }) => (
                  <div key={q} className="flex gap-2">
                    <div className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ background: color }} ></div>
                    <div>
                      <p className="font-semibold text-foreground">{q}</p>
                      <p className="text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ bottom: 28, left: 0, right: 20, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" dataKey="x" name="Valence" domain={[0, 1]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    label={{ value: "Valence (Negative ← → Positive)", position: "bottom", fill: "#475569", fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="Arousal" domain={[0, 1]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    label={{ value: "Arousal (Calm ← → Alarming)", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10 }}
                    width={28} />
                  <ZAxis type="number" dataKey="z" range={[80, 480]} />
                  <ReferenceLine x={0.5} stroke="rgba(255,255,255,0.1)" />
                  <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.1)" />
                  <Tooltip contentStyle={TT}
                    formatter={(_: any, __: any, props: any) => {
                      const d = props.payload;
                      return [`${d.sector} — ${quadrant(d.x, d.y)}\nCSI: ${d.csi > 0 ? "+" : ""}${Number(d.csi).toFixed(1)}`, ""];
                    }}
                  />
                  <Scatter data={vaData}
                    label={{ dataKey: "sector", fill: "#94a3b8", fontSize: 9 }}>
                    {vaData.map((e: any, i: number) => (
                      <Cell key={i}
                        fill={quadrantColor[quadrant(e.x, e.y)] ?? "#64748b"}
                        opacity={e.sector === sector ? 1 : 0.35}
                        strokeWidth={e.sector === sector ? 2 : 0}
                        stroke={e.sector === sector ? "#fff" : "none"}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── VELOCITY TREND ── */}
        {tab === "velocity" && (
          <div className="space-y-4 fade-in">
            <div className="glass-card p-4">
              <h3 className="label-text mb-0.5">CSI Velocity Trend</h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                3-day moving average · {activeSector?.sector} highlighted · Falling = deteriorating momentum
              </p>
              {velocity_trend && velocity_trend.length > 1 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={velocity_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="run" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} width={28} />
                    <Tooltip contentStyle={TT} />
                    <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />
                    {sectorTrendKeys.map(s => (
                      <Line
                        key={s}
                        type="monotone"
                        dataKey={s}
                        stroke={SECTOR_COLORS[s] ?? "#64748b"}
                        strokeWidth={s === sector ? 3 : 1}
                        strokeOpacity={s === sector ? 1 : 0.3}
                        dot={s === sector ? { r: 4, fill: SECTOR_COLORS[s] } : false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                  Run the pipeline on multiple days to see trend data.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
