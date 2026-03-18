import { useState, useEffect } from "react";
import { Shield } from "lucide-react";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("mp-disclaimer-seen");
    if (!seen) setOpen(true);
  }, []);

  const accept = () => {
    localStorage.setItem("mp-disclaimer-seen", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Disclaimer & Terms of Use</h2>
        </div>

        <div className="space-y-3 text-sm text-secondary-foreground leading-relaxed">
          <p>MarketPulse AI is an independent analytical platform designed to assist traders in organizing and interpreting publicly available news information. It is not a SEBI-registered investment advisor, research analyst, or financial services provider.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">Not Financial Advice</h3>
          <p>Nothing on this platform — including sentiment scores, risk classifications, market regime indicators, AI-generated briefs, sector analysis, geopolitical risk flags, or any other output — constitutes financial advice, investment advice, trading recommendations, or solicitation to buy or sell any security, derivative, commodity, or financial instrument.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">All Risk Lies With the Trader</h3>
          <p>All trading and investment decisions are made solely at the discretion and risk of the user. MarketPulse AI bears no responsibility for any financial losses, missed opportunities, or adverse outcomes arising from the use of or reliance on any information displayed on this platform.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">Analytical Limitations</h3>
          <p>All sentiment scores, risk metrics, and classifications are derived from automated analysis of news headlines using natural language processing and predefined quantitative frameworks. These methods have inherent limitations including but not limited to: incomplete news coverage, AI classification errors, model hallucination, data latency, survivorship bias in news sources, and inability to account for information not present in the analyzed headlines.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">No Guarantee of Accuracy</h3>
          <p>News sources are fetched via RSS feeds and analyzed automatically. MarketPulse AI does not verify the accuracy, completeness, or timeliness of any news content. Sentiment classifications, impact scores, and risk ratings are probabilistic estimates and may not reflect actual market conditions.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">Not a Substitute for Professional Judgment</h3>
          <p>This platform is intended as one input among many in a trader's research process. It should never be the sole basis for any trading decision. Users are strongly advised to conduct their own due diligence, consult SEBI-registered advisors where appropriate, and apply their own judgment to all information presented here.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">Forward-Looking Limitations</h3>
          <p>Sentiment analysis and market regime classification are backward-looking and based on currently available information. They do not predict future price movements, market direction, or the behavior of any financial instrument.</p>

          <h3 className="text-foreground font-semibold text-sm mt-4">Data Sources</h3>
          <p>News data is sourced from publicly available RSS feeds of Indian and global business news publications. MarketPulse AI does not claim ownership of or responsibility for any third-party content.</p>

          <p className="text-muted-foreground italic mt-4">By using this platform, you acknowledge that you have read, understood, and agreed to these terms.</p>
        </div>

        <button
          onClick={accept}
          className="w-full mt-4 px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          I understand, continue
        </button>
      </div>
    </div>
  );
}
