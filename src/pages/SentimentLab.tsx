import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter, ZAxis, Cell,
  LineChart, Line, Legend, ReferenceLine, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const TT = {
  background: "hsl(228 18% 7%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#e2e8f0", fontSize: 12,
};

const SECTOR_COLORS: Record<string, string> = {
  Geopolitics: "#ef4444", IT: "#f59e0b",   Banking:       "#22c55e",
  Energy:      "#3b82f6", FMCG: "#a78bfa", Startup:       "#06b6d4",
  Manufacturing:"#f472b6",Healthcare:"#10b981",Fintech:   "#818cf8",
  Retail:      "#fb923c", Other: "#64748b",
};

const TABS = [
  { id: "overview",   label: "Overview"          },
  { id: "divergence", label: "Divergence"        },
  { id: "va",         label: "Valence-Arousal"   },
  { id: "velocity",   label: "Velocity Trend"    },
  { id: "radar",      label: "Sector Radar"      },
];

export default function SentimentLab() {
  const { data, loading, error } = useDashboard();
  const [sector, setSector]           = useState<string>("");
  const [tab, setTab]                 = useState("overview");
  const [sectorDetail, setSectorDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (data?.benchmark?.length && !sector) {
      setSector(data.benchmark[0].sector);
    }
  }, [data]);

  useEffect(() => {
    if (!sector || !data) return;
    setDetailLoading(true);
    api.getSector(sector)
      .then((r: any) => { if (r?.metrics) setSectorDetail(r.metrics); })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [sector, data]);

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

  const activeSector = sectorDetail
    ?? benchmark.find((s: any) => s.sector === sector)
    ?? benchmark[0];

  const divergenceData = benchmark.map((s: any) => ({
    sector:         s.sector,
    nss:            s.sentiment_nss,
    impact_weighted: s.impact_weighted_sentiment,
    csi:            s.composite_sentiment_index,
    divergence:     s.divergence,
    flagged:        s.divergence_flag === "High Divergence",
  }));

  const vaData = benchmark.map((s: any) => ({
    x:      s.valence  ?? 0.5,
    y:      s.arousal  ?? 0.5,
    sector: s.sector,
    z:      s.total_mentions * 130,
    csi:    s.composite_sentiment_index,
  }));

  const radarData = [
    { metric: "NSS",        value: Math.min(100, Math.max(0, (Number(activeSector?.sentiment_nss    ?? 0) + 100) / 2)) },
    { metric: "CSI",        value: Math.min(100, Math.max(0, (Number(activeSector?.composite_sentiment_index ?? 0) + 100) / 2)) },
    { metric: "Confidence", value: Math.min(100, Math.max(0, (Number(activeSector?.confidence_weighted_sentiment ?? 0) + 100) / 2)) },
    { metric: "Valence",    value: Math.round((activeSector?.valence  ?? 0.5) * 100) },
    { metric: "Low Risk",   value: Math.max(0, 100 - Number(activeSector?.avg_weighted_risk ?? 0)) },
    { metric: "Momentum",   value: Math.min(100, Math.max(0, (Number(activeSector?.sentiment_velocity ?? 0) + 30) / 0.6)) },
  ];

  const sectorTrendKeys = Object.keys(SECTOR_COLORS).filter(
    k => velocity_trend?.[0] && k in (velocity_trend[0] as any)
  );

  const quadrant = (valence: number, arousal: number) =>
    valence >= 0.5
      ? arousal >= 0.5 ? "Positive Alarming" : "Positive Calm"
      : arousal >= 0.5 ? "Negative Alarming" : "Negative Calm";

  const quadrantColor: Record<string, string> = {
    "Positive Calm":     "#22c55e",
    "Positive Alarming": "#f59e0b",
    "Negative Calm":     "#64748b",
    "Negative Alarming": "#ef4444",
  };

  const activeSectorColor = SECTOR_COLORS[activeSector?.sector ?? ""] ?? "#64748b";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4">

        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Sentiment Lab</h1>
          <p className="text-xs text-muted-foreground">
            Four sentiment methodologies · All scores Python-calculated · AI used only for headline classification
          </p>
        </div>

        {/* Sector Selector */}
        <div className="flex flex-wrap gap-2 fade-in">
          <span className="text-xs text-muted-foreground self-center mr-1">Sector:</span>
          {benchmark.map((s: any) => (
            <button
              key={s.sector}
              onClick={() => setSector(s.sector)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sector === s.sector
                  ? "text-white shadow-sm"
                  : "bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              style={sector === s.sector ? {
                background: SECTOR_COLORS[s.sector] ?? "#22c55e",
              } : {}}
            >
              {s.sector}
            </button>
          ))}
          {detailLoading && (
            <span className="text-xs text-muted-foreground self-center ml-2">Loading...</span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-accent/30 rounded-xl w-fit flex-wrap fade-in">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-4 fade-in">
            {/* 4 method cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label:    "Net Sentiment Score",
                  subLabel: "(%pos − %neg) × 100",
                  key:      "sentiment_nss",
                  desc:     "Simple headline count ratio. Fast but equal-weight.",
                },
                {
                  label:    "Impact-Weighted",
                  subLabel: "Impact-score weighted",
                  key:      "impact_weighted_sentiment",
                  desc:     "High-impact headlines count more. Better than NSS for volatile days.",
                },
                {
                  label:    "Confidence-Weighted",
                  subLabel: "AI certainty weighted",
                  key:      "confidence_weighted_sentiment",
                  desc:     "Ambiguous AI classifications carry less weight. Reduces noise.",
                },
                {
                  label:    "Composite Index (CSI)",
                  subLabel: "25% NSS · 50% IWS · 25% CWS",
                  key:      "composite_sentiment_index",
                  desc:     "Most reliable single sentiment number. Use this for trading decisions.",
                },
              ].map(({ label, subLabel, key, desc }) => {
                const val = Number(activeSector?.[key] ?? 0);
                const isPos = val >= 0;
                return (
                  <div key={key} className="glass-card p-4" title={desc}>
                    <p className="label-text mb-0.5">{label}</p>
                    <p className="text-[10px] text-muted-foreground mb-3">{subLabel}</p>
                    <p className={`text-2xl font-semibold font-mono ${
                      isPos ? "text-bullish" : "text-bearish"
                    }`}>
                      {val > 0 ? "+" : ""}{val.toFixed(1)}
                    </p>
                    <div className={`mt-2 h-0.5 rounded-full ${isPos ? "bg-bullish/30" : "bg-bearish/30"}`}>
                      <div
                        className={`h-full rounded-full ${isPos ? "bg-bullish" : "bg-bearish"}`}
                        style={{ width: `${Math.min(Math.abs(val), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional sector stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Velocity",   value: `${Number(activeSector?.sentiment_velocity ?? 0) > 0 ? "+" : ""}${Number(activeSector?.sentiment_velocity ?? 0).toFixed(1)}`,  color: Number(activeSector?.sentiment_velocity ?? 0) >= 0 ? "text-bullish" : "text-bearish", title: "Rate of CSI change since last run" },
                { label: "Risk Score", value: Number(activeSector?.avg_weighted_risk ?? 0).toFixed(1), color: Number(activeSector?.avg_weighted_risk ?? 0) >= 50 ? "text-bearish" : Number(activeSector?.avg_weighted_risk ?? 0) >= 25 ? "text-warning" : "text-bullish", title: "Weighted risk 0–100" },
                { label: "Divergence", value: Number(activeSector?.divergence ?? 0).toFixed(1),        color: activeSector?.divergence_flag === "High Divergence" ? "text-warning" : "text-muted-foreground", title: "Gap between NSS and impact-weighted score" },
                { label: "Mentions",   value: activeSector?.total_mentions ?? 0,                        color: "text-foreground", title: "Headlines today" },
              ].map(({ label, value, color, title }) => (
                <div key={label} className="glass-card p-4" title={title}>
                  <p className="label-text mb-2">{label}</p>
                  <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Headline breakdown for sector */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60">
                <h3 className="label-text">
                  {activeSector?.sector ?? "Sector"} Headlines — Sentiment Breakdown
                </h3>
              </div>
              <div className="p-4">
                <div className="flex gap-4 text-xs mb-4">
                  {[
                    { label: "Positive", count: activeSector?.positive_count ?? 0, color: "#22c55e" },
                    { label: "Neutral",  count: activeSector?.neutral_count  ?? 0, color: "#f59e0b" },
                    { label: "Negative", count: activeSector?.negative_count ?? 0, color: "#ef4444" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="text-foreground font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
                {/* Visual breakdown bar */}
                {(() => {
                  const pos = activeSector?.positive_count ?? 0;
                  const neu = activeSector?.neutral_count  ?? 0;
                  const neg = activeSector?.negative_count ?? 0;
                  const total = pos + neu + neg;
                  if (total === 0) return null;
                  return (
                    <div className="h-3 rounded-full overflow-hidden flex">
                      <div style={{ width: `${(pos/total)*100}%`, background: "#22c55e" }} />
                      <div style={{ width: `${(neu/total)*100}%`, background: "#f59e0b" }} />
                      <div style={{ width: `${(neg/total)*100}%`, background: "#ef4444" }} />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── DIVERGENCE ── */}
        {tab === "divergence" && (
          <div className="space-y-3 fade-in">
            <div className="glass-card p-4">
              <h3 className="label-text mb-0.5">NSS vs Impact-Weighted Divergence</h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                When bars point in opposite directions: mild positives are masking severe negatives (or vice versa) — hidden risk signal
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={divergenceData} layout="vertical" margin={{ lef
