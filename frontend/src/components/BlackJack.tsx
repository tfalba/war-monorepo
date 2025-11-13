import { useCallback, useEffect, useState, type ReactNode } from "react";
import { bjStart, bjRound } from "./../api";
import { CardView } from "./CardView";
import type { BJDeckState, Card } from "../types";

const cardValue: Record<number, number> = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 10,
  12: 10,
  13: 10,
  14: 11,
};

const faceLookup: Record<string, number> = {
  J: 10,
  Q: 10,
  K: 10,
  A: 11,
};

const calcValue = (card: Card | null) => {
  if (!card) return 0;
  if (typeof card.num === "number") {
    return cardValue[card.num] ?? 0;
  }
  if (typeof card.rank === "number") {
    return cardValue[card.rank] ?? 0;
  }
  if (typeof card.rank === "string") {
    if (card.rank in faceLookup) {
      return faceLookup[card.rank];
    }
    const numericRank = Number(card.rank);
    return Number.isNaN(numericRank) ? 0 : numericRank;
  }
  return 0;
};

export default function BlackJack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardDeck, setDiscardDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [showDealer, setShowDealer] = useState(false);

  const totalValue = (cards: Card[]) =>
    cards.reduce((total, card) => total + calcValue(card), 0);

  function clearRound() {
    if (playerCards.length === 0 && dealerCards.length === 0) return;
    setDiscardDeck((prev) => [...playerCards, ...dealerCards, ...prev]);
    handleClear();
  }

  const handleClear = useCallback(() => {
    setPlayerCards([]);
    setDealerCards([]);
    setShowDealer(false);
  }, []);

  const handleStart = useCallback(async () => {
    setDeck([]);
    setDiscardDeck([]);
    handleClear();
    const data = await bjStart();
    setDeck(data.deck ?? []);
  }, [handleClear]);

  useEffect(() => {
    void handleStart();
  }, [handleStart]);

  async function handleDeal() {
    if (deck.length === 0) return;
    const payload: BJDeckState = { deck };
    const data = await bjRound(payload);
    setDeck(data.deck ?? []);
    setPlayerCards(data.playerCards ?? []);
    setDealerCards(data.dealerCards ?? []);
    setShowDealer(false);
  }

  function playDealer() {
    setShowDealer(true);
  }

  const canReveal =
    playerCards.length > 0 && dealerCards.length > 0 && !showDealer;
  const canClear =
    showDealer && (playerCards.length > 0 || dealerCards.length > 0);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold/70">
            Casino Mode
          </p>
          <h2 className="text-4xl font-display text-white">Blackjack</h2>
          <p className="text-sm text-white/70">
            Deck size: {deck.length.toString().padStart(2, "0")} cards
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-primary"
            onClick={handleDeal}
            disabled={deck.length === 0}
          >
            {playerCards.length === 0 ? "Deal Cards" : "Deal Next Round"}
          </button>
          <button
            className="btn btn-accent"
            onClick={playDealer}
            disabled={!canReveal}
          >
            Reveal Dealer
          </button>
          <button
            className="btn btn-outline"
            onClick={clearRound}
            disabled={!canClear}
          >
            Clear Table
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr,2fr]">
        <div className="space-y-6">
          <PilePanel title="Draw Pile" subtitle={`${deck.length} left`}>
            {[...deck].reverse().map((c, i) => (
              <CardView key={i} idx={i} card={c} variant="stack" />
            ))}
          </PilePanel>

          <PilePanel title="Discard" subtitle={`${discardDeck.length} burned`}>
            {[...discardDeck].reverse().map((c, i) => (
              <CardView key={i} idx={i} card={c} variant="stack" showCard />
            ))}
          </PilePanel>
        </div>

        <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <Hand
            label="Dealer"
            cards={dealerCards}
            total={totalValue(dealerCards)}
            showFirst={showDealer}
          />
          <Hand
            label="Player"
            cards={playerCards}
            total={totalValue(playerCards)}
            showFirst
          />
        </div>
      </div>
    </section>
  );
}

function PilePanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">
          {title}
        </p>
        {subtitle && <span className="text-sm text-white/60">{subtitle}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Hand({
  label,
  cards,
  total,
  showFirst,
}: {
  label: string;
  cards: Card[];
  total: number;
  showFirst?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.35em] text-white/70">
          {label}
        </p>
        {cards.length > 0 && <span className="card-total">{total}</span>}
      </div>
      <div className="flex flex-wrap gap-3">
        {cards.map((card, idx) => (
          <CardView
            key={`${label}-${idx}`}
            card={card}
            variant="display"
            showCard={idx === 0 ? showFirst : true}
          />
        ))}
      </div>
    </div>
  );
}
