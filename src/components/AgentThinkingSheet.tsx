import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Wifi, WifiOff, Trash2 } from "lucide-react";

type ConnState = "disconnected" | "connecting" | "connected" | "error";

function getApiBase() {
  return (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

export function AgentThinkingSheet() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ConnState>("disconnected");
  const [lines, setLines] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const streamUrl = useMemo(() => `${getApiBase()}/api/pipeline/stream`, []);

  const clear = () => setLines([]);

  useEffect(() => {
    if (!open) {
      esRef.current?.close();
      esRef.current = null;
      setState("disconnected");
      return;
    }

    setState("connecting");
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onopen = () => setState("connected");
    es.onerror = () => setState("error");
    es.onmessage = (ev) => {
      const msg = (ev.data || "").toString();
      if (!msg) return;
      setLines((prev) => {
        const next = [...prev, msg];
        return next.length > 600 ? next.slice(next.length - 600) : next;
      });
    };

    return () => {
      es.close();
      esRef.current = null;
      setState("disconnected");
    };
  }, [open, streamUrl]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, lines.length]);

  const stateBadge =
    state === "connected" ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-bullish">
        <Wifi className="w-3 h-3" /> Connected
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
          Show agent thinking
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] sm:max-w-xl p-0">
        <div className="p-5 border-b border-border/50">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Agent thinking (live)
              <span className="ml-auto">{stateBadge}</span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Optional transparency. This is a live stream of what the agent is doing (tool calls + intermediate notes).
            </SheetDescription>
          </SheetHeader>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={clear} className="gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </Button>
            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
              {streamUrl}
            </span>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-5">
            {lines.length === 0 ? (
              <div className="text-xs text-muted-foreground leading-relaxed">
                No live output yet. Start the pipeline from <span className="font-semibold text-foreground">Admin</span> and keep this panel open.
              </div>
            ) : (
              <pre className="text-[11px] leading-relaxed whitespace-pre-wrap break-words text-foreground/85">
                {lines.join("\n")}
              </pre>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

