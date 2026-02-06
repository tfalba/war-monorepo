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

type SplitHandStatus =
  | "player-turn"
  | "player-bust"
  | "stand"
  | "player-win"
  | "dealer-win"
  | "dealer-bust"
  | "push";

type SplitHand = {
  cards: Card[];
  value: number;
  status: SplitHandStatus | string;
  bet: number;
  doubled?: boolean;
};

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
const DEALER_DRAW_DELAY = 900;
const DECK_STORAGE_KEY = "bj_deck";
const DISCARD_STORAGE_KEY = "bj_discard";

const getCardValue = (card: Card) => {
  const num = card.num ?? 0;
  if (num >= 11 && num <= 13) return 10;
  if (num === 14) return 11;
  return num;
};

const getHandValue = (cards: Card[]) => {
  let total = 0;
  let aces = 0;
  cards.forEach((card) => {
    total += getCardValue(card);
    if (card.num === 14) aces += 1;
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

const drawCard = (cards: Card[]) => {
  if (cards.length === 0) return { drawn: null, nextDeck: cards };
  return { drawn: cards[0], nextDeck: cards.slice(1) };
};

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

const getStoredDeck = (): Card[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getStoredDiscard = (): Card[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISCARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function BlackJack() {
  const [deck, setDeck] = useState<Card[]>(() => getStoredDeck());
  const [discardDeck, setDiscardDeck] = useState<Card[]>(() => getStoredDiscard());
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
  const [splitHands, setSplitHands] = useState<SplitHand[]>([]);
  const [activeSplitIndex, setActiveSplitIndex] = useState(0);
  const [splitResolved, setSplitResolved] = useState(false);

  const [bank, setBank] = useState(() => getStoredBank());
  const [bet, setBet] = useState(() => getStoredBet());
  const [activeBet, setActiveBet] = useState(0);
  const [playerNatural, setPlayerNatural] = useState(false);
  const [autoStood, setAutoStood] = useState(false);
  const [settled, setSettled] = useState(true);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [showTopUpPrompt, setShowTopUpPrompt] = useState(false);
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

  useEffect(() => {
    try {
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch {
      // ignore storage errors
    }
  }, [deck]);

  useEffect(() => {
    try {
      localStorage.setItem(DISCARD_STORAGE_KEY, JSON.stringify(discardDeck));
    } catch {
      // ignore storage errors
    }
  }, [discardDeck]);

  const clampBetValue = useCallback(
    (value: number) => {
      if (bank <= 0) return 0;
      return value;
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

  const isSplit = splitHands.length > 0;
  const activeSplitHand = isSplit ? splitHands[activeSplitIndex] : null;
  const currentPlayerCards = isSplit
    ? activeSplitHand?.cards ?? []
    : playerCards;
  const currentPlayerValue = isSplit
    ? activeSplitHand?.value ?? 0
    : playerValue;
  const currentPlayerStatus = isSplit
    ? activeSplitHand?.status ?? "player-turn"
    : status;

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
    setSplitHands([]);
    setActiveSplitIndex(0);
    setSplitResolved(false);
  }, [clearDealerAnimationTimers]);

  const archiveHand = useCallback(() => {
    const splitPlayerCards = splitHands.flatMap((hand) => hand.cards);
    const playerPile = splitPlayerCards.length > 0 ? splitPlayerCards : playerCards;
    if (playerPile.length === 0 && dealerCards.length === 0) {
      return;
    }
    const dealerPile =
      dealerTargetCards.length > dealerCards.length
        ? dealerTargetCards
        : dealerCards;
    const moved = playerPile.length + dealerPile.length;
    if (moved > 0) {
      setDiscardDeck((prev) => [...playerPile, ...dealerPile, ...prev]);
      setRecentDiscardCount(moved);
    }
    handleClear();
  }, [dealerCards, dealerTargetCards, handleClear, playerCards, splitHands]);

  const handleStart = useCallback(async () => {
    setDeck([]);
    setDiscardDeck([]);
    setRecentDiscardCount(0);
    handleClear();
    const data = await bjStart();
    setDeck(data.deck ?? []);
  }, [handleClear]);

  useEffect(() => {
    if (deck.length === 0) {
      void handleStart();
    }
  }, [deck.length, handleStart]);

  const roundPayload = useCallback(
    (): BJActionPayload => ({
      deck,
      playerCards,
      dealerCards,
    }),
    [deck, dealerCards, playerCards]
  );

  const handleDeal = useCallback(
    async (bankOverride?: number) => {
      const availableBank = bankOverride ?? bank;
      if (activeBet > 0) return;
      if (
        !isSplit &&
        status === "player-turn" &&
        playerCards.length > 0
      )
        return;
      if (isSplit && !splitResolved) return;
      if (bet < MIN_BET) {
        setMessage("Bet must be at least $10 and within your bankroll.");
        return;
      }
      if (bet > availableBank) {
        setShowTopUpPrompt(true);
        return;
      }
      if (deck.length < 10) {
        handleStart();
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
    },
    [
      activeBet,
      archiveHand,
      bank,
      bet,
      deck,
      handleStart,
      isSplit,
      playerCards.length,
      splitResolved,
      status,
    ]
  );

  const handleSplitResolve = useCallback(async (handsOverride?: SplitHand[]) => {
    const hands = handsOverride ?? splitHands;
    const needsDealer = hands.some((hand) => hand.status !== "player-bust");
    if (!needsDealer) {
      setRevealDealer(true);
      setSplitResolved(true);
      setStatus("player-bust");
      setLastWinAmount(0);
      setActiveBet(0);
      setSettled(true);
      setMessage("Both hands bust.");
      return;
    }
    const resolveHand = hands[hands.length - 1];
    const result = await bjStand({
      deck,
      playerCards: resolveHand?.cards ?? [],
      dealerCards,
    });
    const dealerCardsFinal = result.dealerCards ?? dealerCards;
    const dealerFinalValue =
      result.dealerValue ?? getHandValue(dealerCardsFinal);
    const dealerBust = dealerFinalValue > 21;
    setDeck(result.deck ?? deck);
    setDealerTargetCards(dealerCardsFinal);
    setRevealDealer(true);
    setDealerHoleFlipped(false);
    setDealerCards((prev) => (prev.length > 0 ? prev : dealerCardsFinal));
    setDealerValue(dealerFinalValue);

    let totalPayout = 0;
    let totalProfit = 0;
    const resolvedHands = hands.map((hand) => {
      if (hand.status === "player-bust") {
        return hand;
      }
      let outcome: SplitHandStatus = "push";
      if (dealerBust) {
        outcome = "dealer-bust";
      } else if (hand.value > dealerFinalValue) {
        outcome = "player-win";
      } else if (hand.value < dealerFinalValue) {
        outcome = "dealer-win";
      } else {
        outcome = "push";
      }
      if (outcome === "push") {
        totalPayout += hand.bet;
      } else if (outcome === "player-win" || outcome === "dealer-bust") {
        totalPayout += hand.bet * 2;
        totalProfit += hand.bet;
      }
      return { ...hand, status: outcome };
    });
    setSplitHands(resolvedHands);
    setLastWinAmount(totalProfit > 0 ? totalProfit : 0);
    setBank((b) => b + totalPayout);
    setActiveBet(0);
    setSettled(true);
    setSplitResolved(true);
    const outcomeSummary = resolvedHands
      .map((hand, idx) => `Hand ${idx + 1}: ${hand.status.replace("-", " ")}`)
      .join(" • ");
    setMessage(outcomeSummary);
  }, [dealerCards, deck, splitHands]);

  const handleSplit = useCallback(() => {
    if (isSplit) return;
    if (status !== "player-turn") return;
    if (playerCards.length !== 2) return;
    if (playerCards[0]?.num !== playerCards[1]?.num) return;
    if (activeBet <= 0) return;
    if (bank < activeBet) {
      setShowTopUpPrompt(true);
      return;
    }
    const { drawn: drawA, nextDeck: afterA } = drawCard(deck);
    const { drawn: drawB, nextDeck: afterB } = drawCard(afterA);
    if (!drawA || !drawB) return;
    const handA = [playerCards[0], drawA];
    const handB = [playerCards[1], drawB];
    const nextHands: SplitHand[] = [
      {
        cards: handA,
        value: getHandValue(handA),
        status: "player-turn",
        bet: activeBet,
      },
      {
        cards: handB,
        value: getHandValue(handB),
        status: "player-turn",
        bet: activeBet,
      },
    ];
    setBank((b) => b - activeBet);
    setActiveBet((prev) => prev * 2);
    setDeck(afterB);
    setSplitHands(nextHands);
    setActiveSplitIndex(0);
    setSplitResolved(false);
    setMessage("Split hand. Play hand 1 first.");
  }, [activeBet, bank, deck, isSplit, playerCards, status]);

  const handleHit = useCallback(async () => {
    if (isSplit) {
      if (!activeSplitHand || activeSplitHand.status !== "player-turn") return;
      const data = await bjHit({
        deck,
        playerCards: activeSplitHand.cards,
        dealerCards,
      });
      const nextCards = data.playerCards ?? activeSplitHand.cards;
      const nextValue = data.playerValue ?? getHandValue(nextCards);
      const nextStatus: SplitHandStatus =
        nextValue > 21 ? "player-bust" : "player-turn";
      setDeck(data.deck ?? deck);
      const nextHands = splitHands.map((hand, idx) =>
        idx === activeSplitIndex
          ? { ...hand, cards: nextCards, value: nextValue, status: nextStatus }
          : hand
      );
      setSplitHands(nextHands);
      setMessage(data.log ?? "");
      if (nextStatus === "player-bust") {
        if (activeSplitIndex === 0) {
          setActiveSplitIndex(1);
        } else {
          void handleSplitResolve(nextHands);
        }
      }
      return;
    }
    if (status !== "player-turn") return;
    const data = await bjHit(roundPayload());
    applyHandState(data);
  }, [
    activeSplitHand,
    activeSplitIndex,
    dealerCards,
    deck,
    handleSplitResolve,
    isSplit,
    roundPayload,
    splitHands,
    status,
  ]);

  const handleStand = useCallback(async () => {
    if (isSplit) {
      if (!activeSplitHand || activeSplitHand.status !== "player-turn") return;
      const nextHands = splitHands.map((hand, idx) =>
        idx === activeSplitIndex ? { ...hand, status: "stand" } : hand
      );
      setSplitHands(nextHands);
      setMessage(
        activeSplitIndex === 0 ? "Hand 1 stands." : "Hand 2 stands."
      );
      if (activeSplitIndex === 0) {
        setActiveSplitIndex(1);
      } else {
        void handleSplitResolve(nextHands);
      }
      return;
    }
    if (status !== "player-turn") return;
    const data = await bjStand(roundPayload());
    applyHandState(data);
  }, [
    activeSplitHand,
    activeSplitIndex,
    handleSplitResolve,
    isSplit,
    roundPayload,
    splitHands,
    status,
  ]);

  const handleDoubleDown = useCallback(async () => {
    if (isSplit) {
      if (!activeSplitHand || activeSplitHand.status !== "player-turn") return;
      const eligible =
        activeSplitHand.cards.length === 2 &&
        (activeSplitHand.value === 10 || activeSplitHand.value === 11) &&
        activeBet > 0 &&
        !activeSplitHand.doubled;
      if (!eligible) return;
      if (bank < activeSplitHand.bet) {
        setShowTopUpPrompt(true);
        return;
      }
      setBank((b) => b - activeSplitHand.bet);
      setActiveBet((prev) => prev + activeSplitHand.bet);
      const doubledHands = splitHands.map((hand, idx) =>
        idx === activeSplitIndex
          ? { ...hand, doubled: true, bet: hand.bet * 2 }
          : hand
      );
      setSplitHands(doubledHands);
      const data = await bjHit({
        deck,
        playerCards: activeSplitHand.cards,
        dealerCards,
      });
      const nextCards = data.playerCards ?? activeSplitHand.cards;
      const nextValue = data.playerValue ?? getHandValue(nextCards);
      const nextStatus: SplitHandStatus =
        nextValue > 21 ? "player-bust" : "stand";
      setDeck(data.deck ?? deck);
      const nextHands = doubledHands.map((hand, idx) =>
        idx === activeSplitIndex
          ? { ...hand, cards: nextCards, value: nextValue, status: nextStatus }
          : hand
      );
      setSplitHands(nextHands);
      setMessage(
        activeSplitIndex === 0 ? "Hand 1 doubles down." : "Hand 2 doubles down."
      );
      if (activeSplitIndex === 0) {
        setActiveSplitIndex(1);
      } else {
        void handleSplitResolve(nextHands);
      }
      return;
    }
    const eligible =
      status === "player-turn" &&
      playerCards.length === 2 &&
      (playerValue === 10 || playerValue === 11) &&
      activeBet > 0;
    if (!eligible) return;
    if (bank < activeBet) {
      setShowTopUpPrompt(true);
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
  }, [
    activeBet,
    activeSplitHand,
    activeSplitIndex,
    bank,
    dealerCards,
    deck,
    handleSplitResolve,
    isSplit,
    playerCards.length,
    playerValue,
    roundPayload,
    splitHands,
    status,
  ]);

  const handleTopUpAccept = useCallback(() => {
    const nextBank = bank + 1000;
    setBank(nextBank);
    setShowTopUpPrompt(false);
    void handleDeal(nextBank);
  }, [bank, handleDeal]);

  const handleTopUpCancel = useCallback(() => {
    setShowTopUpPrompt(false);
  }, []);

  function clearRound() {
    archiveHand();
    setSettled(true);
  }

  const hasSplitCards = splitHands.some((hand) => hand.cards.length > 0);
  const canClear = isSplit
    ? hasSplitCards && dealerCards.length > 0 && splitResolved
    : playerCards.length > 0 &&
      dealerCards.length > 0 &&
      status !== "player-turn";
  const canDeal =
    deck.length >= 10 && activeBet === 0 && bet <= bank && bank >= MIN_BET;
  const canAct =
    currentPlayerStatus === "player-turn" && currentPlayerCards.length > 0;
  const canDoubleDown =
    canAct &&
    currentPlayerCards.length === 2 &&
    (currentPlayerValue === 10 || currentPlayerValue === 11) &&
    activeBet > 0 &&
    (!isSplit || !activeSplitHand?.doubled);
  const canSplit =
    !isSplit &&
    status === "player-turn" &&
    playerCards.length === 2 &&
    playerCards[0]?.num === playerCards[1]?.num &&
    activeBet > 0;
  const dealerRevealed =
    revealDealer || status !== "player-turn" || (isSplit && splitResolved);
  const bust = currentPlayerStatus === "player-bust";
  const chipsDisabled =
    (((playerCards.length > 0 && status === "player-turn") || activeBet > 0) &&
      !(isSplit && splitResolved));
  const dealerAnimationsDone =
    !revealDealer ||
    (dealerHoleFlipped && dealerCards.length >= dealerTargetCards.length);
  const showResultUI = isSplit
    ? splitResolved && dealerAnimationsDone
    : status !== "player-turn" && dealerAnimationsDone;
  const resultHeading =
    isSplit && splitResolved
      ? "Split complete"
      : statusCopy[status] || "Round complete";

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
    if (isSplit) return;
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
    isSplit,
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
    if (isSplit) return;
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
    isSplit,
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
    <section className="space-y-6 lg:flex lg:h-[815px] lg:max-h-[815px] lg:flex-col lg:overflow-hidden lg:space-y-4">
      {showTopUpPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gold/40 bg-black/80 p-6 shadow-card">
            <h3 className="text-xl font-semibold text-gold mb-2">
              Add funds to continue?
            </h3>
            <p className="text-sm text-white/80">
              Your bet exceeds your bankroll. Add $1000 to your account to keep playing?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button className="btn btn-outline" onClick={handleTopUpCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleTopUpAccept}>
                Yes, add $1000
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
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
          {canDeal && deck.length < 104 && (
            <button className="btn btn-accent" onClick={handleStart}>
              New Deck
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => handleDeal()}
            disabled={!canDeal}
          >
            {playerCards.length === 0 ? "Deal Cards" : "Deal Next Hand"}
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

      <div className="grid grid-cols-1 gap-8 lg:flex-1 lg:min-h-0 lg:grid-cols-[1fr_2fr] lg:items-start">
        <div className="flex flex-col gap-2 min-h-[40rem] h-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft order-1 lg:order-2 lg:max-h-full lg:overflow-y-auto">
          <div className="flex flex-[.8] flex-col space-y-4 items-start ml-4">
            <Hand
              label="Dealer"
              cards={dealerCards}
              totalLabel={
                dealerRevealed && dealerAnimationsDone
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
          {showResultUI ? (
            <div className="flex flex-col items-center justify-end fixed left-[80%]">
              <h2 className="text-4xl font-display text-chipBlue text-outline-gold">
                {resultHeading}
              </h2>
              {resultHeading.slice(0,5) !== message.slice(0,5) && (
                <h4 className="ml-4 text-sm text-white/70">{message}</h4>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <h2 className="text-4xl font-display text-transparent">
                In progress
              </h2>
            </div>
          )}
          <div className="flex flex-1 flex-col space-y-4 items-start ml-4">
            {!isSplit && (
              <Hand
                label="Player"
                cards={currentPlayerCards}
                totalLabel={
                  currentPlayerCards.length > 0
                    ? currentPlayerValue.toString()
                    : undefined
                }
                showFirst
                highlight={bust ? "Bust" : undefined}
              />
            )}
            {isSplit && (
              <div className="grid w-full gap-4 md:grid-cols-2">
                {splitHands.map((hand, idx) => (
                  <Hand
                    key={`split-${idx}`}
                    label={`Hand ${idx + 1}`}
                    cards={hand.cards}
                    totalLabel={
                      hand.cards.length > 0 ? hand.value.toString() : undefined
                    }
                    showFirst
                    highlight={
                      hand.status === "player-bust"
                        ? "Bust"
                        : idx === activeSplitIndex && !splitResolved
                        ? "Playing"
                        : hand.status !== "player-turn"
                        ? hand.status.replace("-", " ")
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
            <div>
            <div className="flex flex-wrap items-center gap-3 w-full justify-end absolute bottom-10 right-[50%] ">
              {canDeal && activeBet === 0 && !showResultUI ? (
                <button
                  className="btn btn-accent ml-auto"
                  onClick={() => handleDeal()}
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
                  {canSplit && (
                    <button
                      className="btn btn-outline"
                      onClick={handleSplit}
                      disabled={!canAct}
                    >
                      Split
                    </button>
                  )}
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
            </div>
            {showResultUI ? (
              <div className="flex w-full items-center gap-4 justify-between absolute bottom-10 right-2">
                {lastWinAmount > 0 ? (
                  <WinDisplay amount={lastWinAmount} />
                ) : (
                  <span className="text-sm text-transparent">No win</span>
                )}
                <button className="btn btn-accent ml-auto" onClick={() => handleDeal()}>
                  Play Next Hand
                </button>
              </div>
            ) : (
              <div className="flex w-full">
                <span className="text-sm text-transparent">Waiting</span>
                <button className="btn text-transparent">Dummy</button>
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

        <div className="bg-emeeraldDeep/100 space-y-6 flex flex-col h-full justify-evenly order-4 lg:order-1 lg:max-h-full lg:overflow-y-auto">
          <PilePanel title="Draw Pile" subtitle={`${deck.length} left`}>
            {[...deck].reverse().map((c, i) => (
              <CardView key={`draw-${i}`} card={c} variant="stack" />
            ))}
          </PilePanel>

          <PilePanel className="hidden" title="Discard" subtitle={`${discardDeck.length} burned`}>
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
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${className} min-h-[140px] rounded-3xl border border-white/10 bg-black/80 p-4 shadow-soft`}>
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
  return (
    <div className="flex-1 place-items">
      <div className="mb-3 flex gap-4 items-center justify-center">
        <p className="text-sm uppercase tracking-[0.35em] text-white/70">
          {label}
        </p>
        {highlight && (
          <span className="text-sm text-gold">{highlight}</span>
        )}
        {totalLabel && (
          <span className="card-total px-4 py-2 text-base">
            {totalLabel}
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
    { amount: 5, color: "bg-white text-ink chip-btn-white" },
    { amount: 20, color: "bg-chipRed text-white" },
    { amount: 100, color: "bg-chipBlue text-white" },
  ];

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-black/80 px-6 py-4 text-white shadow-soft">
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
          <p className="text-2xl font-semibold">${activeBet > 0 ? activeBet.toFixed(0) : bet.toFixed(0)}</p>
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
