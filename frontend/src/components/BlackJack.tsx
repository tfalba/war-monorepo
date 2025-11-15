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

const MIN_BET = 10;
const RECENT_FACE_UP = 6;

export default function BlackJack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardDeck, setDiscardDeck] = useState<Card[]>([]);
  const [recentDiscardCount, setRecentDiscardCount] = useState(0);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [status, setStatus] = useState<BlackjackStatus>("player-turn");
  const [revealDealer, setRevealDealer] = useState(false);
  const [message, setMessage] = useState("");

  const [bank, setBank] = useState(1000);
  const [bet, setBet] = useState(MIN_BET);
  const [activeBet, setActiveBet] = useState(0);
  const [playerNatural, setPlayerNatural] = useState(false);
  const [autoStood, setAutoStood] = useState(false);
  const [settled, setSettled] = useState(true);

  useEffect(() => {
    const storedBank = Number(localStorage.getItem("bj_bank"));
    const initialBank =
      Number.isFinite(storedBank) && storedBank > 0 ? storedBank : 1000;
    setBank(initialBank);
    const storedBet = Number(localStorage.getItem("bj_bet"));
    if (Number.isFinite(storedBet) && storedBet >= MIN_BET) {
      setBet(Math.min(storedBet, initialBank));
    } else {
      setBet(Math.min(MIN_BET, initialBank));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bj_bank", bank.toString());
  }, [bank]);

  useEffect(() => {
    localStorage.setItem("bj_bet", bet.toString());
  }, [bet]);

  const clampBetValue = useCallback(
    (value: number) => {
      if (bank <= 0) return 0;
      const minAllowed = Math.min(MIN_BET, bank);
      return Math.min(Math.max(value, minAllowed), bank);
    },
    [bank]
  );

  useEffect(() => {
    setBet((prev) => clampBetValue(prev));
  }, [bank, clampBetValue]);

  const applyHandState = (hand: BJHandState) => {
    setDeck(hand.deck ?? []);
    setPlayerCards(hand.playerCards ?? []);
    setDealerCards(hand.dealerCards ?? []);
    setPlayerValue(hand.playerValue ?? 0);
    setDealerValue(hand.dealerValue ?? 0);
    setStatus(hand.status);
    setRevealDealer(hand.revealDealer ?? false);
    setMessage(hand.log ?? statusCopy[hand.status] ?? "");
    const natural =
      (hand.playerCards?.length ?? 0) === 2 && (hand.playerValue ?? 0) === 21;
    setPlayerNatural(natural);
    if (hand.status !== "player-turn") {
      setSettled(false);
    }
  };

  const handleClear = useCallback(() => {
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerValue(0);
    setDealerValue(0);
    setStatus("player-turn");
    setRevealDealer(false);
    setMessage("");
    setPlayerNatural(false);
    setAutoStood(false);
  }, []);

  const archiveHand = useCallback(() => {
    if (playerCards.length === 0 && dealerCards.length === 0) {
      return;
    }
    const moved = playerCards.length + dealerCards.length;
    if (moved > 0) {
      setDiscardDeck((prev) => [...playerCards, ...dealerCards, ...prev]);
      setRecentDiscardCount(moved);
    }
    handleClear();
  }, [dealerCards, handleClear, playerCards]);

  const handleStart = useCallback(async () => {
    setDeck([]);
    setDiscardDeck([]);
    setRecentDiscardCount(0);
    handleClear();
    const data = await bjStart();
    setDeck(data.deck ?? []);
  }, [handleClear]);

  useEffect(() => {
    void handleStart();
  }, [handleStart]);

  const roundPayload = useCallback(
    (): BJActionPayload => ({
      deck,
      playerCards,
      dealerCards,
    }),
    [deck, dealerCards, playerCards]
  );

  async function handleDeal() {
    if (activeBet > 0) return;
    if (status === "player-turn" && playerCards.length > 0) return;
    if (bet < MIN_BET || bet > bank) {
      setMessage("Bet must be at least $10 and within your bankroll.");
      return;
    }
    archiveHand();
    setBank((b) => b - bet);
    setActiveBet(bet);
    setSettled(false);
    setAutoStood(false);
    const payload: BJDeckState = { deck };
    const data = await bjRound(payload);
    applyHandState(data);
  }

  const handleHit = useCallback(async () => {
    if (status !== "player-turn") return;
    const data = await bjHit(roundPayload());
    applyHandState(data);
  }, [roundPayload, status]);

  const handleStand = useCallback(async () => {
    if (status !== "player-turn") return;
    const data = await bjStand(roundPayload());
    applyHandState(data);
  }, [roundPayload, status]);

  function clearRound() {
    archiveHand();
    setSettled(true);
  }

  const canClear =
    playerCards.length > 0 &&
    dealerCards.length > 0 &&
    status !== "player-turn";
  const canDeal =
    deck.length >= 4 && activeBet === 0 && bet <= bank && bank >= MIN_BET;
  const canAct = status === "player-turn" && playerCards.length > 0;
  const dealerRevealed = revealDealer || status !== "player-turn";
  const bust = status === "player-bust";
  const chipsDisabled =
    (playerCards.length > 0 && status === "player-turn") || activeBet > 0;

  useEffect(() => {
    if (status !== "player-turn" || activeBet === 0 || settled || autoStood) {
      return;
    }
    const hasNatural21 = playerNatural && playerCards.length === 2;
    const hitToTwentyOne = playerCards.length > 2 && playerValue === 21;
    if (!hasNatural21 && !hitToTwentyOne) {
      return;
    }
    setAutoStood(true);
    void handleStand();
  }, [
    status,
    playerNatural,
    playerCards.length,
    playerValue,
    autoStood,
    activeBet,
    settled,
    handleStand,
  ]);

  useEffect(() => {
    if (status === "player-turn" || activeBet === 0 || settled) return;
    let payout = 0;
    if (status === "push") {
      payout = activeBet;
    } else if (status === "player-win" || status === "dealer-bust") {
      payout = activeBet * 2;
      if (playerNatural && playerCards.length === 2) {
        payout = Math.floor(activeBet * 2.5);
      }
    }
    setBank((b) => b + payout);
    setActiveBet(0);
    setSettled(true);
  }, [status, activeBet, settled, playerNatural, playerCards.length]);

  const reversedDiscard = [...discardDeck].reverse();
  const faceUpCount = Math.min(
    recentDiscardCount,
    RECENT_FACE_UP,
    reversedDiscard.length
  );

  const handleChipAdjust = useCallback(
    (delta: number) => {
      if (chipsDisabled) return;
      setBet((prev) => clampBetValue(prev + delta));
    },
    [chipsDisabled, clampBetValue]
  );

  const handleClearBetAmount = useCallback(() => {
    if (chipsDisabled) return;
    setBet(clampBetValue(MIN_BET));
  }, [chipsDisabled, clampBetValue]);

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
          {!canDeal && canClear && (
            <button className="btn btn-accent" onClick={handleStart}>
              New Deal
            </button>
          )}
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
            {reversedDiscard.map((c, i) => (
              <CardView
                key={`discard-${i}`}
                card={c}
                variant="stack"
                showCard={i < faceUpCount}
              />
            ))}
          </PilePanel>
          <ChipControls
            bank={bank}
            bet={bet}
            activeBet={activeBet}
            disabled={chipsDisabled}
            onAdjust={handleChipAdjust}
            onClearBet={handleClearBetAmount}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <Hand
            label="Dealer"
            cards={dealerCards}
            totalLabel={
              dealerRevealed
                ? dealerValue.toString()
                : dealerCards.length > 0
                ? "??"
                : ""
            }
            showFirst={dealerRevealed}
          />
          {status !== "player-turn" ? (
            <div className="flex items-center justify-center pt-2">
              {/* <span className="rounded-full border border-gold/50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold"> */}
              <h2 className="text-4xl font-display text-chipBlue text-outline-gold">
                {statusCopy[status] || "Round complete"}
              </h2>
              {/* </span> */}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="px-4 py-1 text-xs font-semibold text-transparent">
                Round in progress
              </span>
            </div>
          )}
          <div className="flex flex-1 flex-col space-y-4">
            <Hand
              label="Player"
              cards={playerCards}
              totalLabel={
                playerCards.length > 0 ? playerValue.toString() : undefined
              }
              showFirst
              highlight={bust ? "Bust" : undefined}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn btn-outline"
                onClick={handleStand}
                disabled={!canAct}
              >
                Stand
              </button>
              <button
                className="btn btn-primary"
                onClick={handleHit}
                disabled={!canAct}
              >
                Hit
              </button>
              {status !== "player-turn" && (
                <button
                  className="btn btn-accent ml-auto"
                  onClick={handleDeal}
                  disabled={!canDeal}
                >
                  Play Next Round
                </button>
              )}
            </div>
            {message ? (
              <p className="text-sm text-gold/80">{message}</p>
            ) : (
              <p className="text-sm text-transparent">No message</p>
            )}
          </div>
        </div>
      </div>

      {/* <ChipControls
        bank={bank}
        bet={bet}
        activeBet={activeBet}
        disabled={chipsDisabled}
        onAdjust={handleChipAdjust}
        onClearBet={handleClearBetAmount}
      /> */}
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
      <div className="mb-3 flex gap-4 items-center">
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

function ChipControls({
  bank,
  bet,
  activeBet,
  disabled,
  onAdjust,
  onClearBet,
}: {
  bank: number;
  bet: number;
  activeBet: number;
  disabled: boolean;
  onAdjust: (delta: number) => void;
  onClearBet: () => void;
}) {
  const chips = [
    { amount: 1, color: "bg-white text-ink" },
    { amount: 5, color: "bg-chipRed text-white" },
    { amount: 20, color: "bg-chipBlue text-white" },
  ];

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-black/40 px-6 py-4 text-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Bankroll
          </p>
          <p className="text-2xl font-semibold">${bank.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            Current Bet
          </p>
          <p className="text-2xl font-semibold">${bet.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            In Play
          </p>
          <p className="text-2xl font-semibold">${activeBet.toFixed(0)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {chips.map((chip) => (
          <button
            key={chip.amount}
            className={`flex h-16 w-16 items-center justify-center rounded-full text-sm font-semibold shadow-card ${chip.color}`}
            onClick={() => onAdjust(chip.amount)}
            disabled={disabled}
          >
            +${chip.amount}
          </button>
        ))}
        <button
          className="btn btn-outline"
          onClick={onClearBet}
          disabled={disabled}
        >
          Clear Bet
        </button>
      </div>
    </div>
  );
}
