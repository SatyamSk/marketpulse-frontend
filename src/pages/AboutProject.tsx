import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { aboutConcepts } from "@/data/mockData";

export default function AboutProject() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1 fade-in">What this is and how it works</h1>
        <p className="text-sm text-muted-foreground mb-6 fade-in fade-in-delay-1">
          Built by Satyam · PGDM, IMI Delhi · All analytical methods implemented in Python. AI used only for interpretation and language generation, never for deterministic calculations.
        </p>

        <div className="glass-card p-6 mb-8 fade-in fade-in-delay-1">
          <p className="text-sm text-secondary-foreground leading-relaxed">
            MarketPulse AI is an automated market intelligence platform built to compress 60 minutes of pre-market news reading into 90 seconds of actionable analysis. It fetches live news from multiple Indian business sources, analyzes every headline using a multi-layer quantitative framework, and surfaces the insights most relevant to intraday traders — before the market opens.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4 fade-in fade-in-delay-2">Analytical Framework</h2>

        <div className="space-y-3 fade-in fade-in-delay-2">
          {aboutConcepts.map((concept, i) => (
            <div key={i} className="glass-card-hover">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full p-5 flex items-center justify-between gap-4 text-left"
              >
                <h3 className="text-sm font-semibold text-foreground">{concept.title}</h3>
                {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              {expanded === i && (
                <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                  <div>
                    <p className="label-text mb-1">What it is</p>
                    <p className="text-sm text-secondary-foreground leading-relaxed">{concept.what}</p>
                  </div>
                  <div>
                    <p className="label-text mb-1">Why it matters for traders</p>
                    <p className="text-sm text-secondary-foreground leading-relaxed">{concept.why}</p>
                  </div>
                  <div>
                    <p className="label-text mb-1">Where it is used</p>
                    <p className="text-sm text-secondary-foreground leading-relaxed">{concept.where}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
