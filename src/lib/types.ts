// ─── MarketPulse AI — TypeScript Types ─────────────────────────────

export type Sentiment = 'positive' | 'negative' | 'neutral';
export type ShockStatus = 'Normal' | 'Watch' | 'Shock' | 'Major Shock';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type InvestmentSignal = 'BUY BIAS' | 'AVOID' | 'CAUTION' | 'IMPROVING' | 'CONTRARIAN WATCH' | 'NEUTRAL';
export type Regime = 'Risk On' | 'Risk Off' | 'Complacent' | 'Panic';
export type PriceDirection = 'bullish' | 'bearish' | 'neutral';

export interface Headline {
  id?: number;
  title: string;
  description: string;
  source: string;
  source_url: string;
  published: string;
  hours_old: number;
  url: string;
  is_govt_source: boolean;
  sector: string;
  sentiment: Sentiment;
  sentiment_confidence: number;
  impact_score: number;
  valence: number;
  arousal: number;
  geopolitical_risk: boolean;
  affected_companies: string[] | string;
  second_order_beneficiaries: string[] | string;
  catalyst_type: string;
  price_direction: PriceDirection;
  time_horizon: string;
  conviction: string;
  macro_sensitivity: string;
  one_line_insight: string;
  signal_reason: string;
  contrarian_flag: boolean;
  contrarian_reason: string;
  sentiment_num: number;
  weighted_risk_score: number;
  signal_decay: number;
  recency_weighted_impact: number;
  catalyst_weight: number;
  z_score: number;
  shock_status: ShockStatus;
  source_reliability: number;
}

export interface SectorBenchmark {
  sector: string;
  avg_weighted_risk: number;
  sentiment_nss: number;
  impact_weighted_sentiment: number;
  confidence_weighted_sentiment?: number;
  composite_sentiment_index: number;
  sentiment_velocity: number;
  risk_level: RiskLevel;
  avg_impact: number;
  total_mentions: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  momentum_score: number;
  divergence: number;
  divergence_flag: string;
  govt_signals: number;
  contrarian_count: number;
  geopolitical_flags: number;
  valence: number;
  arousal: number;
  sector_classification: string;
  investment_signal: InvestmentSignal;
  dynamic_sector_weight?: number;
}

export interface MarketRegime {
  regime: Regime;
  description: string;
  nifty_implication: string;
  watch: string;
  avoid: string;
}

export interface ShockCounts {
  major: number;
  shock: number;
  watch: number;
}

export interface SummaryStats {
  total_headlines: number;
  geopolitical_flags: number;
  avg_nss: number;
  avg_risk: number;
}

export interface ModelAccuracy {
  accuracy: number;
  total_predictions: number;
  correct: number;
}

export interface ContagionFlow {
  source: string;
  target: string;
  value: number;
}

export interface DashboardData {
  last_updated: string | null;
  market_regime: MarketRegime;
  benchmark: SectorBenchmark[];
  headlines: Headline[];
  pareto: { sector: string; avg_weighted_risk: number; cumulative_pct: number }[];
  contagion_flows: ContagionFlow[];
  velocity_trend: unknown[];
  shock_headlines: Headline[];
  shock_counts: ShockCounts;
  market_stress_index: { msi: number; level: string };
  model_accuracy: ModelAccuracy;
  summary_stats: SummaryStats;
}

export interface AccuracyStats {
  total: number;
  correct: number;
  accuracy: number;
  predictions: Prediction[];
}

export interface Prediction {
  date: string;
  predicted_regime: string;
  predicted_nss: number;
  predicted_avg_risk: number;
  actual_nifty_open?: number;
  actual_nifty_close?: number;
  actual_nifty_change_pct?: number;
  was_regime_correct?: boolean;
  sector_accuracy?: Record<string, { predicted: string; actual_direction: string; correct: boolean }>;
  overall_accuracy?: number;
}

export interface SourceReliability {
  source_name: string;
  total_headlines: number;
  correct_direction: number;
  reliability_score: number;
  is_official: boolean;
  last_calibrated: string;
}

export interface AccuracyData {
  accuracy_7d: AccuracyStats;
  accuracy_30d: AccuracyStats;
  accuracy_90d: AccuracyStats;
  source_reliability: SourceReliability[];
  dynamic_weights: Record<string, number>;
}

export interface StockSearchResult {
  query: string;
  total: number;
  headlines: Headline[];
  aggregate: {
    avg_impact: number;
    positive: number;
    negative: number;
    neutral: number;
    net_sentiment: string;
  } | null;
}
