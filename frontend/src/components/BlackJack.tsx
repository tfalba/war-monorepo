import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { bjStart, bjRound, bjHit, bjStand } from "./../api";
import { CardView } from "./CardView";
import deckBack from "../assets/new-card-back.png";
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
const DEALER_FLIP_DELAY = 450;
const DEALER_DRAW_DELAY = 1200;

const getStoredBank = () => {
  if (typeof window === "undefined") return 1000;
  const storedBank = Number(window.localStorage.getItem("bj_bank"));
  return Number.isFinite(storedBank) && storedBank > 0 ? storedBank : 1000;
};

const getStoredBet = () => {
  if (typeof window === "undefined") return MIN_BET;
  const bank = getStoredBank();
  const storedBet = Number(window.localStorage.getItem("bj_bet"));
  if (Number.isFinite(storedBet) && storedBet >= MIN_BET) {
    return Math.min(storedBet, bank);
  }
  return Math.min(MIN_BET, bank);
};

export default function BlackJack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardDeck, setDiscardDeck] = useState<Card[]>([]);
  const [recentDiscardCount, setRecentDiscardCount] = useState(0);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [dealerTargetCards, setDealerTargetCards] = useState<Card[]>([]);
  const [dealerHoleFlipped, setDealerHoleFlipped] = useState(false);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [status, setStatus] = useState<BlackjackStatus>("player-turn");
  const [revealDealer, setRevealDealer] = useState(false);
  const [message, setMessage] = useState("");

  const [bank, setBank] = useState(() => getStoredBank());
  const [bet, setBet] = useState(() => getStoredBet());
  const [activeBet, setActiveBet] = useState(0);
  const [playerNatural, setPlayerNatural] = useState(false);
  const [autoStood, setAutoStood] = useState(false);
  const [settled, setSettled] = useState(true);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const dealerFlipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const dealerDrawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  const clearDealerAnimationTimers = useCallback(() => {
    if (dealerFlipTimeoutRef.current) {
      clearTimeout(dealerFlipTimeoutRef.current);
      dealerFlipTimeoutRef.current = null;
    }
    if (dealerDrawTimeoutRef.current) {
      clearTimeout(dealerDrawTimeoutRef.current);
      dealerDrawTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setBet((prev) => clampBetValue(prev));
  }, [bank, clampBetValue]);

  const applyHandState = (hand: BJHandState) => {
    const nextDealerCards = hand.dealerCards ?? [];
    setDeck(hand.deck ?? []);
    setPlayerCards(hand.playerCards ?? []);
    setDealerTargetCards(nextDealerCards);
    setDealerCards((prev) => (hand.revealDealer ? prev : nextDealerCards));
    if (!hand.revealDealer) {
      clearDealerAnimationTimers();
      setDealerHoleFlipped(false);
    }
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
    clearDealerAnimationTimers();
    setPlayerCards([]);
    setDealerCards([]);
    setDealerTargetCards([]);
    setDealerHoleFlipped(false);
    setPlayerValue(0);
    setDealerValue(0);
    setStatus("player-turn");
    setRevealDealer(false);
    setMessage("");
    setPlayerNatural(false);
    setAutoStood(false);
    setLastWinAmount(0);
    setActiveBet(0);
  }, [clearDealerAnimationTimers]);

  const archiveHand = useCallback(() => {
    if (playerCards.length === 0 && dealerCards.length === 0) {
      return;
    }
    const dealerPile =
      dealerTargetCards.length > dealerCards.length
        ? dealerTargetCards
        : dealerCards;
    const moved = playerCards.length + dealerPile.length;
    if (moved > 0) {
      setDiscardDeck((prev) => [...playerCards, ...dealerPile, ...prev]);
      setRecentDiscardCount(moved);
    }
    handleClear();
  }, [dealerCards, dealerTargetCards, handleClear, playerCards]);

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
    setLastWinAmount(0);
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

  const handleDoubleDown = useCallback(async () => {
    const eligible =
      status === "player-turn" &&
      playerCards.length === 2 &&
      (playerValue === 10 || playerValue === 11) &&
      activeBet > 0;
    if (!eligible) return;
    if (bank < activeBet) {
      setMessage("Not enough bankroll to double down.");
      return;
    }
    setBank((b) => b - activeBet);
    setActiveBet((prev) => prev * 2);
    const hitResult = await bjHit(roundPayload());
    applyHandState(hitResult);
    if (hitResult.status === "player-turn") {
      const standResult = await bjStand({
        deck: hitResult.deck ?? [],
        playerCards: hitResult.playerCards ?? [],
        dealerCards: hitResult.dealerCards ?? [],
      });
      applyHandState(standResult);
    }
  }, [activeBet, bank, playerCards.length, playerValue, roundPayload, status]);

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
  const canDoubleDown =
    canAct &&
    playerCards.length === 2 &&
    (playerValue === 10 || playerValue === 11) &&
    activeBet > 0;
  const dealerRevealed = revealDealer || status !== "player-turn";
  const bust = status === "player-bust";
  const chipsDisabled =
    (playerCards.length > 0 && status === "player-turn") || activeBet > 0;
  const dealerAnimationsDone =
    !revealDealer ||
    (dealerHoleFlipped && dealerCards.length >= dealerTargetCards.length);
  const showResultUI = status !== "player-turn" && dealerAnimationsDone;

  useEffect(() => {
    if (!revealDealer) {
      return;
    }
    if (dealerHoleFlipped || dealerCards.length === 0) return;
    if (dealerFlipTimeoutRef.current) {
      clearTimeout(dealerFlipTimeoutRef.current);
    }
    dealerFlipTimeoutRef.current = window.setTimeout(() => {
      setDealerHoleFlipped(true);
      dealerFlipTimeoutRef.current = null;
    }, DEALER_FLIP_DELAY);
    return () => {
      if (dealerFlipTimeoutRef.current) {
        clearTimeout(dealerFlipTimeoutRef.current);
        dealerFlipTimeoutRef.current = null;
      }
    };
  }, [dealerCards.length, dealerHoleFlipped, revealDealer]);

  useEffect(() => {
    if (!revealDealer || !dealerHoleFlipped) return;
    if (dealerCards.length === 0) return;
    if (dealerCards.length >= dealerTargetCards.length) return;
    if (dealerDrawTimeoutRef.current) {
      clearTimeout(dealerDrawTimeoutRef.current);
    }
    dealerDrawTimeoutRef.current = window.setTimeout(() => {
      setDealerCards((prev) => {
        const nextCard = dealerTargetCards[prev.length];
        if (!nextCard) return prev;
        return [...prev, nextCard];
      });
      dealerDrawTimeoutRef.current = null;
    }, DEALER_DRAW_DELAY);
    return () => {
      if (dealerDrawTimeoutRef.current) {
        clearTimeout(dealerDrawTimeoutRef.current);
        dealerDrawTimeoutRef.current = null;
      }
    };
  }, [dealerCards.length, dealerTargetCards, dealerHoleFlipped, revealDealer]);

  useEffect(() => {
    if (!revealDealer) {
      setDealerHoleFlipped(false);
    }
  }, [revealDealer]);

  useEffect(() => {
    return () => {
      clearDealerAnimationTimers();
    };
  }, [clearDealerAnimationTimers]);

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
    if (
      status === "player-turn" ||
      activeBet === 0 ||
      settled ||
      !dealerAnimationsDone
    )
      return;
    let payout = 0;
    let profit = 0;
    if (status === "push") {
      payout = activeBet;
    } else if (status === "player-win" || status === "dealer-bust") {
      payout = activeBet * 2;
      if (playerNatural && playerCards.length === 2) {
        payout = Math.floor(activeBet * 2.5);
      }
      profit = payout - activeBet;
    }
    setLastWinAmount(profit > 0 ? profit : 0);
    setBank((b) => b + payout);
    setActiveBet(0);
    setSettled(true);
  }, [
    status,
    activeBet,
    settled,
    dealerAnimationsDone,
    playerNatural,
    playerCards.length,
  ]);

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
          {!canDeal && deck.length <= 4 && (
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:items-start">
        <div className="flex flex-col gap-2 min-h-[40rem] h-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft order-1 lg:order-2">
          <div className="flex flex-1 flex-col space-y-4 items-center">
            <Hand
              label="Dealer"
              cards={dealerCards}
              totalLabel={
                dealerAnimationsDone && dealerRevealed
                  ? dealerValue.toString()
                  : dealerCards.length > 0
                  ? "??"
                  : ""
              }
              showFirst={dealerRevealed}
              useFlipFirstCard
              flipRevealed={dealerRevealed && dealerHoleFlipped}
            />
          </div>
          {status !== "player-turn" && dealerAnimationsDone ? (
            <div className="flex items-center justify-end">
              <h2 className="text-4xl font-display text-chipBlue text-outline-gold">
                {statusCopy[status] || "Round complete"}
              </h2>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <h2 className="text-4xl font-display text-transparent">
                In progress
              </h2>
            </div>
          )}
          <div className="flex flex-1 flex-col space-y-4 items-center">
            <Hand
              label="Player"
              cards={playerCards}
              totalLabel={
                playerCards.length > 0 ? playerValue.toString() : undefined
              }
              showFirst
              highlight={bust ? "Bust" : undefined}
            />
            <div className="flex flex-wrap items-center gap-3 w-full justify-center">
              {canDeal && activeBet === 0 && !showResultUI ? (
                <button
                  className="btn btn-accent ml-auto"
                  onClick={handleDeal}
                  disabled={!canDeal}
                >
                  Play New Hand
                </button>
              ) : (
                <>
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
                  {canDoubleDown && (
                    <button
                      className="btn btn-accent"
                      onClick={handleDoubleDown}
                      disabled={!canAct}
                    >
                      Double Down
                    </button>
                  )}
                </>
              )}
            </div>
            {showResultUI ? (
              <div className="flex w-full items-center gap-4 justify-between">
                {lastWinAmount > 0 ? (
                  <WinDisplay amount={lastWinAmount} />
                ) : (
                  <span className="text-sm text-transparent">No win</span>
                )}
                <button className="btn btn-accent ml-auto" onClick={handleDeal}>
                  Play Next Hand
                </button>
              </div>
            ) : (
              <div className="flex w-full">
                <span className="text-sm text-transparent">Waiting</span>
                <button className="btn text-transparent hidden">Dummy</button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden order-3 lg:order-2">
          <ChipControls
            bank={bank}
            bet={bet}
            activeBet={activeBet}
            disabled={chipsDisabled}
            onAdjust={handleChipAdjust}
            onClearBet={handleClearBetAmount}
          />
        </div>

        <div className="space-y-6 order-4 lg:order-1">
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
          <div className="order-2 lg:order-4 lg:col-span-1 hidden lg:grid">
            <ChipControls
              bank={bank}
              bet={bet}
              activeBet={activeBet}
              disabled={chipsDisabled}
              onAdjust={handleChipAdjust}
              onClearBet={handleClearBetAmount}
            />
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
    <div className="min-h-[140px] rounded-3xl border border-white/10 bg-black/30 p-4 shadow-soft">
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
  useFlipFirstCard,
  flipRevealed,
}: {
  label: string;
  cards: Card[];
  totalLabel?: string;
  showFirst?: boolean;
  highlight?: string;
  useFlipFirstCard?: boolean;
  flipRevealed?: boolean;
}) {
  const badge = highlight || (totalLabel ? `${totalLabel}` : undefined);
  return (
    <div className="flex-1 place-items">
      <div className="mb-3 flex gap-4 items-center justify-center">
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
        {cards.map((card, idx) => {
          if (useFlipFirstCard && idx === 0) {
            return (
              <FlipDisplayCard
                key={`${label}-${idx}`}
                card={card}
                flipped={Boolean(flipRevealed)}
              />
            );
          }
          return (
            <CardView
              key={`${label}-${idx}`}
              card={card}
              variant="display"
              showCard={idx === 0 ? showFirst : true}
            />
          );
        })}
      </div>
    </div>
  );
}

function FlipDisplayCard({ card, flipped }: { card: Card; flipped: boolean }) {
  const label = card?.rank ?? card?.num ?? "";
  return (
    <div className="relative h-48 w-32" style={{ perspective: "1200px" }}>
      <div className={`card-flip ${flipped ? "is-flipped" : ""}`}>
        <div className="card__face card__face--front">
          <img src={deckBack} alt="Card back" />
        </div>
        <div className="card__face card__face--back">
          <img src={card.image} alt={`Card ${label}`} />
        </div>
      </div>
    </div>
  );
}

function WinDisplay({ amount }: { amount: number }) {
  const coinsToShow = Math.min(5, Math.max(1, Math.ceil(amount / 20)));
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-black/30 px-4 py-2 text-sm text-gold">
      <div className="flex items-center gap-1">
        {Array.from({ length: coinsToShow }).map((_, idx) => (
          <span
            key={`coin-${idx}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold text-emeraldDeep text-xs font-semibold shadow-card"
          >
            $
          </span>
        ))}
      </div>
      <span className="font-semibold tracking-wide">
        ${amount.toFixed(0)} won
      </span>
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
    { amount: 1, color: "bg-white text-ink chip-btn-white" },
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
            className={`chip-btn ${chip.color}`}
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
