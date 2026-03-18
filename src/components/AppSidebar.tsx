import { Newspaper, BarChart3, Globe, MessageSquare, FlaskConical, Info, AlertTriangle, CheckCircle, Shield, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useDashboard } from "@/hooks/useDashboard";
import { useState } from "react";

const navItems = [
  { title: "Morning Brief",      url: "/",             icon: Newspaper    },
  { title: "Sector Watchlist",   url: "/sectors",      icon: BarChart3    },
  { title: "Geopolitical",       url: "/geopolitical", icon: Globe        },
  { title: "Sentiment Lab",      url: "/sentiment-lab",icon: FlaskConical },
  { title: "Ask AI",             url: "/ask-ai",       icon: MessageSquare},
  { title: "About",              url: "/about",        icon: Info         },
];

export function AppSidebar() {
  const { data } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const highRisk     = data?.benchmark?.filter((s: any) => s.risk_level === "HIGH") ?? [];
  const avgNss       = data?.summary_stats?.avg_nss ?? 0;
  const isNegative   = avgNss < 0;
  const regime       = data?.market_regime?.regime ?? "Loading...";

  const SidebarContent = () => (
    <aside className="w-64 min-h-screen flex flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">MarketPulse AI</h1>
          <p className="label-text mt-0.5">Intraday Intelligence</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Market Mood */}
      <div className="px-4 py-3 border-b border-border">
        {data ? (
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isNegative ? "bg-bearish/15 text-bearish" : "bg-bullish/15 text-bullish"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isNegative ? "bg-bearish" : "bg-bullish"
              }`} />
              {regime} · NSS {avgNss > 0 ? "+" : ""}{avgNss.toFixed(1)}
            </div>
            <p className="text-[10px] text-muted-foreground pl-1">
              {data.summary_stats?.total_headlines ?? 0} headlines analyzed ·{" "}
              {data.summary_stats?.geopolitical_flags ?? 0} geo flags
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/50 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
            Connecting...
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            activeClassName="bg-accent text-foreground font-medium"
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Risk Alert */}
      <div className="p-3">
        {highRisk.length > 0 ? (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 text-warning text-xs font-medium uppercase tracking-wider mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              High Risk Alert
            </div>
            {highRisk.slice(0, 3).map((s: any) => (
              <p key={s.sector} className="text-xs text-warning/80 leading-relaxed">
                {s.sector} — {s.avg_weighted_risk?.toFixed(1)}
              </p>
            ))}
          </div>
        ) : data ? (
          <div className="p-3 rounded-lg bg-bullish/10 border border-bullish/20">
            <div className="flex items-center gap-2 text-bullish text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              No high risk sectors
            </div>
          </div>
        ) : null}
      </div>

      {/* Disclaimer */}
      <button
        onClick={() => setShowDisclaimer(true)}
        className="flex items-center gap-2 px-5 py-3 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Shield className="w-3.5 h-3.5" />
        Disclaimer
      </button>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Disclaimer</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>MarketPulse AI is an independent analytical platform. It is not a SEBI-registered investment advisor.</p>
              <p>Nothing on this platform constitutes financial advice or trading recommendations. All trading decisions are at your sole risk.</p>
              <p>Sentiment scores, risk metrics, and classifications are probabilistic estimates derived from automated news analysis and may not reflect actual market conditions.</p>
              <p>Past sentiment patterns do not guarantee future market movements.</p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 relative z-50">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
