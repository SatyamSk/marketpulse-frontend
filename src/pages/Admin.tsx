import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import {
  Play, RefreshCw, CheckCircle, AlertCircle,
  Clock, Database, Minus, Plus
} from "lucide-react";

const FEEDS = 37;

export default function Admin() {
  const [secret, setSecret]               = useState("");
  const [maxPerFeed, setMaxPerFeed]       = useState(12);
  const [running, setRunning]             = useState(false);
  const [message, setMessage]             = useState<string | null>(null);
  const [messageType, setMessageType]     = useState<"success" | "error" | "info">("info");
  const [status, setStatus]               = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const pollRef                           = useRef<ReturnType<typeof setInterval> | null>(null);

  const approxTotal = maxPerFeed * FEEDS;
  const estMinutes  = Math.ceil(approxTotal / 15);

  const loadStatus = async (silent = false) => {
    if (!silent) setLoadingStatus(true);
    try {
      const s = await api.pipelineStatus();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      if (!silent) setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => loadStatus(true), 15000);
    return () => {
      clearInterval(interval);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const triggerPipeline = async () => {
    if (!secret.trim()) {
      setMessage("Enter your pipeline secret key first.");
      setMessageType("error");
      return;
    }

    setRunning(true);
    setMessage(null);
    stopPolling();

    let prevTimestamp: string | null = null;
    let prevCount = 0;
    try {
      const before  = await api.pipelineStatus();
      prevTimestamp = before?.last_headlines_update ?? null;
      prevCount     = before?.headlines_count ?? 0;
    } catch {}

    try {
      const result = await api.triggerPipeline(secret, maxPerFeed);
      setMessage(
        result.message ??
        `Pipeline started — fetching ~${approxTotal} headlines across ${FEEDS} sources. Checking every 5s...`
      );
      setMessageType("info");

      let attempts = 0;
      const maxAttempts = 72; // 6 minutes max for large pulls

      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const s = await api.pipelineStatus();
          setStatus(s);

          const timestampChanged =
            prevTimestamp !== null &&
            s.last_headlines_update !== null &&
            s.last_headlines_update !== prevTimestamp;

          const countChanged =
            s.headlines_count !== prevCount && s.headlines_count > 0;

          if (timestampChanged || (countChanged && !s.is_running)) {
            stopPolling();
            setRunning(false);
            setMessage(
              `Done. ${s.headlines_count} headlines loaded · ` +
              `Last run: ${new Date(s.last_headlines_update).toLocaleTimeString("en-IN")}`
            );
            setMessageType("success");
            return;
          }

          if (!s.is_running && attempts > 6) {
            stopPolling();
            setRunning(false);
            setMessage("Pipeline finished. Click Refresh to see updated status.");
            setMessageType("success");
            return;
          }
        } catch {}

        if (attempts >= maxAttempts) {
          stopPolling();
          setRunning(false);
          setMessage("Timed out. Pipeline may still be running — refresh manually in a minute.");
          setMessageType("info");
        }
      }, 5000);

    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "";
      setMessage(
        typeof detail === "string" && detail.includes("Invalid secret")
          ? "Wrong secret key. Check your .env file."
          : "Pipeline trigger failed — is api.py running?"
      );
      setMessageType("error");
      setRunning(false);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "Never";
    const d    = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
    if (diff < 1)    return "Just now";
    if (diff < 60)   return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    return d.toLocaleDateString("en-IN");
  };

  const adjust = (delta: number) =>
    setMaxPerFeed(prev => Math.max(3, Math.min(50, prev + delta)));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Pipeline Control</h1>
          <p className="text-xs text-muted-foreground">
            Manually fetch news and run full analysis across {FEEDS} sources
          </p>
        </div>

        {/* Status Card */}
        <div className="glass-card p-5 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="label-text">Pipeline Status</h3>
            <button
              onClick={() => loadStatus()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {status ? (
            <div className="space-y-3">
              {(running || status.is_running) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    Pipeline running — polling every 5 seconds...
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="label-text mb-1">Last run</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatTime(status.last_headlines_update)}
                  </p>
                  {status.last_headlines_update && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(status.last_headlines_update).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                      })}
                    </p>
                  )}
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="label-text mb-1">Headlines</p>
                  <p className="text-sm font-semibold text-foreground">
                    {status.headlines_count > 0 ? status.headlines_count : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    from last run
                  </p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="label-text mb-1">Data</p>
                  {status.data_available ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-bullish" />
                      <span className="text-xs text-bullish font-medium">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-bearish" />
                      <span className="text-xs text-bearish">Missing</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Cannot reach API. Make sure{" "}
              <code className="bg-accent px-1 rounded">python api.py</code>{" "}
              is running.
            </p>
          )}
        </div>

        {/* Trigger Card */}
        <div className="glass-card p-5 fade-in">
          <h3 className="label-text mb-4">Run Pipeline</h3>
          <div className="space-y-4">

            {/* Secret Key */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Secret key
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !running && triggerPipeline()}
                placeholder="Enter pipeline secret key"
                className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Set as{" "}
                <code className="bg-accent px-1 rounded">PIPELINE_SECRET</code>
                {" "}in your .env file
              </p>
            </div>

            {/* News Count */}
            <div>
              <label className="text-xs text-muted-foreground mb-3 block">
                Headlines to fetch per source
              </label>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjust(-1)}
                    disabled={maxPerFeed <= 3}
                    className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-14 text-center">
                    <p className="text-2xl font-semibold font-mono text-foreground leading-none">
                      {maxPerFeed}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">per feed</p>
                  </div>
                  <button
                    onClick={() => adjust(1)}
                    disabled={maxPerFeed >= 50}
                    className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-1.5">
                  <input
                    type="range"
                    min={3}
                    max={50}
                    value={maxPerFeed}
                    onChange={e => setMaxPerFeed(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>3 · fast</span>
                    <span>25 · standard</span>
                    <span>50 · exhaustive</span>
                  </div>
                </div>
              </div>

              {/* Summary boxes */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Per source", value: maxPerFeed   },
                  { label: "Sources",    value: FEEDS         },
                  { label: "~Total",     value: approxTotal   },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-accent/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-semibold font-mono text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                ~{approxTotal} possible · deduplication reduces final count ·
                ~{estMinutes} min run time · each headline = 1 AI call (~₹0.01) ·
                est. cost ≈ ₹{(approxTotal * 0.01).toFixed(0)}
              </p>
            </div>

            {/* Run Button */}
            <button
              onClick={triggerPipeline}
              disabled={running || status?.is_running}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/85 transition-colors disabled:opacity-50"
            >
              {running || status?.is_running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running — fetching ~{approxTotal} headlines...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Pipeline — fetch ~{approxTotal} headlines
                </>
              )}
            </button>

            {message && (
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
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

        {/* Info Card */}
        <div className="glass-card p-5 fade-in">
          <h3 className="label-text mb-3">What the pipeline does</h3>
          <div className="space-y-2.5">
            {[
              {
                n: "1",
                text: `Fetches up to ${approxTotal} headlines from ${FEEDS} sources — ET, Livemint, BS, Moneycontrol, PIB, RBI, SEBI, Inc42, Reuters, BBC and more`,
              },
              {
                n: "2",
                text: "AI classifies each headline — sector, sentiment, impact, catalyst type, second-order beneficiaries, contrarian flags",
              },
              {
                n: "3",
                text: "Python calculates all scores — risk, NSS, CSI, z-score, BCG, Pareto, signal decay, momentum, Market Stress Index",
              },
              {
                n: "4",
                text: "Saves CSVs including govt/PIB headlines separately · dashboard updates on next refresh · data persists until next run",
              },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3 text-xs text-secondary-foreground">
                <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground mt-0.5">
                  {n}
                </span>
                {text}
              </div>
            ))}
          </div>

          {/* Source breakdown */}
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="label-text mb-2">Sources included</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Economic Times", "Livemint", "Business Standard",
                "Moneycontrol", "Financial Express", "Hindu BL",
                "PIB", "RBI", "SEBI", "Inc42", "Entrackr",
                "YourStory", "Mercom India", "Reuters India", "BBC Business",
                "+ more",
              ].map(s => (
                <span key={s} className="tag bg-accent/60 text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              Status auto-refreshes every 15s silently · or click Refresh above
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Database className="w-3 h-3" />
              Data stays fixed until you manually run the pipeline again
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
