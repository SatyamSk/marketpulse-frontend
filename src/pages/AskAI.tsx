import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Trash2, Database, Clock, AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  isGreeting?: boolean;
  wordsUsed?: number;
  wordsRemaining?: number;
}

const WORD_LIMIT  = 500;
const EXAMPLE_QS  = [
  "Why is geopolitical risk elevated today?",
  "Which sectors should I avoid this session?",
  "What does today's crude oil news mean for Nifty?",
  "Are there opportunities in Banking sector?",
  "Which headlines triggered shock alerts today?",
  "Explain the market regime we're in right now",
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function AskAI() {
  const { data } = useDashboard();

  const [messages, setMessages] = useState<Message[]>([{
    role:       "assistant",
    content:    "Good morning. I'm connected to today's live market data. Ask me anything — every answer is grounded in headlines analyzed by the pipeline, not generic AI knowledge.",
    isGreeting: true,
  }]);

  const [input, setInput]                     = useState("");
  const [isTyping, setIsTyping]               = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [cooldownMins, setCooldownMins]       = useState(0);
  const [sessionWords, setSessionWords]       = useState(0);
  const bottomRef                             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Countdown timer
  useEffect(() => {
    if (cooldownMins <= 0) return;
    const interval = setInterval(() => {
      setCooldownMins(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [cooldownMins]);

  const currentWords = countWords(input);
  const wordsLeft    = Math.max(0, WORD_LIMIT - sessionWords);
  const isOverLimit  = currentWords > wordsLeft || currentWords > WORD_LIMIT;
  const inCooldown   = cooldownMins > 0;
  const pctUsed      = Math.min(100, (sessionWords / WORD_LIMIT) * 100);

  const cooldownHours   = Math.floor(cooldownMins / 60);
  const cooldownMinsRem = cooldownMins % 60;

  const send = async (msg: string) => {
    if (!msg.trim() || inCooldown || isOverLimit) return;

    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages
        .filter(m => !m.isGreeting)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await api.chat({
        message:           msg,
        history,
        context_headlines: data?.headlines ?? [],
        context_sectors:   data?.benchmark ?? [],
      });;

      const newWords = result.words_used ?? sessionWords + currentWords;
      setSessionWords(newWords);

      setMessages(prev => [...prev, {
        role:           "assistant",
        content:        result.answer,
        sources:        result.sources,
        wordsUsed:      result.words_used,
        wordsRemaining: result.words_remaining,
      }]);

    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.detail ?? {};

      if (detail?.error === "cooldown_active" || detail?.error === "session_limit_reached") {
        const mins = detail.minutes_remaining ?? 840;
        setCooldownMins(mins);
        setMessages(prev => [...prev, {
          role:    "assistant",
          content: detail.message ?? `Word limit reached. Chat available again in ${Math.floor(mins/60)}h ${mins%60}m.`,
        }]);
      } else if (detail?.error === "message_too_long") {
        setMessages(prev => [...prev, {
          role:    "assistant",
          content: `Your message is ${detail.word_count} words. Please keep messages under ${WORD_LIMIT} words.`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role:    "assistant",
          content: "Could not reach the API. Make sure `python api.py` is running.",
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      {/* w-full and max-w-5xl ensures it looks great on wide PC screens while snapping cleanly to mobile */}
      <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)]">

        {/* Header */}
        <div className="flex items-start justify-between mb-4 fade-in shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Ask the market</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              RAG-grounded · answers cite today's actual headlines
            </p>
          </div>
          <button
            onClick={() => {
              setMessages([{
                role:       "assistant",
                content:    "Chat cleared. Ask me anything about today's market.",
                isGreeting: true,
              }]);
              setShowSuggestions(true);
              setSessionWords(0);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>

        {/* Status bar */}
        <div className="mb-4 shrink-0 fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-accent/40 border border-border">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                {data
                  ? <><span className="text-foreground font-medium">{data.summary_stats.total_headlines}</span> headlines connected</>
                  : "Connecting..."
                }
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              {/* Word usage bar */}
              <div className="flex items-center gap-2.5">
                <div className="w-24 sm:w-32 h-2 bg-background rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:      `${pctUsed}%`,
                      background: pctUsed >= 90 ? "#ef4444" : pctUsed >= 70 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
                <span className={`text-xs font-mono ${
                  wordsLeft <= 10 ? "text-bearish font-semibold" :
                  wordsLeft <= 30 ? "text-warning" : "text-muted-foreground"
                }`}>
                  {wordsLeft}/{WORD_LIMIT}
                </span>
              </div>

              {inCooldown && (
                <div className="flex items-center gap-1.5 text-bearish text-xs font-medium bg-bearish/10 px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3" />
                  {cooldownHours}h {cooldownMinsRem}m
                </div>
              )}
            </div>
          </div>

          {/* Cooldown banner */}
          {inCooldown && (
            <div className="mt-2 p-3 sm:p-4 rounded-xl border border-bearish/25 bg-bearish/5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-bearish shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-bearish">
                    14-hour cooldown active
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Available again in {cooldownHours}h {cooldownMinsRem}m
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!data && !inCooldown && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-warning/25 bg-warning/5 shrink-0">
            <p className="text-sm text-warning">
              Pipeline not connected. Run <code className="bg-accent px-1.5 py-0.5 rounded">python api.py</code> to enable live data.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 sm:pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[92%] sm:max-w-[80%]">
                <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "glass-card rounded-bl-sm text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" && !msg.isGreeting && (
                    <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-border/40">
                      <Database className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                        Grounded in today's data
                      </span>
                    </div>
                  )}
                  <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.sources.map((s, si) => (
                      <a key={si} href="#" onClick={(e) => e.preventDefault()} className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs bg-accent border border-border/50 text-muted-foreground hover:text-foreground transition-colors cursor-default">
                        {s.length > 60 ? s.slice(0, 60) + "…" : s}
                      </a>
                    ))}
                  </div>
                )}

                {/* Words used indicator */}
                {msg.wordsUsed != null && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 text-right font-mono">
                    {msg.wordsUsed}/{WORD_LIMIT} words used
                  </p>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="glass-card px-5 py-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Example Questions */}
        {showSuggestions && !inCooldown && (
          <div className="mb-4 shrink-0 fade-in">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Try asking about today's data:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={!data}
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm bg-accent/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 space-y-2 bg-background pt-2">
          <div className="flex gap-2 sm:gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder={
                inCooldown      ? "Cooldown active..." :
                !data           ? "Connecting to pipeline..." :
                wordsLeft === 0 ? "Word limit reached..." :
                                  "Ask anything about today's market..."
              }
              disabled={isTyping || inCooldown || wordsLeft === 0}
              className="flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-accent/40 border border-border text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors shadow-inner"
              style={{
                borderColor: isOverLimit ? "rgba(239,68,68,0.6)" : undefined,
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isTyping || !data || inCooldown || isOverLimit || wordsLeft === 0}
              className="px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 shadow-lg shadow-primary/20 flex items-center justify-center"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Word counter */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] sm:text-xs font-mono ${
                isOverLimit        ? "text-bearish font-semibold" :
                currentWords > 80  ? "text-warning" : "text-muted-foreground"
              }`}>
                {currentWords} / {WORD_LIMIT} words in message
              </span>
              {isOverLimit && (
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-bearish font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Too long — shorten your message
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              14h cooldown after limit
            </span>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
