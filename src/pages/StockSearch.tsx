import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import type { StockSearchResult } from "@/lib/types";

export default function StockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchStocks(query);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-8 fade-in">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
            <Search className="w-3.5 h-3.5" />
            Stock Intelligence
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
            Stock Search
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Search any company to see all headlines mentioning it, aggregate sentiment, and second-order connections.
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-4 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search company name (e.g. HDFC Bank, Reliance, Infosys)..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none px-3 py-2 rounded-lg border border-border focus:border-primary/50 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading || query.length < 2}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/85 transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="glass-card p-4 text-sm text-bearish">{error}</div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4 fade-in">
            {results.total === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground">
                No headlines found for "{results.query}" in today's data.
              </div>
            ) : (
              <>
                {/* Aggregate Card */}
                {results.aggregate && (
                  <div className="glass-card p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">"{results.query}"</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Found in {results.total} headline{results.total > 1 ? "s" : ""} today
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="label-text mb-1">Avg Impact</p>
                          <p className="text-2xl font-bold text-primary">{results.aggregate.avg_impact}/10</p>
                        </div>
                        <div className="text-center">
                          <p className="label-text mb-1">Net Sentiment</p>
                          <div className={`flex items-center gap-1.5 text-lg font-bold ${
                            results.aggregate.net_sentiment === "bullish" ? "text-bullish" :
                            results.aggregate.net_sentiment === "bearish" ? "text-bearish" : "text-muted-foreground"
                          }`}>
                            {results.aggregate.net_sentiment === "bullish" ? <TrendingUp className="w-5 h-5" /> :
                             results.aggregate.net_sentiment === "bearish" ? <TrendingDown className="w-5 h-5" /> :
                             <Minus className="w-5 h-5" />}
                            {results.aggregate.net_sentiment.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-bullish">{results.aggregate.positive} positive</span>
                          <span className="text-bearish">{results.aggregate.negative} negative</span>
                          <span className="text-muted-foreground">{results.aggregate.neutral} neutral</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Headlines */}
                <div className="space-y-2">
                  {results.headlines.map((h, i) => (
                    <div key={i} className="glass-card-hover p-4 flex items-start gap-4">
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${
                        h.sentiment === "positive" ? "bg-bullish" :
                        h.sentiment === "negative" ? "bg-bearish" : "bg-muted-foreground/30"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{h.title}</h3>
                          {h.url && (
                            <a href={h.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="tag">{h.sector}</span>
                          <span className={`text-[11px] font-semibold ${
                            h.sentiment === "positive" ? "text-bullish" : h.sentiment === "negative" ? "text-bearish" : "text-muted-foreground"
                          }`}>
                            {h.sentiment?.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-muted-foreground">Impact: {h.impact_score}/10</span>
                          {h.shock_status !== "Normal" && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              h.shock_status === "Major Shock" ? "bg-bearish/15 text-bearish" :
                              h.shock_status === "Shock" ? "bg-shock/15 text-shock" : "bg-warning/15 text-warning"
                            }`}>{h.shock_status}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            Reliability: {(h.source_reliability || 1).toFixed(2)}×
                          </span>
                        </div>
                        {h.one_line_insight && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">{h.one_line_insight}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
