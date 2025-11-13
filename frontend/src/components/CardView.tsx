import deckBack from "./../assets/new-card-back.png";
import type { Card } from "../types";

type CardVariant = "stack" | "display";

const cardLabel = (card: Card) =>
  `${card ? `${card.rank ?? card.num ?? ""}${card.suit ?? ""}` : ""}`;

const variantClassMap: Record<CardVariant, string> = {
  stack:
    "h-28 w-20 rounded-xl border border-white/10 bg-white/80 shadow-card overflow-hidden",
  display:
    "h-48 w-32 rounded-2xl border border-gold/40 bg-white shadow-card overflow-hidden p-1",
};

export function CardView({
  card,
  idx = 0,
  variant = "stack",
  showCard = false,
  className = "",
}: {
  card: Card;
  idx?: number;
  variant?: CardVariant;
  showCard?: boolean;
  className?: string;
}) {
  const txt = cardLabel(card);
  const overlap = variant === "stack" && idx > 0 ? -36 : 0;

  return (
    <div
      className={`${variantClassMap[variant]} ${className}`}
      style={{ marginLeft: overlap }}
    >
      <img
        className="h-full w-full rounded-[inherit] object-cover"
        src={showCard ? card?.image : deckBack}
        alt={showCard ? txt : "Card back"}
      />
    </div>
  );
}

export function PlayingCard({
  frontImg,
  flipped,
  setFlipped,
  handlePlay,
}: {
  frontImg: string;
  flipped: boolean;
  setFlipped: () => void;
  handlePlay: () => void;
}) {
  const handlePlayTmp = (isFlipped: boolean) => {
    setFlipped();
    if (!isFlipped) {
      handlePlay();
    }
  };

  return (
    <div
      className="scene"
      onClick={() => handlePlayTmp(flipped)}
      role="button"
      tabIndex={0}
    >
      <div className={`card ${flipped ? "is-flipped" : ""}`}>
        <div className="card__face card__face--front">
          <img src={frontImg} alt="Front of card" />
        </div>
        <div className="card__face card__face--back">
          <img src={deckBack} alt="Back of card" />
        </div>
      </div>
    </div>
  );
}
