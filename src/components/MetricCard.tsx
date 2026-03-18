import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  colorClass?: string;
  delay?: number;
}

export function MetricCard({ label, value, icon, colorClass = "text-foreground", delay = 0 }: MetricCardProps) {
  return (
    <div className={`glass-card p-5 fade-in fade-in-delay-${delay}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="label-text">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={`text-2xl font-semibold ${colorClass}`}>{value}</p>
    </div>
  );
}
