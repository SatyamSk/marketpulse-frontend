import {
  Zap, FlaskConical, MessageSquare, Settings,
  Shield, Menu, X
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";

const navItems = [
  { title: "Today",          url: "/",          icon: Zap           },
  { title: "Full Analysis",  url: "/analysis",  icon: FlaskConical  },
  { title: "Ask AI",         url: "/chat",      icon: MessageSquare },
];

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const isAdmin = typeof window !== "undefined" && Boolean(localStorage.getItem("marketpulseAdminToken"));
  const allItems = [
    ...navItems,
    { title: isAdmin ? "Pipeline" : "Pipeline 🔒", url: "/admin", icon: Settings },
  ];

  const SidebarContent = () => (
    <aside className="w-64 min-h-screen flex flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            CausalEdge AI
          </h1>
          <p className="label-text mt-0.5">Market Intelligence</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Agent Badge */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          9-Agent Intelligence
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 px-1 leading-relaxed">
          Causal reasoning · Supply chain analysis · Behavioral detection · Contradiction checking
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {allItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            activeClassName="bg-primary/10 text-primary font-medium"
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Disclaimer */}
      <button
        onClick={() => setShowDisclaimer(true)}
        className="flex items-center gap-2 px-5 py-3 border-t border-border text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Shield className="w-3.5 h-3.5" />
        Disclaimer
      </button>

      {/* Credit */}
      <div className="px-5 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground/60">
          Built by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-semibold">Satyam</span> · PGDM IMI Delhi
        </p>
      </div>

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Disclaimer & Terms of Use</h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>CausalEdge AI is an independent analytical platform. It is not a SEBI-registered investment advisor, research analyst, or financial services provider.</p>
              <p>Nothing on this platform — including sentiment scores, risk classifications, market regime indicators, AI-generated briefs, sector analysis, or geopolitical risk flags — constitutes financial advice, investment advice, or trading recommendations.</p>
              <p>All trading decisions are made solely at the discretion and risk of the user. CausalEdge AI bears no responsibility for any financial losses arising from use of this platform.</p>
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
          <div className="flex-1 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
