export const marketRegime = {
  regime: "Risk Off" as const,
  description: "Cautious market conditions. Capital preservation favored over momentum trades.",
  watch: "Geopolitics and Energy — both elevated risk with negative sentiment velocity",
  avoid: "High-leverage positions in IT and Fintech until correlation with geopolitical events resolves",
  nifty_implication: "Gap-down open likely. Watch 22,000 support. Avoid chasing early moves.",
};

export const benchmarkData = [
  { sector: "Geopolitics", avg_weighted_risk: 50.0, sentiment_nss: -12.5, impact_weighted_sentiment: -38.2, confidence_weighted_sentiment: -31.4, composite_sentiment_index: -34.1, sentiment_velocity: -18.3, risk_level: "HIGH" as const, sector_classification: "Watch Closely" as const, avg_impact: 8.2, total_mentions: 4, benchmark_index: 67.4, valence: 0.22, arousal: 0.91 },
  { sector: "IT", avg_weighted_risk: 42.0, sentiment_nss: 0.0, impact_weighted_sentiment: -12.1, confidence_weighted_sentiment: -9.8, composite_sentiment_index: -8.4, sentiment_velocity: -6.2, risk_level: "MEDIUM" as const, sector_classification: "Watch Closely" as const, avg_impact: 7.1, total_mentions: 6, benchmark_index: 62.0, valence: 0.48, arousal: 0.71 },
  { sector: "Banking", avg_weighted_risk: 8.5, sentiment_nss: 71.4, impact_weighted_sentiment: 68.9, confidence_weighted_sentiment: 72.1, composite_sentiment_index: 70.2, sentiment_velocity: 12.4, risk_level: "LOW" as const, sector_classification: "Opportunity" as const, avg_impact: 5.8, total_mentions: 3, benchmark_index: 29.7, valence: 0.78, arousal: 0.31 },
  { sector: "Energy", avg_weighted_risk: 38.0, sentiment_nss: -45.0, impact_weighted_sentiment: -52.3, confidence_weighted_sentiment: -48.7, composite_sentiment_index: -50.1, sentiment_velocity: -22.1, risk_level: "HIGH" as const, sector_classification: "Monitor Risk" as const, avg_impact: 7.8, total_mentions: 5, benchmark_index: 58.2, valence: 0.18, arousal: 0.88 },
  { sector: "FMCG", avg_weighted_risk: 12.0, sentiment_nss: 40.0, impact_weighted_sentiment: 38.4, confidence_weighted_sentiment: 41.2, composite_sentiment_index: 39.6, sentiment_velocity: 4.1, risk_level: "LOW" as const, sector_classification: "Opportunity" as const, avg_impact: 4.4, total_mentions: 3, benchmark_index: 24.3, valence: 0.68, arousal: 0.28 },
  { sector: "Startup", avg_weighted_risk: 0.0, sentiment_nss: 100.0, impact_weighted_sentiment: 88.4, confidence_weighted_sentiment: 91.2, composite_sentiment_index: 91.8, sentiment_velocity: 8.3, risk_level: "LOW" as const, sector_classification: "Opportunity" as const, avg_impact: 3.8, total_mentions: 2, benchmark_index: 21.0, valence: 0.92, arousal: 0.22 },
  { sector: "Manufacturing", avg_weighted_risk: 18.0, sentiment_nss: 20.0, impact_weighted_sentiment: 14.2, confidence_weighted_sentiment: 17.8, composite_sentiment_index: 15.9, sentiment_velocity: -3.2, risk_level: "MEDIUM" as const, sector_classification: "Monitor Risk" as const, avg_impact: 5.1, total_mentions: 3, benchmark_index: 35.4, valence: 0.54, arousal: 0.55 },
];

export const headlinesData = [
  { title: "Trump's Big U-Turn On Strait of Hormuz", sector: "Geopolitics", sentiment: "negative" as const, sentiment_confidence: 0.94, impact_score: 9, z_score: 2.8, shock_status: "Major Shock" as const, one_line_insight: "Energy supply chain risk elevated — Indian crude import costs may spike in Q2.", geopolitical_risk: true, affected_companies: ["ONGC", "IOC"] },
  { title: "Rising crude prices may push US towards recession warns Moody's", sector: "Energy", sentiment: "negative" as const, sentiment_confidence: 0.91, impact_score: 8, z_score: 2.1, shock_status: "Shock" as const, one_line_insight: "Downstream pressure on Indian FMCG and manufacturing margins likely.", geopolitical_risk: true, affected_companies: ["Reliance", "BPCL"] },
  { title: "Analysts revise AI hyperscaler debt forecasts after Amazon bond sale", sector: "IT", sentiment: "neutral" as const, sentiment_confidence: 0.72, impact_score: 7, z_score: 1.1, shock_status: "Normal" as const, one_line_insight: "Indian IT majors with hyperscaler exposure face revised earnings estimates.", geopolitical_risk: false, affected_companies: ["Infosys", "TCS"] },
  { title: "SBI Mutual Fund picks up 4% stake in Urban Company via bulk deals", sector: "Startup", sentiment: "positive" as const, sentiment_confidence: 0.88, impact_score: 6, z_score: 0.4, shock_status: "Normal" as const, one_line_insight: "Institutional confidence in Indian gig-economy startups remains strong.", geopolitical_risk: false, affected_companies: ["Urban Company"] },
  { title: "RBL Bank appointed collecting banker to first IPO from GIFT IFSC", sector: "Banking", sentiment: "positive" as const, sentiment_confidence: 0.85, impact_score: 6, z_score: 0.3, shock_status: "Normal" as const, one_line_insight: "GIFT IFSC gaining momentum as India's international financial hub.", geopolitical_risk: false, affected_companies: ["RBL Bank"] },
  { title: "SEBI proposes modified nomination norms for Demat and Mutual Fund accounts", sector: "Banking", sentiment: "neutral" as const, sentiment_confidence: 0.79, impact_score: 5, z_score: -0.2, shock_status: "Normal" as const, one_line_insight: "Regulatory tightening — compliance burden increases for brokers.", geopolitical_risk: false, affected_companies: [] },
  { title: "Swan Defence OFS opens tomorrow as company bets on maritime tailwinds", sector: "Manufacturing", sentiment: "positive" as const, sentiment_confidence: 0.81, impact_score: 5, z_score: 0.1, shock_status: "Normal" as const, one_line_insight: "Defence manufacturing momentum continues — watch mid-cap defence space.", geopolitical_risk: false, affected_companies: ["Swan Defence"] },
];

export const correlationMatrix = {
  sectors: ["Geopolitics", "IT", "Banking", "Energy", "FMCG", "Startup", "Manufacturing"],
  values: [
    [1.00, 0.72, -0.45, 0.88, -0.31, -0.52, 0.61],
    [0.72, 1.00, -0.28, 0.65, -0.18, -0.39, 0.44],
    [-0.45, -0.28, 1.00, -0.52, 0.71, 0.68, -0.33],
    [0.88, 0.65, -0.52, 1.00, -0.44, -0.58, 0.74],
    [-0.31, -0.18, 0.71, -0.44, 1.00, 0.62, -0.21],
    [-0.52, -0.39, 0.68, -0.58, 0.62, 1.00, -0.41],
    [0.61, 0.44, -0.33, 0.74, -0.21, -0.41, 1.00],
  ],
};

export const contagionFlows = [
  { source: "Geopolitical Event", target: "Energy", value: 8.5 },
  { source: "Geopolitical Event", target: "Manufacturing", value: 6.2 },
  { source: "Geopolitical Event", target: "FMCG", value: 4.8 },
  { source: "Geopolitical Event", target: "Banking", value: 3.1 },
  { source: "Geopolitical Event", target: "IT", value: 2.4 },
];

export const paretoData = [
  { sector: "Geopolitics", risk: 50.0, cumulative_pct: 29.4 },
  { sector: "IT", risk: 42.0, cumulative_pct: 54.1 },
  { sector: "Energy", risk: 38.0, cumulative_pct: 76.5 },
  { sector: "Manufacturing", risk: 18.0, cumulative_pct: 87.1 },
  { sector: "FMCG", risk: 12.0, cumulative_pct: 94.1 },
  { sector: "Banking", risk: 8.5, cumulative_pct: 99.1 },
  { sector: "Startup", risk: 0.0, cumulative_pct: 100.0 },
];

export const velocityTrend = [
  { run: 1, Geopolitics: -8.2, IT: 2.1, Banking: 14.3, Energy: -12.4, FMCG: 6.2, Startup: 18.1, Manufacturing: 3.4 },
  { run: 2, Geopolitics: -14.1, IT: -1.2, Banking: 18.9, Energy: -28.3, FMCG: 8.1, Startup: 22.4, Manufacturing: 1.2 },
  { run: 3, Geopolitics: -22.4, IT: -4.8, Banking: 21.2, Energy: -38.7, FMCG: 9.4, Startup: 28.3, Manufacturing: -1.8 },
  { run: 4, Geopolitics: -29.8, IT: -6.2, Banking: 24.8, Energy: -44.2, FMCG: 8.8, Startup: 31.2, Manufacturing: -3.2 },
  { run: 5, Geopolitics: -34.1, IT: -8.4, Banking: 28.1, Energy: -50.1, FMCG: 7.9, Startup: 34.6, Manufacturing: -4.8 },
];

export const riskTrendData = [
  { day: "Day 1", Geopolitics: 45, IT: 38, Banking: 10, Energy: 30, FMCG: 14, Startup: 3, Manufacturing: 20 },
  { day: "Day 2", Geopolitics: 48, IT: 40, Banking: 9, Energy: 34, FMCG: 13, Startup: 1, Manufacturing: 19 },
  { day: "Day 3", Geopolitics: 50, IT: 42, Banking: 8.5, Energy: 38, FMCG: 12, Startup: 0, Manufacturing: 18 },
];

export const chatMessages = [
  { role: "assistant" as const, content: "Good morning! I'm your MarketPulse AI assistant. I analyze today's live news and market data to give you actionable trading insights. Every answer is grounded in today's analyzed headlines using RAG — not generic AI knowledge. What would you like to know?", sources: [] as string[] },
];

export const exampleQuestions = [
  "Why is geopolitical risk elevated today?",
  "Which sectors should I avoid this session?",
  "What does today's crude oil news mean for Nifty?",
];

export const marketMood = {
  sentiment: "Risk Off" as const,
  nss: -12,
};

export const geopoliticalEvents = headlinesData.filter(h => h.geopolitical_risk).map((h, i) => ({
  id: i + 1,
  ...h,
}));

export const aboutConcepts = [
  { title: "Weighted Risk Scoring", what: "Each headline receives a risk score calculated by multiplying impact score by a sentiment multiplier by a sector weight by a geopolitical bonus. Sector weights reflect structural market importance — Banking and Energy carry higher weights than Retail because their risk cascades further through the economy.", why: "Allows traders to compare risk across sectors on a normalized scale. A high weighted risk score means that sector deserves attention before the market opens.", where: "Morning Brief metric cards, Sector Watchlist risk bar chart, Pareto Risk Concentration chart." },
  { title: "Net Sentiment Score (NSS)", what: "Adapted from the Net Promoter Score methodology. Formula: (%positive headlines − %negative headlines) × 100. Range −100 to +100. A score of +71 in Banking means 71% more positive signals than negative.", why: "Simple and fast but treats all headlines as equal weight. Good for a quick pulse check but can be misleading if one catastrophic headline is buried under many mild positive ones.", where: "Sector Watchlist NSS bar chart, Sector Scorecard table, Sentiment Lab comparison cards." },
  { title: "Impact-Weighted Sentiment Score", what: "Improvement on NSS. Weights each headline's sentiment by its impact score so a catastrophic negative headline (impact 9) moves the score more than a mild negative one (impact 2).", why: "More accurate reflection of true market mood. Prevents the 'many mild positives masking one catastrophic negative' problem.", where: "Sentiment Lab comparison cards, Sentiment Divergence chart, Sector Scorecard." },
  { title: "Confidence-Weighted Sentiment Score", what: "The AI model returns a confidence score from 0 to 1 alongside each sentiment classification. Headlines where the AI is uncertain (confidence 0.4) contribute less to the final score than headlines where the classification is clear (confidence 0.95).", why: "Reduces noise from ambiguous headlines. A headline that could be positive or negative shouldn't carry the same weight as one that's clearly negative.", where: "Sentiment Lab comparison cards, feeds into Composite Sentiment Index." },
  { title: "Composite Sentiment Index (CSI)", what: "Weighted combination of all three sentiment methods: 25% NSS, 50% impact-weighted, 25% confidence-weighted. The most reliable single sentiment number on the platform.", why: "Used as the primary sentiment input for regime classification and velocity calculation. Traders who only look at one number should look at CSI.", where: "Sentiment Velocity chart, Market Regime classification, Sector Scorecard." },
  { title: "Sentiment Velocity", what: "Rate of change of the Composite Sentiment Index across pipeline runs. A sector moving from −80 to −20 CSI in 48 hours is recovering. A sector moving from +60 to +20 is deteriorating.", why: "Velocity predicts turning points before they show up in price action. A sector with negative CSI but positive velocity is recovering and may present a buying opportunity.", where: "Sentiment Lab velocity chart, Sector Scorecard, Sector Watchlist velocity arrows." },
  { title: "Sentiment Divergence", what: "When NSS and Impact-Weighted Score point in opposite directions for the same sector, a divergence flag is raised. This typically means a high volume of mild positive headlines is masking one or two severe negative ones.", why: "A hidden risk signal that simple sentiment averages miss entirely. High divergence sectors deserve immediate attention.", where: "Sentiment Lab divergence chart, flagged in Sector Scorecard." },
  { title: "Valence-Arousal Model", what: "Two-dimensional sentiment framework. Valence measures positive vs negative polarity. Arousal measures calm vs alarming urgency. A rate cut headline is positive low-arousal. A sudden geopolitical escalation is negative high-arousal.", why: "Both dimensions together give a richer picture than polarity alone. A sector in the 'Negative Alarming' quadrant requires immediate risk management.", where: "Sentiment Lab valence-arousal scatter plot." },
  { title: "Z-Score News Shock Detection", what: "Statistical outlier detection using standard deviation. When a headline's impact score is more than 1.5 standard deviations above its sector's rolling average, it is classified as a Shock. Above 2.5 standard deviations is a Major Shock.", why: "Separates signal from noise the same way quantitative funds do. Most headlines are noise — shocks are signal.", where: "Morning Brief headlines table shock column, Geopolitical Tracker shock scatter plot." },
  { title: "Pareto Risk Concentration (80/20 Analysis)", what: "Identifies which minority of sectors are driving the majority of total market risk on any given day.", why: "Traders with limited attention should monitor the sectors in the top 80% of cumulative risk first. Classic operations management principle applied to market intelligence.", where: "Morning Brief Pareto chart." },
  { title: "BCG Matrix Sector Classification", what: "Sectors plotted on impact vs risk axes and classified into four strategic quadrants borrowed from BCG's Growth-Share Matrix: Watch Closely (high impact, high risk), Opportunity (high impact, low risk), Monitor Risk (low impact, high risk), Low Priority (low impact, low risk).", why: "Gives traders an immediate strategic view of where to focus. 'Watch Closely' sectors need hedging, 'Opportunity' sectors need accumulation.", where: "Sector Watchlist BCG scatter plot, Sector Scorecard classification column." },
  { title: "Sector Correlation Matrix", what: "Statistical Pearson correlation between sector sentiment movements over time. Identifies which sectors move together (high positive correlation) and which are independent.", why: "Portfolio diversification principle applied to news exposure monitoring. If Geopolitics and Energy have 0.88 correlation, a geopolitical shock will cascade into energy.", where: "Sector Watchlist correlation heatmap." },
  { title: "Geopolitical Contagion Mapping", what: "Sankey diagram showing how geopolitical events cascade across sectors. Flow thickness represents average impact score.", why: "Helps traders anticipate second-order effects — a Hormuz crisis hits Energy first, then cascades to Manufacturing and FMCG through input cost channels.", where: "Geopolitical Tracker contagion Sankey diagram." },
  { title: "Market Regime Classification", what: "Combines Composite Sentiment Index, Weighted Risk Score, and Sentiment Velocity into one of four market regimes: Risk On (broad bullish sentiment, low systemic risk — momentum trades favored), Complacent (positive headlines masking elevated risk — watch for reversal), Risk Off (cautious market — capital preservation over momentum), Panic (widespread negative sentiment with high systemic risk — defensive positioning).", why: "Regime changes are the most actionable signal on the platform. A shift from 'Complacent' to 'Risk Off' is a clear signal to reduce exposure.", where: "Morning Brief regime banner, sidebar mood indicator." },
  { title: "Retrieval Augmented Generation (RAG)", what: "The Ask AI chat does not use generic AI knowledge. Today's analyzed headlines are injected as context into every query. Every response is grounded in real timestamped news data, not hallucinated market information.", why: "This is how enterprise AI tools are built in production environments. Generic AI answers are dangerous for trading decisions.", where: "Ask AI chat page — every response includes source citations." },
];
