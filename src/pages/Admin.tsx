import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api, getStreamUrl } from "@/lib/api";
import type { ModelInfo } from "@/lib/api";
import {
  Play, RefreshCw, CheckCircle, AlertCircle,
  Clock, Database, Minus, Plus, Zap, BrainCircuit,
  Lock, LogOut, ChevronDown
} from "lucide-react";

const FEEDS = 16;

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+IST$/i, "").replace(" ", "T");
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function formatRelative(raw: string | null): string {
  const d = parseDate(raw);
  if (!d) return "Never";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  return d.toLocaleDateString("en-IN");
}

function formatTime(raw: string | null): string {
  const d = parseDate(raw);
  if (!d) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Classify log lines for color coding */
function classifyLine(line: string): string {
  const l = line.toLowerCase();
  if (l.includes("✅") || l.includes("complete") || l.includes("success")) return "success";
  if (l.includes("error") || l.includes("fail") || l.includes("🔥")) return "error";
  if (l.includes("tool") || l.includes("fetch") || l.includes("analyz")) return "tool-call";
  if (l.includes("think") || l.includes("reason") || l.includes("synth")) return "thinking";
  return "";
}

export default function Admin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [pipelineSecret, setPipelineSecret] = useState("");
  const [maxPerFeed, setMaxPerFeed] = useState(14);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("marketpulseAdminToken");
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Model selection
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [modelOpen, setModelOpen] = useState(false);

  // Inline agent thinking logs (like chatbot thinking)
  const [agentLines, setAgentLines] = useState<string[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const approxTotal = maxPerFeed * FEEDS;
  const estMinutes = Math.ceil(approxTotal / 15);

  // Load models
  useEffect(() => {
    api.getModels().then(r => {
      setModels(r.models);
      const def = r.models.find(m => m.default);
      if (def) setSelectedModel(def.id);
    }).catch(() => {
      setModels([
        { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & cost-effective", default: true },
        { id: "gpt-4o", name: "GPT-4o", description: "Most capable", default: false },
      ]);
    });
  }, []);

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
      stopPolling();
      esRef.current?.close();
    };
  }, [adminToken]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // Connect to SSE stream when pipeline is running
  const connectStream = () => {
    esRef.current?.close();
    setAgentLines([]);
    setStreamConnected(false);
    const es = new EventSource(getStreamUrl());
    esRef.current = es;
    es.onopen = () => setStreamConnected(true);
    es.onerror = () => setStreamConnected(false);
    es.onmessage = (ev) => {
      const msg = (ev.data || "").toString();
      if (!msg) return;
      setAgentLines(prev => {
        const next = [...prev, msg];
        return next.length > 500 ? next.slice(-500) : next;
      });
    };
  };

  const disconnectStream = () => {
    esRef.current?.close();
    esRef.current = null;
    setStreamConnected(false);
  };

  // Auto-scroll agent log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLines.length]);

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
    } catch (e: any) {
      setAuthError(e?.message || "Invalid credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("marketpulseAdminToken");
    setAdminToken(null);
    setMessage("Admin session ended.");
    setMessageType("info");
    disconnectStream();
  };

  const triggerPipeline = async () => {
    if (!adminToken) { setMessage("Login first."); setMessageType("error"); return; }
    if (!pipelineSecret.trim()) { setMessage("Enter pipeline secret key."); setMessageType("error"); return; }

    setRunning(true);
    setMessage(null);
    setAgentLines([]);
    stopPolling();
    connectStream();

    let prevTimestamp: string | null = null;
    let prevCount = 0;
    try {
      const before = await api.pipelineStatus();
      prevTimestamp = before?.last_headlines_update ?? null;
      prevCount = before?.headlines_count ?? 0;
    } catch {}

    try {
      const result = await api.triggerPipeline(pipelineSecret, maxPerFeed, adminToken, selectedModel);
      setMessage(result.message ?? `Agent started with ${selectedModel}. Watching live...`);
      setMessageType("info");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const s = await api.pipelineStatus();
          setStatus(s);
          const done = (prevTimestamp && s.last_headlines_update && s.last_headlines_update !== prevTimestamp)
            || (s.headlines_count !== prevCount && s.headlines_count > 0 && !s.is_running);
          if (done || (!s.is_running && attempts > 8)) {
            stopPolling();
            disconnectStream();
            setRunning(false);
            setMessage(`Done. ${s.headlines_count} headlines · ${formatTime(s.last_headlines_update)}`);
            setMessageType("success");
          }
        } catch {}
        if (attempts >= 180) {
          stopPolling(); disconnectStream(); setRunning(false);
          setMessage("Timed out. Pipeline may still be running."); setMessageType("info");
        }
      }, 5000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "";
      setMessage(typeof detail === "string" && detail.includes("invalid")
        ? "Wrong secret key." : `Pipeline failed — ${String(detail || "check backend.")}`);
      setMessageType("error");
      setRunning(false);
      disconnectStream();
    }
  };

  const triggerBacktest = async () => {
    if (!adminToken) return;
    setMessage("Starting backtest..."); setMessageType("info");
    try { await api.adminBacktest(adminToken); setMessage("Backtest started."); setMessageType("success"); }
    catch (e: any) { setMessage(`Backtest failed — ${e?.message}`); setMessageType("error"); }
  };

  const triggerReflection = async () => {
    if (!adminToken) return;
    setMessage("Starting reflection..."); setMessageType("info");
    try { await api.adminReflect(adminToken); setMessage("Reflection started."); setMessageType("success"); }
    catch (e: any) { setMessage(`Reflection failed — ${e?.message}`); setMessageType("error"); }
  };

  const adjust = (d: number) => setMaxPerFeed(prev => Math.max(3, Math.min(50, prev + d)));
  const isActive = running || status?.is_running;
  const activeModel = models.find(m => m.id === selectedModel);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-8">

        {/* Header */}
        <div className="fade-in">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> Agent Control
          </h1>
          <p className="text-xs text-muted-foreground">
            Autonomous intelligence pipeline · {FEEDS} sources · Model selection
          </p>
        </div>

        {/* ── LOGIN GATE ── */}
        {!adminToken ? (
          <div className="glass-card p-6 fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Admin Login</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Pipeline controls are restricted. Authenticate to run the agent, backtests, and reflections.
            </p>
            <div className="space-y-3">
              <input
                type="password" value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={handleLogin}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Sign In
              </button>
              {authError && <p className="text-xs text-bearish">{authError}</p>}
              <p className="text-[10px] text-muted-foreground">
                Set as <code className="bg-muted px-1 rounded">ADMIN_SECRET</code> on your backend.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── PIPELINE STATUS ── */}
            <div className="glass-card p-5 fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="label-text">Pipeline Status</h3>
                <div className="flex items-center gap-2">
                  <button onClick={handleLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-bearish hover:bg-bearish/10 transition-colors">
                    <LogOut className="w-3 h-3" /> Logout
                  </button>
                  <button onClick={() => loadStatus()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>
              </div>
              {status ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="label-text mb-1">Last run</p>
                    <p className="text-sm font-semibold text-foreground">{formatRelative(status.last_headlines_update)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(status.last_headlines_update)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="label-text mb-1">Headlines</p>
                    <p className="text-sm font-semibold text-foreground">{status.headlines_count > 0 ? status.headlines_count : "—"}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="label-text mb-1">Data</p>
                    {status.data_available
                      ? <div className="flex items-center gap-1.5 mt-1"><CheckCircle className="w-3.5 h-3.5 text-bullish" /><span className="text-xs text-bullish font-medium">Live</span></div>
                      : <div className="flex items-center gap-1.5 mt-1"><AlertCircle className="w-3.5 h-3.5 text-bearish" /><span className="text-xs text-bearish">Missing</span></div>
                    }
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Cannot reach API.</p>
              )}
            </div>

            {/* ── RUN AGENT ── */}
            <div className="glass-card p-5 fade-in">
              <h3 className="label-text mb-4">Run Agent Intelligence</h3>
              <div className="space-y-4">

                {/* Pipeline secret */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Pipeline Secret</label>
                  <input type="password" value={pipelineSecret} onChange={e => setPipelineSecret(e.target.value)}
                    placeholder="Enter pipeline secret key"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                {/* Model selector */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">AI Model</label>
                  <div className="relative">
                    <button onClick={() => setModelOpen(!modelOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground hover:border-primary/30 transition-colors">
                      <span className="flex items-center gap-2">
                        <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                        {activeModel?.name || selectedModel}
                        <span className="text-[10px] text-muted-foreground">— {activeModel?.description}</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${modelOpen ? "rotate-180" : ""}`} />
                    </button>
                    {modelOpen && (
                      <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                        {models.map(m => (
                          <button key={m.id} onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                            className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-muted/50 transition-colors ${m.id === selectedModel ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                            <div>
                              <p className="font-medium">{m.name}</p>
                              <p className="text-[10px] text-muted-foreground">{m.description}</p>
                            </div>
                            {m.id === selectedModel && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Headlines per feed */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Headlines per source</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => adjust(-1)} disabled={maxPerFeed <= 3}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-12 text-center">
                        <p className="text-xl font-semibold font-mono text-foreground">{maxPerFeed}</p>
                      </div>
                      <button onClick={() => adjust(1)} disabled={maxPerFeed >= 50}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input type="range" min={3} max={50} value={maxPerFeed} onChange={e => setMaxPerFeed(Number(e.target.value))}
                      className="flex-1 accent-primary cursor-pointer" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    ~{approxTotal} headlines · ~{estMinutes} min · est. ₹{(approxTotal * 0.01).toFixed(0)} cost
                  </p>
                </div>

                {/* Run Button */}
                <button onClick={triggerPipeline} disabled={isActive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/85 transition-colors disabled:opacity-50">
                  {isActive
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Agent thinking...</>
                    : <><Play className="w-4 h-4" /> Run Agent ({activeModel?.name || selectedModel})</>
                  }
                </button>

                {/* Status message */}
                {message && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs leading-relaxed ${
                    messageType === "success" ? "bg-bullish/10 border-bullish/25 text-bullish"
                    : messageType === "error" ? "bg-bearish/10 border-bearish/25 text-bearish"
                    : "bg-muted/50 border-border text-muted-foreground"
                  }`}>
                    {messageType === "success" && <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                    {messageType === "error" && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                    {messageType === "info" && <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-spin" />}
                    <span>{message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── INLINE AGENT THINKING (like chatbot thinking) ── */}
            {(isActive || agentLines.length > 0) && (
              <div className="fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Agent Thinking</h3>
                  {streamConnected && (
                    <span className="flex items-center gap-1 text-[10px] text-bullish font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-bullish animate-pulse" /> Live
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">{agentLines.length} lines</span>
                </div>
                <div className="agent-log-container max-h-72 overflow-y-auto p-4">
                  {agentLines.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Waiting for agent output...
                    </div>
                  ) : (
                    agentLines.map((line, i) => (
                      <div key={i} className={`agent-log-line ${classifyLine(line)}`}>{line}</div>
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            )}

            {/* ── ADMIN UTILITIES ── */}
            <div className="glass-card p-5 fade-in">
              <h3 className="label-text mb-4">Admin Utilities</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <button onClick={triggerBacktest}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors">
                  Run Backtest
                </button>
                <button onClick={triggerReflection}
                  className="w-full px-4 py-3 rounded-xl bg-warning/20 text-warning text-xs font-semibold hover:bg-warning/30 transition-colors">
                  Start Reflection
                </button>
                <button onClick={() => loadStatus()}
                  className="w-full px-4 py-3 rounded-xl bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors">
                  Refresh Status
                </button>
              </div>
            </div>

            {/* ── INFO ── */}
            <div className="glass-card p-5 fade-in">
              <h3 className="label-text mb-3">What the agent does</h3>
              <div className="space-y-2.5">
                {[
                  { n: "1", text: `Fetches macro data (Crude, INR, VIX, Gold, US10Y) + ~${approxTotal} headlines from ${FEEDS} sources` },
                  { n: "2", text: "AI classifies headlines — sector, sentiment, impact, catalyst, contrarian flags" },
                  { n: "3", text: "Autonomous synthesis — TRAP_ALERT detection, noise filtration, cross-sector validation" },
                  { n: "4", text: "Memory-assisted — learns from past failures, avoids repeating mistakes" },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-3 text-xs text-secondary-foreground">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground">{n}</span>
                    {text}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" /> Status auto-refreshes every 15s
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Zap className="w-3 h-3" /> Agent thinking shown inline during run
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Database className="w-3 h-3" /> Data persists in SQLite + GitHub backup
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
