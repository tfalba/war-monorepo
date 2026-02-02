import deckBack from "./../assets/new-card-back.png";
import type { Card } from "../types";

type CardVariant = "stack" | "display" | "battle";

const cardLabel = (card: Card) =>
  `${card ? `${card.rank ?? card.num ?? ""}${card.suit ?? ""}` : ""}`;

const variantClassMap: Record<CardVariant, string> = {
  stack:
    "h-20 rounded-xl border border-gold/40 shadow-card card",
  display:
    "h-48 w-32 rounded-2xl shadow-card overflow-hidden not-first:-ml-36 md:not-first:-ml-26 not-first:z-10",
  battle:
    "h-36 w-24 rounded-2xl border border-gold/60 bg-white shadow-card overflow-hidden p-1",
};

export function CardView({
  card,
  variant = "stack",
  showCard = false,
  className = "",
}: {
  card: Card;
  variant?: CardVariant;
  showCard?: boolean;
  className?: string;
}) {
  const txt = cardLabel(card);

  return (
    <div className={`${variantClassMap[variant]} ${className}`}>
      <img
        className="h-full w-full rounded-[inherit] object-cover"
        src={showCard ? card?.image : deckBack}
        alt={showCard ? txt : "Card back"}
      />
    </div>
  );
}
