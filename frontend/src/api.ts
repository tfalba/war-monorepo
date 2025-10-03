import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export type Card = { suit: string; num: number } | null;

export async function startGame() {
  const { data } = await api.get("/game/start");
  return data as { deckA: Card[]; deckB: Card[]; log: string };
}

export async function playRound(deckA: Card[], deckB: Card[], bonus?: Card[]) {
  const { data } = await api.post("/game/round", { deckA, deckB, bonus });
  return data as {
    deckA: Card[];
    deckB: Card[];
    result: "A" | "B" | "tie" | "game-over";
    log: string;
    bonus?: Card[];
  };
}

export async function war(deckA: Card[], deckB: Card[], bonus: Card[]) {
  const { data } = await api.post("/game/war", { deckA, deckB, bonus });
  return data as {
    deckA: Card[];
    deckB: Card[];
    result: "A" | "B" | "tie_again" | "game-over";
    log: string;
    bonus?: Card[];
  };
}
