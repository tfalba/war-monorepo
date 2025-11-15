import axios from "axios";
import type {
  DeckState,
  WarRoundResult,
  BJDeckState,
  BJHandState,
  BJActionPayload,
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
  api.post<BJHandState>("/game/black-jack-round", state).then(r => r.data);

export const bjHit = (payload: BJActionPayload) =>
  api
    .post<BJHandState>("/game/black-jack-action", { ...payload, action: "hit" })
    .then(r => r.data);

export const bjStand = (payload: BJActionPayload) =>
  api
    .post<BJHandState>("/game/black-jack-action", { ...payload, action: "stand" })
    .then(r => r.data);
