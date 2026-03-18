interface SentimentBadgeProps {
  sentiment: "positive" | "negative" | "neutral";
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const styles = {
    positive: "bg-bullish/15 text-bullish",
    negative: "bg-bearish/15 text-bearish",
    neutral: "bg-warning/15 text-warning",
  };

  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[sentiment]}`}>
      {sentiment}
    </span>
  );
}
