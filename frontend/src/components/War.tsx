import { useEffect, useState } from "react";
import { useGameHelpers } from "./../hooks/useGameHelpers";

import { CardView } from "./CardView";
import type { Card } from "../types";
import deckBack from "./../assets/new-card-back.png";
// import deckBack from "./../assets/black-red-white-riviera.png";

const FACE_LOOKUP: Record<string, number> = {
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const BANK_STORAGE_KEY = "bj_bank";
const WAR_BET_STORAGE_KEY = "war_bet";
const MIN_BET = 5;
const WIN_RATIO_EXPONENT = 0.45;

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

const getStoredBank = () => {
  if (typeof window === "undefined") return 1000;
  const storedBank = Number(window.localStorage.getItem(BANK_STORAGE_KEY));
  return Number.isFinite(storedBank) && storedBank > 0 ? storedBank : 1000;
};

const getStoredBet = () => {
  if (typeof window === "undefined") return MIN_BET;
  const storedBet = Number(window.localStorage.getItem(WAR_BET_STORAGE_KEY));
  return Number.isFinite(storedBet) && storedBet >= MIN_BET
    ? storedBet
    : MIN_BET;
};

const getWinMultiplier = (dealerCount: number, playerCount: number) => {
  if (dealerCount <= 0 || playerCount <= 0) return 1;
  const ratio = dealerCount / playerCount;
  return Math.pow(ratio, WIN_RATIO_EXPONENT);
};

export default function War() {
  const [battleRevealed, setBattleRevealed] = useState(false);
  const [battleEntering, setBattleEntering] = useState(false);
  const [bank, setBank] = useState(() => getStoredBank());
  const [bet, setBet] = useState(() => getStoredBet());
  const [activeBet, setActiveBet] = useState(0);
  const [betMessage, setBetMessage] = useState("");
  const [warSettled, setWarSettled] = useState(true);
  const [lastWinAmount, setLastWinAmount] = useState(0);

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
    winningPlayer,
    prevWinningPlayer,
    roundNumber,
    storageReady,
    hasStoredGame,
  } = useGameHelpers();

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(BANK_STORAGE_KEY, bank.toString());
  }, [bank]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(WAR_BET_STORAGE_KEY, bet.toString());
  }, [bet]);

  const clampBetValue = (value: number) => {
    if (bank <= 0) return 0;
    const next = Math.max(MIN_BET, Math.floor(value));
    return Math.min(next, bank);
  };

  useEffect(() => {
    if (!storageReady) return;
    if (hasStoredGame) return;
    handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, hasStoredGame]);

  const playRoundWithFade = () => {
    if (!canPlay) return;
    if (activeBet > 0) return;
    if (bet <= 0) {
      setBetMessage("Enter a bet to play.");
      return;
    }
    if (bet > bank) {
      setBetMessage("Bet exceeds bankroll.");
      return;
    }
    setBetMessage("");
    setLastWinAmount(0);
    setWarSettled(false);
    setBank((b) => b - bet);
    setActiveBet(bet);
    setBattleEntering(true);
    void handleRound();
  };

  const resolveWarWithFade = () => {
    if (bet <= 0) {
      setBetMessage("Enter a bet to continue the war.");
      return;
    }
    if (bet > bank) {
      setBetMessage("Need more bankroll to match the war bet.");
      return;
    }
    setBetMessage("");
    setLastWinAmount(0);
    setWarSettled(false);
    setBank((b) => b - bet);
    setActiveBet((prev) => prev + bet);
    setBattleEntering(true);
    void handleWar();
  };

  const handleReveal = () => {
    setBattleRevealed(true);
  };

  const handlePlay =
    cardA && cardB
      ? battleRevealed
        ? warRound
          ? resolveWarWithFade
          : handleClear
        : handleReveal
      : playRoundWithFade;
  const actionDetails: { label: string; class: string } =
    cardA && cardB
      ? battleRevealed
        ? warRound
          ? { label: "Resolve War", class: "btn-primary" }
          : { label: "Clear Hand", class: "btn-outline" }
        : { label: "Reveal Outcome", class: "btn-primary" }
      : { label: "Play Round", class: "btn-accent" };
  const canPlay = deckA.length > 0 && deckB.length > 0;
  const showBattle = Boolean(cardA && cardB);
  const canAdjustBet = activeBet === 0 && !showBattle;
  const winMultiplier = getWinMultiplier(deckA.length, deckB.length);
  const winYield = Math.floor(bet * winMultiplier);

  useEffect(() => {
    setBattleRevealed(false);
  }, [cardA, cardB]);

  useEffect(() => {
    if (!battleEntering) return;
    const timeout = setTimeout(() => setBattleEntering(false), 450);
    return () => clearTimeout(timeout);
  }, [battleEntering]);

  useEffect(() => {
    if (!battleRevealed || warRound) return;
    if (!winningPlayer || activeBet === 0 || warSettled) return;
    const wager = activeBet;
    const outcomeMultiplier = getWinMultiplier(deckA.length, deckB.length);
    const outcomeYield = Math.floor(wager * outcomeMultiplier);
    let payout = 0;
    let resultMessage = "Dealer wins.";
    if (winningPlayer === "B") {
      payout = wager + outcomeYield;
      resultMessage = `Player wins $${outcomeYield.toFixed(0)}.`;
      setLastWinAmount(outcomeYield);
    } else {
      setLastWinAmount(0);
    }
    setBank((b) => b + payout);
    setActiveBet(0);
    setWarSettled(true);
    setBetMessage(resultMessage);
  }, [
    activeBet,
    battleRevealed,
    deckA.length,
    deckB.length,
    warRound,
    warSettled,
    winningPlayer,
  ]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold/70">
            Classic Mode
          </p>
          <h2 className="text-4xl font-display text-chipBlue text-outline-blue">
            War
          </h2>
          <p className="text-sm text-white/70">
            Round {Math.max(roundNumber, 0) + 1}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-outline" onClick={handleStart}>
            {roundNumber > 0 ? "Restart Game" : "Start Game"}
          </button>
          <button
            className={`btn ${actionDetails.class}`}
            onClick={handlePlay}
            disabled={!canPlay}
          >
            {actionDetails.label}
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
          bank={bank}
          bet={bet}
          activeBet={activeBet}
          canAdjustBet={canAdjustBet}
          onBetChange={(value) => setBet(clampBetValue(value))}
          winYield={winYield}
          onAdjustBet={(delta) => {
            if (!canAdjustBet) return;
            setBet((prev) => clampBetValue(prev + delta));
          }}
          onClearBet={() => {
            if (!canAdjustBet) return;
            setBet(clampBetValue(MIN_BET));
          }}
          betMessage={betMessage}
          lastWinAmount={lastWinAmount}
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
              {bonus.map((c) => (
                <CardView
                  key={`${c.suit}-${c.rank}-${c.num}`}
                  card={c}
                  variant="stack"
                  showCard
                />
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
  const playerLabel = player === "A" ? "Dealer" : "Player";
  const handlePlay =
    cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;

  const showCardStatus = (
    card: Card,
    index: number,
    variant: "stack" | "display"
  ) =>
    Boolean(
      card && index < prevBonus.length + 2 && (winner || variant === "display")
    );

  return (
    <section className="z-20 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className=" uppercase tracking-[0.2em] text-paper/90 font-light">
            {playerLabel}
          </p>
          {winner && (
            <p className="text-sm font-semibold text-gold">Won last battle</p>
          )}
        </div>
        <span className="card-total">{cards.length}</span>
      </div>

      <div
        className="deck-war"
        onClick={handlePlay}
      >
        {[...cards].reverse().map((c, i) => (
          <CardView
            key={i}
            card={c}
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
  bank,
  bet,
  winYield,
  activeBet,
  canAdjustBet,
  onBetChange,
  onAdjustBet,
  onClearBet,
  betMessage,
  lastWinAmount,
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
  bank: number;
  bet: number;
  winYield: number;
  activeBet: number;
  canAdjustBet: boolean;
  onBetChange: (value: number) => void;
  onAdjustBet: (delta: number) => void;
  onClearBet: () => void;
  betMessage: string;
  lastWinAmount: number;
}) {
  const hasBattle = Boolean(showBattle && cardA && cardB);
  const baseContainer =
    "sticky top-0 flex flex-col items-center gap-5 rounded-3xl border p-6 text-center shadow-soft relative overflow-hidden transition-colors duration-500";
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
      <p
        className={`text-4xl font-display text-white font-display pb-5 ${
          hasBattle ? "text-outline-gold" : "text-outline-emerald"
        }`}
      >
        {hasBattle
          ? warRound && battleRevealed
            ? "WAR!"
            : "Battlefield"
          : "Battlefield"}
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
          <p className="text-sm text-white/70">
            Deal cards to start the next battle.
          </p>
        )}
      </div>
      <div className="flex w-full flex-col gap-3">
        {hasBattle ? (
          <>
            {!battleRevealed && (
              <button className="btn btn-primary" onClick={onReveal}>
                {"Reveal Outcome"}
              </button>
            )}
            {battleRevealed && (
              <button
                className={`btn ${warRound ? "btn-primary" : "btn-outline"}`}
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
      <div className="w-full rounded-2xl border border-gold/20 bg-black/20 px-4 py-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
          <span>Bankroll</span>
          <span className="text-base font-semibold text-white">
            ${bank.toFixed(0)}
          </span>
        </div>
        <div className="mt-2 grid gap-2 text-xs uppercase tracking-[0.28em] text-white/50 sm:grid-cols-2">
          <span>Current Bet</span>
          <span className="text-right text-sm font-semibold text-white/90">
            ${bet.toFixed(0)}
          </span>
          <span>Win Yield</span>
          <span className="text-right text-sm font-semibold text-emerald-100">
            +${winYield.toFixed(0)}
          </span>
          <span>In Play</span>
          <span className="text-right text-sm font-semibold text-white/90">
            ${activeBet.toFixed(0)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex flex-1 items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60">
            Bet
            <input
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(bet) ? bet : 0}
              onChange={(e) => onBetChange(Number(e.target.value))}
              disabled={!canAdjustBet}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-gold/50"
            />
          </label>
          <button
            className="btn btn-outline"
            onClick={onClearBet}
            disabled={!canAdjustBet}
          >
            Clear Bet
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            className="chip-btn bg-white text-ink chip-btn-white"
            onClick={() => onAdjustBet(5)}
            disabled={!canAdjustBet}
          >
            +$5
          </button>
          <button
            className="chip-btn bg-chipRed text-white"
            onClick={() => onAdjustBet(20)}
            disabled={!canAdjustBet}
          >
            +$20
          </button>
          <button
            className="chip-btn bg-chipBlue text-white"
            onClick={() => onAdjustBet(100)}
            disabled={!canAdjustBet}
          >
            +$100
          </button>
        </div>
        {betMessage && (
          <p className="mt-3 text-xs text-gold/80">{betMessage}</p>
        )}
        {lastWinAmount > 0 && (
          <p className="mt-2 text-xs text-emerald-100">
            Won ${lastWinAmount.toFixed(0)}
          </p>
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
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emeraldDeep shadow-soft">
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
