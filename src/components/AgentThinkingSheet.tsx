import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit, Check, ChevronDown, ChevronRight, Loader2,
  Wifi, WifiOff, Trash2, X, Zap
} from "lucide-react";

type ConnState = "disconnected" | "connecting" | "connected" | "error";

interface AgentEvent {
  type: "pipeline_start" | "agent_start" | "agent_thinking" | "agent_done" | "agent_error" | "pipeline_done" | "log";
  agent: string;
  agent_name: string;
  agent_description: string;
  step: number;
  total_steps: number;
  message: string;
  confidence?: number | null;
  duration_ms?: number | null;
  timestamp: string;
}

interface AgentBlock {
  key: string;
  name: string;
  description: string;
  step: number;
  status: "pending" | "running" | "thinking" | "done" | "error";
  messages: string[];
  confidence?: number | null;
  duration_ms?: number | null;
}

function getApiBase() {
  return (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function AgentCard({ block, isActive }: { block: AgentBlock; isActive: boolean }) {
  const [expanded, setExpanded] = useState(isActive);

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const statusIcon =
    block.status === "running" || block.status === "thinking" ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
    ) : block.status === "done" ? (
      <Check className="w-3.5 h-3.5 text-emerald-400" />
    ) : block.status === "error" ? (
      <X className="w-3.5 h-3.5 text-rose-400" />
    ) : (
      <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
    );

  const borderColor =
    block.status === "running" || block.status === "thinking"
      ? "border-primary/40 bg-primary/[0.03]"
      : block.status === "done"
      ? "border-emerald-500/20 bg-emerald-500/[0.02]"
      : block.status === "error"
      ? "border-rose-500/20 bg-rose-500/[0.02]"
      : "border-white/5 bg-white/[0.01]";

  return (
    <div className={`rounded-lg border transition-all duration-300 ${borderColor}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{block.name}</span>
            <span className="text-[10px] text-muted-foreground/60">Step {block.step}</span>
          </div>
          {block.status === "done" && block.messages.length > 0 && !expanded && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {block.messages[block.messages.length - 1]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {block.confidence != null && block.confidence > 0 && (
            <span className="text-[10px] font-mono text-primary/70">{block.confidence}%</span>
          )}
          {block.duration_ms != null && (
            <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(block.duration_ms)}</span>
          )}
          {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        </div>
      </button>

      {expanded && block.messages.length > 0 && (
        <div className="px-3 pb-2.5 pt-0 border-t border-white/5">
          <div className="pl-6 space-y-1 mt-2">
            {block.messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-primary/40 text-[10px] mt-0.5 shrink-0">→</span>
                <p className="text-[11px] text-foreground/70 leading-relaxed">{msg}</p>
              </div>
            ))}
            {(block.status === "running" || block.status === "thinking") && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-primary/50" />
                <span className="text-[10px] text-primary/50 animate-pulse">thinking...</span>
              </div>
            )}
          </div>
          {block.description && (
            <p className="text-[10px] text-muted-foreground/40 mt-2 pl-6 italic">{block.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentThinkingSheet() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ConnState>("disconnected");
  const [agents, setAgents] = useState<Map<string, AgentBlock>>(new Map());
  const [progress, setProgress] = useState({ step: 0, total: 12 });
  const [pipelineStatus, setPipelineStatus] = useState<"idle" | "running" | "done">("idle");
  const esRef = useRef<EventSource | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const streamUrl = useMemo(() => `${getApiBase()}/api/pipeline/stream`, []);

  const clear = () => {
    setAgents(new Map());
    setProgress({ step: 0, total: 12 });
    setPipelineStatus("idle");
  };

  useEffect(() => {
    if (!open) {
      esRef.current?.close();
      esRef.current = null;
      setState("disconnected");
      return;
    }

    // Also poll for existing events on open
    fetch(`${getApiBase()}/api/pipeline/events`)
      .then(r => r.json())
      .then(data => {
        if (data.events && data.events.length > 0) {
          for (const evt of data.events) {
            processEvent(evt);
          }
        }
      })
      .catch(() => {});

    setState("connecting");
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onopen = () => setState("connected");
    es.onerror = () => setState("error");
    es.onmessage = (ev) => {
      const raw = (ev.data || "").toString();
      if (!raw) return;
      try {
        const evt: AgentEvent = JSON.parse(raw);
        processEvent(evt);
      } catch {
        // Legacy plain text — ignore
      }
    };

    return () => {
      es.close();
      esRef.current = null;
      setState("disconnected");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, streamUrl]);

  function processEvent(evt: AgentEvent) {
    if (!evt.type || !evt.agent) return;

    if (evt.type === "pipeline_start") {
      setPipelineStatus("running");
      setProgress({ step: 0, total: evt.total_steps || 12 });
      return;
    }

    if (evt.type === "pipeline_done") {
      setPipelineStatus("done");
      return;
    }

    setAgents(prev => {
      const next = new Map(prev);
      const key = evt.agent;
      const existing = next.get(key);

      if (evt.type === "agent_start") {
        next.set(key, {
          key,
          name: evt.agent_name || key,
          description: evt.agent_description || "",
          step: evt.step,
          status: "running",
          messages: [evt.message].filter(Boolean),
          confidence: null,
          duration_ms: null,
        });
        setProgress(p => ({ ...p, step: Math.max(p.step, evt.step) }));
      } else if (evt.type === "agent_thinking") {
        if (existing) {
          existing.status = "thinking";
          if (evt.message) existing.messages.push(evt.message);
        }
      } else if (evt.type === "agent_done") {
        if (existing) {
          existing.status = "done";
          if (evt.message) existing.messages.push(evt.message);
          existing.confidence = evt.confidence;
          existing.duration_ms = evt.duration_ms;
        } else {
          next.set(key, {
            key,
            name: evt.agent_name || key,
            description: evt.agent_description || "",
            step: evt.step,
            status: "done",
            messages: [evt.message].filter(Boolean),
            confidence: evt.confidence,
            duration_ms: evt.duration_ms,
          });
        }
      } else if (evt.type === "agent_error") {
        if (existing) {
          existing.status = "error";
          if (evt.message) existing.messages.push(evt.message);
          existing.duration_ms = evt.duration_ms;
        }
      }

      return next;
    });
  }

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, agents.size]);

  const agentList = Array.from(agents.values()).sort((a, b) => a.step - b.step);
  const activeKey = agentList.find(a => a.status === "running" || a.status === "thinking")?.key;
  const progressPct = progress.total > 0 ? (progress.step / progress.total) * 100 : 0;

  const stateBadge =
    state === "connected" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-bullish">
        <Wifi className="w-3 h-3" /> Live
      </span>
    ) : state === "connecting" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
        <Wifi className="w-3 h-3 animate-pulse" /> Connecting
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-bearish">
        <WifiOff className="w-3 h-3" /> {state === "error" ? "Error" : "Offline"}
      </span>
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs text-foreground/80 hover:text-foreground">
          <BrainCircuit className="w-3.5 h-3.5 opacity-90 group-hover:opacity-100" />
          Agent Thinking
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] sm:max-w-xl p-0">
        <div className="p-5 border-b border-border/50">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Agent Intelligence Pipeline
              <span className="ml-auto">{stateBadge}</span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Real-time view of each agent's reasoning process
            </SheetDescription>
          </SheetHeader>

          {/* Progress bar */}
          {pipelineStatus === "running" && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Step {progress.step} of {progress.total}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {pipelineStatus === "done" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
              Pipeline complete
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={clear} className="gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {agentList.length === 0 ? (
              <div className="text-xs text-muted-foreground leading-relaxed p-4 text-center">
                <BrainCircuit className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                <p>No pipeline activity yet.</p>
                <p className="mt-1">Start the pipeline from <span className="font-semibold text-foreground">Admin</span> and keep this panel open to see agents think in real-time.</p>
              </div>
            ) : (
              agentList.map(block => (
                <AgentCard
                  key={block.key}
                  block={block}
                  isActive={block.key === activeKey}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
