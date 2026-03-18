import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Play, RefreshCw, CheckCircle, AlertCircle, Clock, Database } from "lucide-react";

export default function Admin() {
  const [secret, setSecret]         = useState("");
  const [running, setRunning]       = useState(false);
  const [message, setMessage]       = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [status, setStatus]         = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const s = await api.pipelineStatus();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerPipeline = async () => {
    if (!secret.trim()) {
      setMessage("Enter your pipeline secret key first.");
      setMessageType("error");
      return;
    }
    setRunning(true);
    setMessage(null);
    try {
      const result = await api.triggerPipeline(secret);
      setMessage(result.message);
      setMessageType("success");
      // Refresh status after 10s
      setTimeout(loadStatus, 10000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? "Failed to trigger pipeline.";
      if (typeof detail === "string" && detail.includes("Invalid secret")) {
        setMessage("Wrong secret key. Check your .env file.");
      } else {
        setMessage(typeof detail === "string" ? detail : "Pipeline trigger failed.");
      }
      setMessageType("error");
    } finally {
      setRunning(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
    if (diff < 1)  return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    return d.toLocaleDateString("en-IN");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Pipeline Control</h1>
          <p className="text-xs text-muted-foreground">
            Manually trigger news fetch and analysis
          </p>
        </div>

        {/* Status Card */}
        <div className="glass-card p-5 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="label-text">Pipeline Status</h3>
            <button
              onClick={loadStatus}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {status ? (
            <div className="space-y-3">
              {/* Running indicator */}
              {status.is_running && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    Pipeline is currently running...
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="label-text mb-1">Last run</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatTime(status.last_headlines_update)}
                  </p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="label-text mb-1">Headlines loaded</p>
                  <p className="text-sm font-medium text-foreground">
                    {status.headlines_count}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status.data_available ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-bullish" />
                    <span className="text-xs text-bullish">Data available — dashboard is live</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-bearish" />
                    <span className="text-xs text-bearish">No data — run pipeline first</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Could not reach API. Make sure api.py is running.
            </p>
          )}
        </div>

        {/* Trigger Card */}
        <div className="glass-card p-5 fade-in">
          <h3 className="label-text mb-4">Run Pipeline</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Secret key
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                onKeyDown={e => e.key === "Enter" && triggerPipeline()}
                placeholder="Enter PIPELINE_SECRET from your .env"
                className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Set in your .env as <code className="bg-accent px-1 rounded">PIPELINE_SECRET=yourkey</code>
              </p>
            </div>

            <button
              onClick={triggerPipeline}
              disabled={running || status?.is_running}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/85 transition-colors disabled:opacity-50"
            >
              {running || status?.is_running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Pipeline running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Pipeline Now
                </>
              )}
            </button>

            {message && (
              <div className={`p-3 rounded-xl border text-xs ${
                messageType === "success"
                  ? "bg-bullish/10 border-bullish/25 text-bullish"
                  : messageType === "error"
                  ? "bg-bearish/10 border-bearish/25 text-bearish"
                  : "bg-accent/50 border-border text-muted-foreground"
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* What it does */}
        <div className="glass-card p-5 fade-in">
          <h3 className="label-text mb-3">What the pipeline does</h3>
          <div className="space-y-2">
            {[
              { icon: "1", text: "Fetches latest headlines from 5 Indian RSS feeds"      },
              { icon: "2", text: "AI classifies each headline (sector, sentiment, impact)" },
              { icon: "3", text: "Python calculates all scores — risk, NSS, CSI, z-score, BCG, Pareto" },
              { icon: "4", text: "Saves CSV files and updates dashboard automatically"   },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-start gap-3 text-xs text-secondary-foreground">
                <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground mt-0.5">
                  {icon}
                </span>
                {text}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              Takes 1–3 minutes depending on number of headlines
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
