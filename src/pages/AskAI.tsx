import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Info, Database } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { chatMessages as initialMessages, exampleQuestions, headlinesData } from "@/data/mockData";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const mockResponses: Record<string, { content: string; sources: string[] }> = {
  default: {
    content: "Based on today's analyzed headlines, the market is in a **Risk Off** regime. Geopolitical risk dominates with a weighted score of 50.0, driven by the Strait of Hormuz situation. Energy sector shows strong negative momentum (CSI: -50.1, velocity: -22.1).\n\n**Key takeaways:**\n- Banking remains the strongest sector (CSI: +70.2)\n- Avoid fresh longs in Energy and IT\n- Capital preservation should dominate this session",
    sources: ["Trump's Big U-Turn On Strait of Hormuz", "Rising crude prices may push US towards recession"],
  },
  risk: {
    content: "Today's geopolitical risk is elevated due to **two Major Shock events**:\n\n1. **Strait of Hormuz** (Z-score: 2.8, Impact: 9/10) — This is the highest-impact headline today. Crude import costs for India could spike 8-12% in Q2.\n\n2. **Rising crude prices** (Z-score: 2.1, Impact: 8/10) — Moody's recession warning adds downward pressure on Indian FMCG and manufacturing margins.\n\nThese two events account for 76.5% of total market risk today (Pareto analysis). The contagion map shows Energy absorbs the highest impact (8.5), cascading to Manufacturing (6.2) and FMCG (4.8).",
    sources: ["Trump's Big U-Turn On Strait of Hormuz", "Rising crude prices may push US towards recession warns Moody's"],
  },
  bank: {
    content: "Banking sector looks **favorable** today:\n\n- **NSS:** +71.4 (strongly positive)\n- **CSI:** +70.2 (confirmed across all methods)\n- **Velocity:** +12.4 (improving trend)\n- **Risk Level:** LOW\n\nRBL Bank's GIFT IFSC appointment signals growing institutional confidence. Negative correlation with Geopolitics (-0.45) means banking acts as a **natural hedge** against today's elevated geopolitical risk.\n\n**Trading implication:** Accumulate banking stocks on dips. This is an 'Opportunity' zone.",
    sources: ["RBL Bank appointed collecting banker to first IPO from GIFT IFSC", "SEBI proposes modified nomination norms"],
  },
  energy: {
    content: "Energy sector is in **deep trouble** today:\n\n- **CSI:** -50.1 (severely negative)\n- **Velocity:** -22.1 (accelerating deterioration)\n- **Risk Level:** HIGH\n- **Correlation with Geopolitics:** 0.88 (highest on the platform)\n\nThe Hormuz situation and Moody's recession warning are both hitting energy directly. The contagion map shows energy absorbs **impact 8.5** from geopolitical events — the highest cascade.\n\n**Trading implication:** Avoid fresh longs. ONGC, IOC, Reliance, BPCL all face margin compression risk.",
    sources: ["Trump's Big U-Turn On Strait of Hormuz", "Rising crude prices may push US towards recession warns Moody's"],
  },
};

function getResponse(input: string): { content: string; sources: string[] } {
  const lower = input.toLowerCase();
  if (lower.includes("risk") || lower.includes("geopolitical") || lower.includes("avoid")) return mockResponses.risk;
  if (lower.includes("bank")) return mockResponses.bank;
  if (lower.includes("energy") || lower.includes("crude") || lower.includes("oil") || lower.includes("nifty")) return mockResponses.energy;
  return mockResponses.default;
}

export default function AskAI() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsTyping(true);
    setTimeout(() => {
      const resp = getResponse(msg);
      setMessages(prev => [...prev, { role: "assistant", content: resp.content, sources: resp.sources }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Ask the market</h1>
            <p className="text-sm text-muted-foreground max-w-lg">Every answer is grounded in today's live headlines — not generic AI knowledge. This uses Retrieval Augmented Generation (RAG): today's analyzed news is injected as context into every query.</p>
          </div>
          <button
            onClick={() => setMessages(initialMessages)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Example Questions */}
        <div className="glass-card p-4 mb-4 fade-in fade-in-delay-1">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-primary">Example questions you can ask</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 rounded-lg text-xs text-secondary-foreground bg-accent hover:bg-accent/80 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass-card rounded-bl-md text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Database className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Grounded in today's data</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.sources.map((s, si) => (
                      <span key={si} className="px-2 py-0.5 rounded text-[10px] bg-accent text-muted-foreground">
                        📰 {s.length > 50 ? s.slice(0, 50) + '…' : s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="glass-card p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask about today's market..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
