import deckBack from "./../assets/new-card-back.png";
// import deckBack from "./../assets/black-red-white-riviera.png";
import type { Card } from "../types";

type CardVariant = "stack" | "display" | "battle";

const cardLabel = (card: Card) =>
  `${card ? `${card.rank ?? card.num ?? ""}${card.suit ?? ""}` : ""}`;

const variantClassMap: Record<CardVariant, string> = {
  stack:
    "h-28 rounded-xl border border-gold/40 shadow-card card",
  display:
    "h-48 w-32 rounded-2xl border border-gold/40 bg-white shadow-card overflow-hidden p-1",
  battle:
    "h-36 w-24 rounded-2xl border border-gold/60 bg-white shadow-card overflow-hidden p-1",
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
      // style={{ marginLeft: overlap }}
    >
      <img
        className="h-full w-full rounded-[inherit] object-cover"
        src={showCard ? card?.image : deckBack}
        alt={showCard ? txt : "Card back"}
      />
    </div>
  );
}
