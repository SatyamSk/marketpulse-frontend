import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Trash2, Database } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  isGreeting?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "Why is geopolitical risk elevated today?",
  "Which sectors should I avoid this session?",
  "What does today's crude oil news mean for Nifty?",
  "Are there any opportunities in Banking sector?",
  "Which headlines triggered shock alerts today?",
  "Explain the market regime we're in right now",
];

export default function AskAI() {
  const { data } = useDashboard();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Good morning. I'm connected to today's live market data. Ask me anything about current sector risk, geopolitical events, sentiment signals, or trading implications — every answer is grounded in headlines analyzed by the pipeline, not generic AI knowledge.",
      isGreeting: true,
    }
  ]);
  const [input, setInput]         = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (msg: string) => {
    if (!msg.trim() || !data) return;

    setShowSuggestions(false);
    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages
        .filter(m => !m.isGreeting)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await api.chat({
        message: msg,
        history,
        context_headlines: data.headlines,
        context_sectors: data.benchmark,
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Could not reach the API. Make sure `python api.py` is running in your Downloads folder.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl flex flex-col h-[calc(100vh-8rem)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 fade-in shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Ask the market</h1>
            <p className="text-sm text-muted-foreground">
              RAG-grounded answers · Every response cites today's actual headlines
            </p>
          </div>
          <button
            onClick={() => {
              setMessages([{
                role: "assistant",
                content: "Chat cleared. Ask me anything about today's market.",
                isGreeting: true,
              }]);
              setShowSuggestions(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        {/* RAG explanation pill */}
        {data && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-accent/50 border border-border shrink-0 fade-in">
            <Database className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Connected to <span className="text-foreground font-medium">{data.summary_stats.total_headlines} headlines</span> analyzed today ·
              Sectors: <span className="text-foreground font-medium">{data.benchmark.map(b => b.sector).join(", ")}</span>
            </p>
          </div>
        )}

        {!data && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 shrink-0">
            <p className="text-xs text-warning">
              Pipeline not connected. Run `python api.py` to enable live data.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] ${msg.role === "user" ? "" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "glass-card rounded-bl-sm text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" && !msg.isGreeting && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Database className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                        Grounded in today's pipeline data
                      </span>
                    </div>
                  )}
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {msg.sources.map((s, si) => (
                      <span key={si} className="px-2 py-0.5 rounded text-[10px] bg-accent text-muted-foreground">
                        {s.length > 55 ? s.slice(0, 55) + "…" : s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Example Questions */}
        {showSuggestions && (
          <div className="mb-3 shrink-0 fade-in">
            <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 shrink-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
            placeholder="Ask about today's market..."
            disabled={isTyping || !data}
            className="flex-1 px-4 py-3 rounded-xl bg-accent/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isTyping || !data}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
