import { useState, useEffect } from "react";
import { Target, TrendingUp, ShieldCheck, Database, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { AccuracyData } from "@/lib/types";

export default function AccuracyDashboard() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAccuracy()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="skeleton h-96" />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No accuracy data yet. Run the pipeline and backtest first.</p>
        </div>
      </div>
    </DashboardLayout>
  );

  const acc7 = data?.accuracy_7d;
  const acc30 = data?.accuracy_30d;
  const acc90 = data?.accuracy_90d;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 space-y-8 fade-in">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
            <Target className="w-3.5 h-3.5" />
            Model Performance
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
            Prediction Accuracy
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            How well do our morning regime predictions match actual Nifty 50 performance? Updated daily after market close.
          </p>
        </div>

        {/* Accuracy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in-delay-1">
          {[
            { label: "7-Day", stats: acc7, color: "primary" },
            { label: "30-Day", stats: acc30, color: "bullish" },
            { label: "90-Day", stats: acc90, color: "warning" },
          ].map((item, i) => (
            <div key={i} className={`glass-card-hover p-6 space-y-3 ${
              item.stats && item.stats.accuracy >= 65 ? "metric-glow-bullish" :
              item.stats && item.stats.accuracy >= 50 ? "metric-glow-primary" : ""
            }`}>
              <p className="label-text">{item.label} Accuracy</p>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${
                  item.stats && item.stats.accuracy >= 65 ? "text-bullish" :
                  item.stats && item.stats.accuracy >= 50 ? "text-primary" :
                  item.stats && item.stats.accuracy > 0 ? "text-bearish" : "text-muted-foreground"
                }`}>
                  {item.stats?.accuracy || 0}%
                </span>
                <span className="text-xs text-muted-foreground pb-1">
                  {item.stats?.correct || 0}/{item.stats?.total || 0} correct
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.stats && item.stats.accuracy >= 65 ? "bg-bullish" :
                    item.stats && item.stats.accuracy >= 50 ? "bg-primary" : "bg-bearish"
                  }`}
                  style={{ width: `${Math.min(item.stats?.accuracy || 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Source Reliability Leaderboard */}
        <div className="glass-card p-6 space-y-4 fade-in-delay-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Source Reliability Scores</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Dynamic reliability scores calibrated from prediction accuracy. Official sources (PIB, RBI, SEBI) have a base boost.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data?.source_reliability?.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.is_official ? "bg-primary" : "bg-muted-foreground"}`} />
                  <span className="text-sm text-foreground">{s.source_name}</span>
                  {s.is_official && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">OFFICIAL</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{s.total_headlines} headlines</span>
                  <span className={`text-sm font-bold ${
                    s.reliability_score >= 1.3 ? "text-bullish" :
                    s.reliability_score >= 1.0 ? "text-foreground" : "text-bearish"
                  }`}>
                    {s.reliability_score.toFixed(2)}×
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Weights */}
        <div className="glass-card p-6 space-y-4 fade-in-delay-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Dynamic Sector Weights</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Sector weights are recalibrated weekly based on prediction accuracy. Higher weight = more influence on regime classification.
          </p>
          <div className="flex flex-wrap gap-2">
            {data?.dynamic_weights && Object.entries(data.dynamic_weights)
              .sort(([,a], [,b]) => b - a)
              .map(([sector, weight]) => (
                <div key={sector} className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-sm text-foreground font-medium">{sector}</span>
                  <span className={`ml-2 text-sm font-bold ${weight >= 1.3 ? "text-bullish" : weight >= 1.0 ? "text-primary" : "text-muted-foreground"}`}>
                    {weight.toFixed(2)}×
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent Predictions */}
        {acc30?.predictions && acc30.predictions.length > 0 && (
          <div className="glass-card p-6 space-y-4 fade-in-delay-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Recent Predictions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 label-text">Date</th>
                    <th className="text-left py-2 px-3 label-text">Regime</th>
                    <th className="text-right py-2 px-3 label-text">Nifty Change</th>
                    <th className="text-center py-2 px-3 label-text">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {acc30.predictions.slice(0, 15).map((p, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground">{p.date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          p.predicted_regime === "Risk On" ? "regime-risk-on" :
                          p.predicted_regime === "Panic" ? "regime-panic" :
                          p.predicted_regime === "Complacent" ? "regime-complacent" : "regime-risk-off"
                        }`}>
                          {p.predicted_regime}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-medium ${
                        (p.actual_nifty_change_pct || 0) > 0 ? "text-bullish" : "text-bearish"
                      }`}>
                        {p.actual_nifty_change_pct != null ? `${p.actual_nifty_change_pct > 0 ? "+" : ""}${p.actual_nifty_change_pct}%` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {p.was_regime_correct != null ? (
                          p.was_regime_correct
                            ? <span className="text-bullish text-xs font-bold">✓</span>
                            : <span className="text-bearish text-xs font-bold">✗</span>
                        ) : <span className="text-muted-foreground text-xs">pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
