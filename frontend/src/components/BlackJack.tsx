import { useCallback, useEffect, useState, type ReactNode } from "react";
import { bjStart, bjRound, bjHit, bjStand } from "./../api";
import { CardView } from "./CardView";
import type {
  BJDeckState,
  BJActionPayload,
  BJHandState,
  BlackjackStatus,
  Card,
} from "../types";

const statusCopy: Record<BlackjackStatus, string> = {
  "player-turn": "",
  "player-bust": "Player busts!",
  "player-win": "Player wins!",
  "dealer-win": "Dealer wins.",
  "dealer-bust": "Dealer busts!",
  push: "Push.",
};

export default function BlackJack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardDeck, setDiscardDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [status, setStatus] = useState<BlackjackStatus>("player-turn");
  const [revealDealer, setRevealDealer] = useState(false);
  const [message, setMessage] = useState("");

  const applyHandState = (hand: BJHandState) => {
    setDeck(hand.deck ?? []);
    setPlayerCards(hand.playerCards ?? []);
    setDealerCards(hand.dealerCards ?? []);
    setPlayerValue(hand.playerValue ?? 0);
    setDealerValue(hand.dealerValue ?? 0);
    setStatus(hand.status);
    setRevealDealer(hand.revealDealer ?? false);
    setMessage(hand.log ?? statusCopy[hand.status] ?? "");
  };

  const handleClear = useCallback(() => {
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerValue(0);
    setDealerValue(0);
    setStatus("player-turn");
    setRevealDealer(false);
    setMessage("");
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

  const roundPayload = (): BJActionPayload => ({
    deck,
    playerCards,
    dealerCards,
  });

  async function handleDeal() {
    if (deck.length === 0) return;
    const payload: BJDeckState = { deck };
    const data = await bjRound(payload);
    applyHandState(data);
  }

  async function handleHit() {
    if (status !== "player-turn") return;
    const data = await bjHit(roundPayload());
    applyHandState(data);
  }

  async function handleStand() {
    if (status !== "player-turn") return;
    const data = await bjStand(roundPayload());
    applyHandState(data);
  }

  function clearRound() {
    if (playerCards.length === 0 && dealerCards.length === 0) return;
    setDiscardDeck((prev) => [...playerCards, ...dealerCards, ...prev]);
    handleClear();
  }

  const canClear =
    playerCards.length > 0 && dealerCards.length > 0 && status !== "player-turn";
  const canDeal = deck.length >= 4;
  const canAct = status === "player-turn" && playerCards.length > 0;
  const dealerRevealed = revealDealer || status !== "player-turn";
  const bust = status === "player-bust";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold/70">
            Casino Mode
          </p>
          <h2 className="text-4xl font-display text-chipBlue text-outline-blue">
            Blackjack
          </h2>
          <p className="text-sm text-white/70">
            Deck size: {deck.length.toString().padStart(2, "0")} cards
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-primary"
            onClick={handleDeal}
            disabled={!canDeal}
          >
            {playerCards.length === 0 ? "Deal Cards" : "Deal Next Round"}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <PilePanel title="Draw Pile" subtitle={`${deck.length} left`}>
            {[...deck].reverse().map((c, i) => (
              <CardView key={`draw-${i}`} card={c} variant="stack" />
            ))}
          </PilePanel>

          <PilePanel title="Discard" subtitle={`${discardDeck.length} burned`}>
            {[...discardDeck].reverse().map((c, i) => (
              <CardView key={`discard-${i}`} card={c} variant="stack" showCard />
            ))}
          </PilePanel>
        </div>

        <div className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <Hand
            label="Dealer"
            cards={dealerCards}
            totalLabel={dealerRevealed ? dealerValue.toString() : "??"}
            showFirst={dealerRevealed}
          />
          <div className="space-y-4">
            <Hand
              label="Player"
              cards={playerCards}
              totalLabel={playerCards.length > 0 ? playerValue.toString() : undefined}
              showFirst
              highlight={bust ? "Bust" : undefined}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" onClick={handleHit} disabled={!canAct}>
                Hit
              </button>
              <button className="btn btn-outline" onClick={handleStand} disabled={!canAct}>
                Stand
              </button>
              {status !== "player-turn" && (
                <span className="rounded-full border border-gold/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                  {statusCopy[status] || "Round complete"}
                </span>
              )}
            </div>
            {message && (
              <p className="text-sm text-gold/80">
                {message}
              </p>
            )}
          </div>
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
    <div className="min-h-[200px] rounded-3xl border border-white/10 bg-black/30 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-white/70">
          {title}
        </p>
        {subtitle && <span className="text-sm text-white/60">{subtitle}</span>}
      </div>
      <div className="deck-bj">{children}</div>
    </div>
  );
}

function Hand({
  label,
  cards,
  totalLabel,
  showFirst,
  highlight,
}: {
  label: string;
  cards: Card[];
  totalLabel?: string;
  showFirst?: boolean;
  highlight?: string;
}) {
  const badge = highlight || (totalLabel ? `${totalLabel}` : undefined);
  return (
    <div className="flex-1">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.35em] text-white/70">
          {label}
        </p>
        {badge && (
          <span className="card-total px-4 py-2 text-base">
            {highlight ? highlight : totalLabel}
          </span>
        )}
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
