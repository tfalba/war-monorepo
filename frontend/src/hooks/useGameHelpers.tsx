import { useEffect, useState } from "react";
import { playWarRound, resolveWar, startWar } from "../api";
import type { DeckState, WarRoundResult } from "../types";

type PlayerDeck = DeckState["deckA"];
type BonusPile = NonNullable<DeckState["bonus"]>;
type PlayedCard = WarRoundResult["deckA"][number];

const WAR_STATE_STORAGE_KEY = "war_game_state";

type StoredWarState = {
  deckA: PlayerDeck;
  deckB: PlayerDeck;
  prevDeckA: PlayerDeck;
  prevDeckB: PlayerDeck;
  cardA: PlayedCard | null;
  cardB: PlayedCard | null;
  bonus: BonusPile;
  prevBonus: BonusPile;
  warRound: boolean;
  winningPlayer: string | null;
  prevWinningPlayer: string | null;
  log: string;
  roundNumber: number;
  hasActiveGame: boolean;
};

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

  const [storageReady, setStorageReady] = useState(false);
  const [hasStoredGame, setHasStoredGame] = useState(false);
  const [hasActiveGame, setHasActiveGame] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setStorageReady(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(WAR_STATE_STORAGE_KEY);
      if (!raw) {
        setStorageReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<StoredWarState> | null;
      if (!parsed?.hasActiveGame) {
        window.localStorage.removeItem(WAR_STATE_STORAGE_KEY);
        setStorageReady(true);
        return;
      }
      setPrevDeckA(Array.isArray(parsed.prevDeckA) ? parsed.prevDeckA : []);
      setPrevDeckB(Array.isArray(parsed.prevDeckB) ? parsed.prevDeckB : []);
      setDeckA(Array.isArray(parsed.deckA) ? parsed.deckA : []);
      setDeckB(Array.isArray(parsed.deckB) ? parsed.deckB : []);
      setCardA(parsed.cardA ?? null);
      setCardB(parsed.cardB ?? null);
      setBonus(Array.isArray(parsed.bonus) ? parsed.bonus : []);
      setPrevBonus(Array.isArray(parsed.prevBonus) ? parsed.prevBonus : []);
      setWarRound(Boolean(parsed.warRound));
      setWinningPlayer(parsed.winningPlayer ?? null);
      setPrevWinningPlayer(parsed.prevWinningPlayer ?? null);
      setLog(parsed.log ?? "");
      setRoundNumber(typeof parsed.roundNumber === "number" ? parsed.roundNumber : 0);
      setHasStoredGame(true);
      setHasActiveGame(true);
    } catch {
      window.localStorage.removeItem(WAR_STATE_STORAGE_KEY);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady || !hasActiveGame) return;
    if (typeof window === "undefined") return;

    const payload: StoredWarState = {
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
      hasActiveGame,
    };

    try {
      window.localStorage.setItem(
        WAR_STATE_STORAGE_KEY,
        JSON.stringify(payload)
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    storageReady,
    hasActiveGame,
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
  ]);

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
    setHasActiveGame(true);
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
    storageReady,
    hasStoredGame,
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
