import {
  Newspaper, FlaskConical, BarChart3, Globe,
  MessageSquare, Info, Settings, AlertTriangle,
  CheckCircle, Shield, Menu, X
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useDashboard } from "@/hooks/useDashboard";
import { useState } from "react";

const navItems = [
  { title: "Morning Brief",    url: "/",             icon: Newspaper     },
  { title: "Sentiment Lab",    url: "/sentiment-lab",icon: FlaskConical  },
  { title: "Sector Watchlist", url: "/sectors",      icon: BarChart3     },
  { title: "Geopolitical",     url: "/geopolitical", icon: Globe         },
  { title: "Ask AI",           url: "/ask-ai",       icon: MessageSquare },
  { title: "About",            url: "/about",        icon: Info          },
  { title: "Pipeline",         url: "/admin",        icon: Settings      },
];

export function AppSidebar() {
  const { data } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const highRisk   = data?.benchmark?.filter((s: any) => s.risk_level === "HIGH") ?? [];
  const avgNss     = data?.summary_stats?.avg_nss ?? 0;
  const isNegative = avgNss < 0;
  const regime     = data?.market_regime?.regime ?? "Loading...";

  const SidebarContent = () => (
    <aside className="w-64 min-h-screen flex flex-col border-r border-border"
      style={{ background: "hsl(228 22% 5%)" }}>

      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            MarketPulse AI
          </h1>
          <p className="label-text mt-0.5">Intraday Intelligence</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Mood */}
      <div className="px-4 py-3 border-b border-border">
        {data ? (
          <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isNegative
                ? "bg-bearish/15 text-bearish"
                : "bg-bullish/15 text-bullish"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isNegative ? "bg-bearish" : "bg-bullish"
              }`} />
              {regime} · NSS {avgNss > 0 ? "+" : ""}{avgNss.toFixed(1)}
            </div>
            <p className="text-[10px] text-muted-foreground pl-1">
              {data.summary_stats?.total_headlines ?? 0} headlines ·{" "}
              {data.summary_stats?.geopolitical_flags ?? 0} geo flags ·{" "}
              {data.shock_counts?.major ?? 0} major shocks
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
          <div className="p-3 rounded-xl bg-bearish/8 border border-bearish/20">
            <div className="flex items-center gap-2 text-bearish text-[10px] font-semibold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              High Risk Alert
            </div>
            {highRisk.slice(0, 3).map((s: any) => (
              <p key={s.sector} className="text-[11px] text-bearish/80 leading-relaxed">
                {s.sector} — {Number(s.avg_weighted_risk).toFixed(1)}
              </p>
            ))}
          </div>
        ) : data ? (
          <div className="p-3 rounded-xl bg-bullish/8 border border-bullish/20">
            <div className="flex items-center gap-2 text-bullish text-[10px] font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              No high risk sectors
            </div>
          </div>
        ) : null}
      </div>

      {/* Disclaimer */}
      <button
        onClick={() => setShowDisclaimer(true)}
        className="flex items-center gap-2 px-5 py-3 border-t border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Shield className="w-3.5 h-3.5" />
        Disclaimer
      </button>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Disclaimer & Terms of Use
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>MarketPulse AI is an independent analytical platform. It is not a SEBI-registered investment advisor, research analyst, or financial services provider.</p>
              <p>Nothing on this platform — including sentiment scores, risk classifications, market regime indicators, AI-generated briefs, sector analysis, or geopolitical risk flags — constitutes financial advice, investment advice, or trading recommendations.</p>
              <p>All trading decisions are made solely at the discretion and risk of the user. MarketPulse AI bears no responsibility for any financial losses arising from use of this platform.</p>
              <p>All sentiment scores and risk metrics are probabilistic estimates derived from automated news analysis and may not reflect actual market conditions. Past sentiment patterns do not guarantee future market movements.</p>
              <p className="italic text-xs">By using this platform, you acknowledge that you have read, understood, and agreed to these terms.</p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/85 transition-colors"
            >
              I understand, close
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block shrink-0">
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 relative z-50"><SidebarContent /></div>
          <div
            className="flex-1 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
