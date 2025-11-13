import axios from "axios";
import type {
  DeckState,
  WarRoundResult,
  BJDeckState,
  BJRoundResult,
  WarStartResponse,
} from "./types";
export type { Card } from "./types";

const api = axios.create({ baseURL: "/api" });

export const startWar = () =>
  api.get<WarStartResponse>("/game/start").then(r => r.data);

export const playWarRound = (state: DeckState) =>
  api.post<WarRoundResult>("/game/round", state).then(r => r.data);

export const resolveWar = (state: DeckState) =>
  api.post<WarRoundResult>("/game/war", state).then(r => r.data);

export const bjStart = () =>
  api.get<BJDeckState>("/game/black-jack-start").then(r => r.data);

export const bjRound = (state: BJDeckState) =>
  api.post<BJRoundResult>("/game/black-jack-round", state).then(r => r.data);
