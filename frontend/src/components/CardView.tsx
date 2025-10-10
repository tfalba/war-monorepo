import type { Card } from "../api";
import deckBack from "./../assets/back-deck-new.png";

const face: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const show = (c: Card) => `${c ? (face[c.num] ?? c.num) + c.suit : null}`;

export function CardView({
  card,
  className,
  game = "War",
  showCard = false,
}: {
  card: Card;
  className?: string;
  game?: string;
  showCard?: boolean;
}) {
  const txt = show(card);
  const deckSpace = game === "War" ? -58 : -68;

  return (
    <div
      className={`${className}`}
      style={{ marginLeft: `${deckSpace}px` }}
    >
      <img
        src={showCard ? card?.image : deckBack}
        alt={showCard ? txt : "deck back"}
      />
    </div>
  );
}
