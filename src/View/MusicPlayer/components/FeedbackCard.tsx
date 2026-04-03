interface FeedbackCardProps {
  kicker: string;
  summary: string;
  title: string;
  live?: boolean;
}

function FeedbackCard({ kicker, live = false, summary, title }: FeedbackCardProps) {
  return (
    <section
      aria-live={live ? "polite" : undefined}
      className="music-player-feedback-card"
    >
      <p className="home-kicker">{kicker}</p>
      <h2>{title}</h2>
      <p className="music-player-summary">{summary}</p>
    </section>
  );
}

export default FeedbackCard;
