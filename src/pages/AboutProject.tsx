import { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, Network, ShieldCheck, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { aboutConcepts } from "@/data/mockData";

export default function AboutProject() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 space-y-8 fade-in">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
            <Cpu className="w-3.5 h-3.5" />
            System Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            MarketPulse Intelligence Engine
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
            A state-of-the-art quantitative framework designed to compress hours of unstructured financial data into actionable, deterministic trading signals. Built on the principles of high-frequency intelligence gathering.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Deterministic Pipelines", desc: "No AI hallucinations. Calculations are purely mathematical; LLMs are exclusively used for semantic classification.", icon: <Network /> },
            { title: "Zero-Latency Insight", desc: "Instantly process 400+ daily inputs from tier-1 financial sources into real-time shock indices.", icon: <Zap /> },
            { title: "Enterprise Grade", desc: "Designed for institutional risk management, deploying BCG-matrix sector evaluation and contagion flow mapping.", icon: <ShieldCheck /> }
          ].map((feat, i) => (
            <div key={i} className="glass-card-hover p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {feat.icon}
              </div>
              <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent my-10" />

        <h2 className="text-xl font-semibold text-foreground mb-6">Analytical Framework Definitions</h2>

        <div className="space-y-3">
          {aboutConcepts.map((concept, i) => (
            <div key={i} className="glass-card-hover overflow-hidden transition-all duration-300">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full p-5 flex items-center justify-between gap-4 text-left"
              >
                <h3 className="text-sm font-semibold text-foreground tracking-wide">{concept.title}</h3>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  {expanded === i ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expanded === i && (
                <div className="px-5 pb-6 space-y-5 border-t border-border/50 pt-5 bg-black/20">
                  <div className="space-y-1.5">
                    <p className="label-text text-primary">Core Definition</p>
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{concept.what}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="label-text text-primary">Strategic Utility</p>
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{concept.why}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="label-text text-primary">System Location</p>
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{concept.where}</p>
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
