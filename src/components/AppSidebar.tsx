import { Newspaper, BarChart3, Globe, MessageSquare, FlaskConical, Info, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { benchmarkData, marketMood } from "@/data/mockData";
import { useState } from "react";
import { DisclaimerModal } from "./DisclaimerModal";

const navItems = [
  { title: "Morning Brief", url: "/", icon: Newspaper },
  { title: "Sector Watchlist", url: "/sectors", icon: BarChart3 },
  { title: "Geopolitical Tracker", url: "/geopolitical", icon: Globe },
  { title: "Sentiment Lab", url: "/sentiment-lab", icon: FlaskConical },
  { title: "Ask AI", url: "/ask-ai", icon: MessageSquare },
  { title: "About This Project", url: "/about", icon: Info },
];

export function AppSidebar() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const highRiskSectors = benchmarkData.filter(s => s.risk_level === "HIGH");
  const isNegative = marketMood.nss < 0;

  return (
    <>
      <aside className="w-64 min-h-screen flex flex-col border-r border-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">MarketPulse AI</h1>
          <p className="label-text mt-1">Intraday Intelligence</p>
        </div>

        {/* Market Mood */}
        <div className="px-5 py-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isNegative ? 'bg-bearish/15 text-bearish' : 'bg-bullish/15 text-bullish'}`}>
            <span className={`w-2 h-2 rounded-full ${isNegative ? 'bg-bearish' : 'bg-bullish'} animate-pulse`} />
            {marketMood.sentiment} · NSS {marketMood.nss > 0 ? '+' : ''}{marketMood.nss}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="bg-accent text-foreground font-medium"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Risk Alert */}
        {highRiskSectors.length > 0 ? (
          <div className="p-4 m-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 text-warning text-xs font-medium uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              High Risk Alert
            </div>
            <div className="space-y-1">
              {highRiskSectors.map(s => (
                <p key={s.sector} className="text-sm text-warning/80">{s.sector} — Risk {s.avg_weighted_risk.toFixed(0)}%</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 m-3 rounded-lg bg-bullish/10 border border-bullish/20">
            <div className="flex items-center gap-2 text-bullish text-xs font-medium uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5" />
              No high risk sectors
            </div>
          </div>
        )}

        {/* Disclaimer link */}
        <button
          onClick={() => setShowDisclaimer(true)}
          className="flex items-center gap-2 px-5 py-3 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          Disclaimer
        </button>
      </aside>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Disclaimer & Terms of Use</h2>
            <div className="space-y-3 text-sm text-secondary-foreground leading-relaxed">
              <p>MarketPulse AI is an independent analytical platform designed to assist traders in organizing and interpreting publicly available news information. It is not a SEBI-registered investment advisor, research analyst, or financial services provider.</p>
              <p>Nothing on this platform constitutes financial advice, investment advice, trading recommendations, or solicitation to buy or sell any security or financial instrument. All trading decisions are at the sole discretion and risk of the user.</p>
              <p>All sentiment scores, risk metrics, and classifications are derived from automated analysis and have inherent limitations. MarketPulse AI does not verify the accuracy of any news content.</p>
            </div>
            <button onClick={() => setShowDisclaimer(false)} className="w-full mt-4 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
