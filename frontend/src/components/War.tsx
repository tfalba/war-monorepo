import { useEffect, useState } from "react";
import { useGameHelpers } from "./../hooks/useGameHelpers";

import { CardView } from "./CardView";
import type { Card } from "../types";
import deckBack from "./../assets/new-card-back.png";

const FACE_LOOKUP: Record<string, number> = {
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function getCardValue(card: Card | null): number {
  if (!card) return 0;
  if (typeof card.num === "number") return card.num;
  if (typeof card.rank === "number") return card.rank;
  if (typeof card.rank === "string") {
    if (card.rank in FACE_LOOKUP) {
      return FACE_LOOKUP[card.rank];
    }
    const numericRank = Number(card.rank);
    return Number.isNaN(numericRank) ? 0 : numericRank;
  }
  return 0;
}

function determineWinner(cardA: Card | null, cardB: Card | null) {
  const valueA = getCardValue(cardA);
  const valueB = getCardValue(cardB);
  if (valueA === valueB) return "tie";
  return valueA > valueB ? "A" : "B";
}

export default function War() {
  const [battleRevealed, setBattleRevealed] = useState(false);
  const [battleEntering, setBattleEntering] = useState(false);

  const {
    handleStart,
    handleClear,
    handleRound,
    handleWar,
    deckA,
    deckB,
    prevDeckA,
    prevDeckB,
    cardA,
    cardB,
    bonus,
    prevBonus,
    warRound,
    prevWinningPlayer,
    roundNumber,
  } = useGameHelpers();

  useEffect(() => {
    handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playRoundWithFade = () => {
    if (!canPlay) return;
    setBattleEntering(true);
    void handleRound();
  };

  const resolveWarWithFade = () => {
    setBattleEntering(true);
    void handleWar();
  };

  const handlePlay =
    cardA && cardB ? (warRound ? resolveWarWithFade : handleClear) : playRoundWithFade;
  const actionLabel =
    cardA && cardB ? (warRound ? "Resolve War" : "Clear Hand") : "Play Round";
  const canPlay = deckA.length > 0 && deckB.length > 0;
  const showBattle = Boolean(cardA && cardB);

  useEffect(() => {
    setBattleRevealed(false);
  }, [cardA, cardB]);

  useEffect(() => {
    if (!battleEntering) return;
    const timeout = setTimeout(() => setBattleEntering(false), 450);
    return () => clearTimeout(timeout);
  }, [battleEntering]);

  // useEffect(() => {
  //   if (!cardA || !cardB) {
  //     setBattleEntering(false);
  //   }
  // }, [cardA, cardB]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold uppercase tracking-[0.35em] text-gold/90">
            Round {Math.max(roundNumber, 0) + 1}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-outline" onClick={handleStart}>
            {roundNumber > 0 ? "Restart Game" : "Start Game"}
          </button>
          <button className="btn btn-primary" onClick={handlePlay} disabled={!canPlay}>
            {actionLabel}
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(290px,0.8fr)_1fr]">
        <DisplayPlayerDeck
          player="A"
          cardA={cardA}
          cardB={cardB}
          handleRound={playRoundWithFade}
          handleWar={resolveWarWithFade}
          handleClear={handleClear}
          prevDeckA={prevDeckA}
          prevDeckB={prevDeckB}
          warRound={warRound}
          winningPlayer={prevWinningPlayer}
          prevBonus={prevBonus}
        />

        <BattleArena
          cardA={cardA}
          cardB={cardB}
          warRound={warRound}
          showBattle={showBattle}
          battleRevealed={battleRevealed}
          battleEntering={battleEntering}
          onReveal={() => setBattleRevealed(true)}
          onClear={handleClear}
          onDeal={playRoundWithFade}
          canPlay={canPlay}
          onResolveWar={resolveWarWithFade}
        />

        <DisplayPlayerDeck
          player="B"
          cardA={cardA}
          cardB={cardB}
          handleRound={playRoundWithFade}
          handleWar={resolveWarWithFade}
          handleClear={handleClear}
          prevDeckA={prevDeckA}
          prevDeckB={prevDeckB}
          warRound={warRound}
          winningPlayer={prevWinningPlayer}
          prevBonus={prevBonus}
        />
      </div>

      {bonus &&
        bonus.length > 0 &&
        (!warRound || (warRound && battleRevealed)) && (
        <div className="rounded-3xl border border-gold/25 bg-black/30 p-4 shadow-soft">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Bonus pile ({bonus.length})
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bonus.map((c, i) => (
              <CardView key={i} idx={i} card={c} variant="stack" showCard />
            ))}
          </div>
        </div>
        )}
    </section>
  );
}

function DisplayPlayerDeck({
  player,
  cardA,
  cardB,
  handleRound,
  handleWar,
  handleClear,
  prevDeckA,
  prevDeckB,
  warRound,
  winningPlayer,
  prevBonus,
}: {
  player: string;
  cardA: Card | null;
  cardB: Card | null;
  handleRound: () => void;
  handleWar: () => void;
  handleClear: () => void;
  prevDeckA: Card[];
  prevDeckB: Card[];
  warRound: boolean;
  winningPlayer: string | null;
  prevBonus: Card[];
}) {
  const cards = player === "A" ? prevDeckA : prevDeckB;
  const winner = winningPlayer === player;
  const handlePlay =
    cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;

  const showCardStatus = (card: Card, index: number, variant: "stack" | "display") =>
    Boolean(
      card &&
        index < prevBonus.length + 2 &&
        (winner || variant === "display")
    );

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg uppercase tracking-[0.35em] text-white/90 font-semibold">
            Player {player}
          </p>
          {winner && (
            <p className="text-sm font-semibold text-gold">Won last battle</p>
          )}
        </div>
        <span className="card-total">{cards.length}</span>
      </div>

      <div
        // className="flex flex-wrap items-start gap-2 cursor-pointer"
        className="deck"
        onClick={handlePlay}
      >
        {[...cards].reverse().map((c, i) => (
          <CardView
            key={i}
            card={c}
            idx={i}
            variant="stack"
            showCard={showCardStatus(c, i, "stack")}
          />
        ))}
      </div>
    </section>
  );
}

function BattleArena({
  cardA,
  cardB,
  warRound,
  showBattle,
  battleRevealed,
  battleEntering,
  onReveal,
  onClear,
  onDeal,
  canPlay,
  onResolveWar,
}: {
  cardA: Card | null;
  cardB: Card | null;
  warRound: boolean;
  showBattle: boolean;
  battleRevealed: boolean;
  battleEntering: boolean;
  onReveal: () => void;
  onClear: () => void;
  onDeal: () => void;
  canPlay: boolean;
  onResolveWar: () => void;
}) {
  const hasBattle = Boolean(showBattle && cardA && cardB);
  const baseContainer =
    "flex flex-col items-center gap-5 rounded-3xl border p-6 text-center shadow-soft relative overflow-hidden transition-colors duration-500";
  const containerClass = hasBattle
    ? `${baseContainer} border-gold/40 ${
        battleEntering ? "bg-black/20" : "bg-black/40"
      }`
    : `${baseContainer} border-gold/25 text-white/80`;
  const winner =
    hasBattle && battleRevealed ? determineWinner(cardA, cardB) : null;

  return (
    <div className={containerClass}>
      {warRound && battleRevealed && (
        <div className="pointer-events-none absolute left-1/2 top-38 z-10 -translate-x-1/2 rotate-[-18deg] rounded-full bg-chipRed px-6 py-1 text-xs font-bold uppercase tracking-[0.6em] text-white shadow-card">
          WAR
        </div>
      )}
      <p className={`text-lg uppercase font-semibold tracking-[0.35em] pb-5 ${hasBattle ? "text-gold" : ""}`}>
        {hasBattle ? (warRound ? "WAR!" : "Battlefield") : "Battlefield"}
      </p>
      <div
        className={`flex min-h-[150px] w-full items-center justify-center gap-3 transition-opacity duration-500 ${
          battleEntering ? "opacity-100" : "opacity-100"
        }`}
      >
        {hasBattle && cardA && cardB ? (
          <>
            <FlipCard
              card={cardA}
              flipped={battleRevealed}
              highlight={winner === "A"}
              direction="left"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">
              VS
            </span>
            <FlipCard
              card={cardB}
              flipped={battleRevealed}
              highlight={winner === "B"}
              direction="right"
            />
          </>
        ) : (
          <p className="text-sm text-white/70">Deal cards to start the next battle.</p>
        )}
      </div>
      <div className="flex w-full flex-col gap-3">
        {hasBattle ? (
          <>
            <button
              className="btn btn-primary"
              onClick={onReveal}
              disabled={battleRevealed}
            >
              {battleRevealed ? "Outcome Revealed" : "Reveal Outcome"}
            </button>
            {battleRevealed && (
              <button
                className="btn btn-outline"
                onClick={warRound ? onResolveWar : onClear}
              >
                {warRound ? "Resolve War" : "Clear Hand"}
              </button>
            )}
            {warRound && battleRevealed && (
              <p className="text-xs text-gold/80">
                Place extra cards to resolve war.
              </p>
            )}
          </>
        ) : (
          canPlay && (
            <button className="btn btn-accent" onClick={onDeal}>
              Deal Next Battle
            </button>
          )
        )}
      </div>
    </div>
  );
}

function FlipCard({
  card,
  flipped,
  highlight,
  direction = "left",
}: {
  card: Card;
  flipped: boolean;
  highlight?: boolean;
  direction?: "left" | "right";
}) {
  return (
    <div className="scene relative h-36 w-24">
      {highlight && <WinnerArrow direction={direction} />}
      <div className={`card-flip ${flipped ? "is-flipped" : ""}`}>
        <div className="card__face card__face--front">
          <img src={deckBack} alt="Card back" />
        </div>
        <div className="card__face card__face--back">
          <img src={card.image} alt="Card front" />
        </div>
      </div>
    </div>
  );
}

function WinnerArrow({ direction }: { direction: "left" | "right" }) {
  const arrowClass = direction === "left" ? "scale-x-[-1]" : "";

  return (
    <div
      className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emeraldDeep shadow-soft"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={arrowClass}
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Win
    </div>
  );
}
