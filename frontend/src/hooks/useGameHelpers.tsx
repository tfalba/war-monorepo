import { useState } from "react";
import { playWarRound, resolveWar, startWar } from "../api";
import type { DeckState, WarRoundResult } from "../types";

type PlayerDeck = DeckState["deckA"];
type BonusPile = NonNullable<DeckState["bonus"]>;
type PlayedCard = WarRoundResult["deckA"][number];

export function useGameHelpers() {
  const [deckA, setDeckA] = useState<PlayerDeck>([]);
  const [deckB, setDeckB] = useState<PlayerDeck>([]);
  const [prevDeckA, setPrevDeckA] = useState<PlayerDeck>([]);
  const [prevDeckB, setPrevDeckB] = useState<PlayerDeck>([]);

  const [cardA, setCardA] = useState<PlayedCard | null>(null);
  const [cardB, setCardB] = useState<PlayedCard | null>(null);
  const [bonus, setBonus] = useState<BonusPile>([]);
  const [prevBonus, setPrevBonus] = useState<BonusPile>([]);
  const [warRound, setWarRound] = useState(false);
  const [winningPlayer, setWinningPlayer] = useState<string | null>(null);
  const [prevWinningPlayer, setPrevWinningPlayer] = useState<string | null>(
    null
  );
  const [roundNumber, setRoundNumber] = useState(0);

  const [log, setLog] = useState<string>("");
  async function handleStart() {
    const data = await startWar();
    setPrevDeckA(data.deckA);
    setPrevDeckB(data.deckB);
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(null);
    setCardB(null);
    setBonus([]);
    setWinningPlayer(null);
    setWarRound(false);
    setPrevWinningPlayer(null);
    setLog(data.log);
  }

  function handleClear() {
    setPrevDeckA(deckA);
    setPrevDeckB(deckB);
    setCardA(null);
    setCardB(null);
    setPrevBonus(bonus);

    setBonus([]);
    setWarRound(false);
    setPrevWinningPlayer(winningPlayer);
    setWinningPlayer(null);
    setLog("");
  }

  async function handleRound() {
    setCardA(null);
    setCardB(null);
    setWinningPlayer(null);
    const data = await playWarRound({ deckA, deckB, bonus });
    setPrevDeckA((deckA) => deckA.slice(-(deckA.length - 1)));
    setPrevDeckB((deckB) => deckB.slice(-(deckB.length - 1)));
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(deckA[0] ?? null);
    setCardB(deckB[0] ?? null);
    setLog(data.log);
    setPrevWinningPlayer(null);
    setWinningPlayer(
      data.result === "A" ? "A" : data.result === "B" ? "B" : null
    );
    setRoundNumber((n) => n + 1);
    if (data.result === "tie" && data.bonus) {
      setBonus(data.bonus);
      setWarRound(true);
    } else setBonus([]);
  }

  async function handleWar() {
    if (bonus.length === 0) return;
    setCardA(null);
    setCardB(null);
    setPrevDeckA((deckA) => deckA.slice(-(deckA.length - 3)));
    setPrevDeckB((deckB) => deckB.slice(-(deckB.length - 3)));

    const data = await resolveWar({ deckA, deckB, bonus });
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(deckA[2] ?? null);
    setCardB(deckB[2] ?? null);
    setLog(data.log);
    setPrevWinningPlayer(null);
    setWinningPlayer(
      data.result === "A" ? "A" : data.result === "B" ? "B" : null
    );
    const newBonus = bonus.concat(deckA.slice(0, 2)).concat(deckB.slice(0, 2));
    setBonus(newBonus);
    if (data.result === "tie_again" && data.bonus) {
      setBonus(data.bonus);
      setWarRound(true);
    } else {
      setWarRound(false);
    }
  }

  return {
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
    log,
    roundNumber,
    setLog,
    setBonus,
    setWarRound,
    setWinningPlayer,
    setPrevWinningPlayer,
    setCardA,
    setCardB,
    setDeckA,
    setDeckB,
    setPrevDeckA,
    setPrevDeckB,
  };
}
