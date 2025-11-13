import { useEffect, useState } from "react";
import { useGameHelpers } from "./../hooks/useGameHelpers";

import { CardView, PlayingCard } from "./CardView";
import type { Card } from "../types";

export default function War() {
  const [flipped, setFlipped] = useState(true);
  const toggleFlipped = () => setFlipped((prev) => !prev);

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

  const players = ["A", "B"];

  useEffect(() => {
    handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay =
    cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;
  const actionLabel = cardA && cardB ? (warRound ? "Resolve War" : "Clear Hand") : "Play Round";
  const canPlay = deckA.length > 0 && deckB.length > 0;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold/70">
            Round {Math.max(roundNumber, 0) + 1}
          </p>
          {/* <h2 className="text-4xl font-display text-white">War</h2>
          <p className="text-sm text-white/70">
            Round {Math.max(roundNumber, 0) + 1}
          </p> */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {players.map((p) => (
          <DisplayPlayerDeck
            key={p}
            player={p}
            cardA={cardA}
            cardB={cardB}
            handleRound={handleRound}
            handleWar={handleWar}
            handleClear={handleClear}
            prevDeckA={prevDeckA}
            prevDeckB={prevDeckB}
            warRound={warRound}
            winningPlayer={prevWinningPlayer}
            prevBonus={prevBonus}
            flipped={flipped}
            setFlipped={toggleFlipped}
          />
        ))}
      </div>

      {bonus && bonus.length > 0 && (
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
  flipped,
  setFlipped,
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
  flipped: boolean;
  setFlipped: () => void;
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

  const currentCard = player === "A" ? cardA : cardB;
  const opponentCard = player === "A" ? cardB : cardA;
  const hasFaceoff = Boolean(cardA && cardB);

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">
            Player {player}
          </p>
          {winner && (
            <p className="text-sm font-semibold text-gold">Won last battle</p>
          )}
        </div>
        <span className="card-total">{cards.length}</span>
      </div>

      <div
        className="flex flex-wrap items-start gap-2 cursor-pointer"
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

      {hasFaceoff && currentCard && opponentCard && (
        <div className="flex items-center gap-4">
          <PlayingCard
            flipped={flipped}
            setFlipped={setFlipped}
            frontImg={currentCard.image}
            handlePlay={handlePlay}
          />
          {!flipped && winner && (
            <span className="rounded-full border border-gold/50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-gold">
              Winner
            </span>
          )}
        </div>
      )}
    </section>
  );
}
