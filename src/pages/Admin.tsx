import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import {
  Play, RefreshCw, CheckCircle, AlertCircle,
  Clock, Database, Minus, Plus, Zap
} from "lucide-react";

const FEEDS = 16;

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  // Strip "IST" or any non-standard timezone suffix JS can't parse
  const cleaned = raw.replace(/\s+IST$/i, "").replace(" ", "T");
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function formatRelative(raw: string | null): string {
  const d = parseDate(raw);
  if (!d) return "Never";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
  if (diff < 1)    return "Just now";
  if (diff < 60)   return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  return d.toLocaleDateString("en-IN");
}

function formatTime(raw: string | null): string {
  const d = parseDate(raw);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

export default function Admin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [pipelineSecret, setPipelineSecret] = useState("");
  const [maxPerFeed, setMaxPerFeed]       = useState(14);
  const [running, setRunning]             = useState(false);
  const [message, setMessage]             = useState<string | null>(null);
  const [messageType, setMessageType]     = useState<"success" | "error" | "info">("info");
  const [status, setStatus]               = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [adminToken, setAdminToken]       = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("marketpulseAdminToken");
  });
  const [authError, setAuthError]         = useState<string | null>(null);
  const [logs, setLogs]                   = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs]     = useState(false);
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
    if (adminToken) {
      loadLogs();
    }
    const interval = setInterval(() => loadStatus(true), 15000);
    return () => {
      clearInterval(interval);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [adminToken]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleLogin = async () => {
    if (!adminPassword.trim()) { setAuthError("Enter the admin password."); return; }
    setAuthError(null);
    try {
      const res = await api.adminLogin(adminPassword);
      setAdminToken(res.token);
      localStorage.setItem("marketpulseAdminToken", res.token);
      setMessage("Authenticated successfully.");
      setMessageType("success");
      setAdminPassword("");
      await loadLogs();
    } catch (e: any) {
      setAuthError(e?.message || "Invalid credentials.");
    }
  };

  const loadLogs = async () => {
    if (!adminToken) return;
    setLoadingLogs(true);
    try {
      const res = await api.adminLogs(adminToken);
      setLogs(res.logs);
    } catch (err: any) {
      setLogs(`Cannot load admin logs: ${err?.message ?? "unknown error"}`);
      if (err?.message?.toLowerCase().includes("invalid")) {
        localStorage.removeItem("marketpulseAdminToken");
        setAdminToken(null);
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("marketpulseAdminToken");
    setAdminToken(null);
    setMessage("Admin session ended.");
    setMessageType("info");
    setLogs(null);
  };

  const triggerPipeline = async () => {
    if (!adminToken) {
      setMessage("Login first to run the pipeline.");
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

    if (!pipelineSecret.trim()) {
      setMessage("Enter the pipeline secret key before running the pipeline.");
      setMessageType("error");
      setRunning(false);
      return;
    }

    try {
      const result = await api.triggerPipeline(pipelineSecret, maxPerFeed, adminToken);
      setMessage(
        result.message ??
        `Pipeline started — fetching up to ~${approxTotal} headlines from last 48 hours. Polling every 5s...`
      );
      setMessageType("info");

      let attempts = 0;
      const maxAttempts = 180; // 15 minutes max

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
              `Done. ${s.headlines_count} headlines fetched · Last run: ${formatTime(s.last_headlines_update)}`
            );
            setMessageType("success");
            return;
          }

          if (!s.is_running && attempts > 8) {
            stopPolling();
            setRunning(false);
            setMessage("Pipeline finished. Refresh the dashboard to see updated data.");
            setMessageType("success");
            return;
          }
        } catch {}

        if (attempts >= maxAttempts) {
          stopPolling();
          setRunning(false);
          setMessage("Timed out waiting. Pipeline may still be running — check Render logs.");
          setMessageType("info");
        }
      }, 5000);

    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "";
      setMessage(
        typeof detail === "string" && detail.toLowerCase().includes("invalid secret")
          ? "Wrong secret key."
          : `Pipeline trigger failed — ${String(detail || "check if api.py is running.")}`
      );
      setMessageType("error");
      setRunning(false);
    }
  };

  const triggerBacktest = async () => {
    if (!adminToken) {
      setMessage("Login first to run backtest.");
      setMessageType("error");
      return;
    }
    setMessage("Starting backtest...");
    setMessageType("info");
    try {
      await api.adminBacktest(adminToken);
      setMessage("Backtest started. Check logs for progress.");
      setMessageType("success");
    } catch (err: any) {
      setMessage(`Backtest failed — ${err?.message ?? "unknown error"}`);
      setMessageType("error");
    }
  };

  const triggerReflection = async () => {
    if (!adminToken) {
      setMessage("Login first to start learning reflection.");
      setMessageType("error");
      return;
    }
    setMessage("Starting learning reflection...");
    setMessageType("info");
    try {
      await api.adminReflect(adminToken);
      setMessage("Learning reflection started.");
      setMessageType("success");
    } catch (err: any) {
      setMessage(`Reflection failed — ${err?.message ?? "unknown error"}`);
      setMessageType("error");
    }
  };

  const adjust = (delta: number) =>
    setMaxPerFeed(prev => Math.max(3, Math.min(50, prev + delta)));

  const isActive = running || status?.is_running;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground">Pipeline Control</h1>
          <p className="text-xs text-muted-foreground">
            Manually fetch news and run full analysis across {FEEDS} sources
          </p>
        </div>

        {!adminToken ? (
          <div className="glass-card p-5 fade-in">
            <h3 className="text-lg font-semibold text-foreground">Admin Login Required</h3>
            <p className="text-xs text-muted-foreground mt-2">
              The pipeline control panel is restricted to admin users. Log in to run the pipeline, start backtests, and trigger learning reflection.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign In as Admin
              </button>

              {authError && <p className="text-xs text-bearish">{authError}</p>}

              <p className="text-[10px] text-muted-foreground">
                Set the admin password as <code className="bg-accent px-1 rounded">ADMIN_SECRET</code> on your backend.
              </p>
            </div>
          </div>
        ) : (
          <>
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

                  {/* Running indicator */}
                  {isActive && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                      <span className="text-xs font-medium text-primary">
                        Pipeline running — polling every 5 seconds...
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    {/* Last run */}
                    <div className="bg-accent/30 rounded-lg p-3">
                      <p className="label-text mb-1">Last run</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatRelative(status.last_headlines_update)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatTime(status.last_headlines_update)}
                      </p>
                    </div>

                    {/* Headlines */}
                    <div className="bg-accent/30 rounded-lg p-3">
                      <p className="label-text mb-1">Headlines</p>
                      <p className="text-sm font-semibold text-foreground">
                        {status.headlines_count > 0 ? status.headlines_count : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">from last run</p>
                    </div>

                    {/* Data status */}
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

            {/* Pipeline secret */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Pipeline Secret</label>
              <input
                type="password"
                value={pipelineSecret}
                onChange={e => setPipelineSecret(e.target.value)}
                placeholder="Enter pipeline secret key"
                className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Set as <code className="bg-accent px-1 rounded">PIPELINE_SECRET</code> in your .env or Render environment variables.
              </p>
            </div>

            {/* Admin Auth */}
            <div>
              {adminToken ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-bullish">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Admin session active
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg bg-accent text-xs text-foreground hover:bg-accent/80 transition-colors"
                    >
                      Logout
                    </button>
                    <button
                      onClick={loadLogs}
                      className="px-4 py-2 rounded-lg bg-primary/80 text-xs text-primary-foreground hover:bg-primary transition-colors"
                    >
                      Refresh Logs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Admin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-2.5 rounded-xl bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleLogin}
                    className="px-4 py-2 rounded-lg bg-primary/80 text-primary-foreground text-xs font-medium hover:bg-primary transition-colors"
                  >
                    Admin Login
                  </button>
                  {authError && <p className="text-xs text-bearish">{authError}</p>}
                  <p className="text-[10px] text-muted-foreground">
                    Set as <code className="bg-accent px-1 rounded">ADMIN_SECRET</code> in your .env file.
                  </p>
                </div>
              )}
            </div>

            {/* Headlines per feed */}
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
                    step={1}
                    value={maxPerFeed}
                    onChange={e => setMaxPerFeed(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>3 · fast</span>
                    <span>14 · standard</span>
                    <span>50 · deep</span>
                  </div>
                </div>
              </div>

              {/* Summary boxes */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Per source", value: maxPerFeed  },
                  { label: "Sources",    value: FEEDS        },
                  { label: "~Total",     value: approxTotal  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-accent/30 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-semibold font-mono text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                ~{approxTotal} possible · news from last 48 hours only · deduplication reduces final count ·
                ~{estMinutes} min run time · est. cost ≈ ₹{(approxTotal * 0.01).toFixed(0)}
              </p>
            </div>

            {/* Run Button */}
            <button
              onClick={triggerPipeline}
              disabled={isActive}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/85 transition-colors disabled:opacity-50"
            >
              {isActive ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Agent thinking...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Agent Intelligence
                </>
              )}
            </button>

            {/* Message */}
            {message && (
              <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs leading-relaxed ${
                messageType === "success"
                  ? "bg-bullish/10 border-bullish/25 text-bullish"
                  : messageType === "error"
                  ? "bg-bearish/10 border-bearish/25 text-bearish"
                  : "bg-accent/50 border-border text-muted-foreground"
              }`}>
                {messageType === "success" && <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {messageType === "error"   && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {messageType === "info"    && <RefreshCw   className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin" />}
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>
        </>)}

        {adminToken && (
          <div className="glass-card p-5 fade-in">
            <h3 className="label-text mb-4">Admin Utilities</h3>
            <div className="grid gap-3 sm:grid-cols-3 mb-4">
              <button
                onClick={triggerBacktest}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/90 transition-colors"
              >
                Run Backtest
              </button>
              <button
                onClick={triggerReflection}
                className="w-full px-4 py-3 rounded-xl bg-warning text-warning-foreground text-xs font-semibold hover:bg-warning/90 transition-colors"
              >
                Start Reflection
              </button>
              <button
                onClick={loadLogs}
                disabled={loadingLogs}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loadingLogs ? "Refreshing…" : "Refresh Logs"}
              </button>
            </div>

            <div className="rounded-2xl bg-card p-4 border border-border text-[11px] leading-relaxed overflow-x-auto max-h-64">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Admin logs</p>
              <pre className="whitespace-pre-wrap break-words text-[11px] text-foreground min-h-[120px]">
                {logs ?? "No logs available yet. Run a pipeline or refresh logs."}
              </pre>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="glass-card p-5 fade-in">
          <h3 className="label-text mb-3">What the pipeline does</h3>
          <div className="space-y-2.5">
            {[
              {
                n: "1",
                text: `Fetches up to ~${approxTotal} headlines from ${FEEDS} sources including ET, Livemint, BS, Moneycontrol, PIB, RBI, SEBI, Reuters and more — last 48 hours only`,
              },
              {
                n: "2",
                text: "AI classifies each headline — sector, sentiment, impact score, catalyst type, second-order beneficiaries, contrarian flags",
              },
              {
                n: "3",
                text: "Python calculates all scores — NSS, CSI, z-score, BCG classification, signal decay, momentum, Market Stress Index",
              },
              {
                n: "4",
                text: "Saves results to the backend database — dashboard refreshes automatically on next page load",
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

          {/* Sources */}
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="label-text mb-2">Sources included</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Economic Times", "Livemint", "Business Standard",
                "Moneycontrol", "Financial Express",
                "PIB", "RBI", "SEBI",
                "Reuters India", "Inc42", "+ more",
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
              Status auto-refreshes every 15s · or click Refresh above
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Zap className="w-3 h-3" />
              Sentiment velocity updates automatically on each run
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Database className="w-3 h-3" />
              Data persists in GitHub — survives server restarts
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
