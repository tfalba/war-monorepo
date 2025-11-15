export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A"
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14;

export type Suit = "S" | "H" | "D" | "C" | "♠" | "♥" | "♦" | "♣";

export type Card = {
  rank?: Rank;
  num?: number;
  suit: Suit;
  image: string;
};

export type DeckState = {
  deckA: Card[];
  deckB: Card[];
  bonus?: Card[];
};

export type WarRoundResult = DeckState & {
  result: "A" | "B" | "tie" | "tie_again" | "game-over";
  log: string;
  bonus?: Card[];
};

export type WarStartResponse = {
  deckA: Card[];
  deckB: Card[];
  log: string;
};

export type BJDeckState = { deck: Card[]; log?: string };

export type BlackjackStatus =
  | "player-turn"
  | "player-bust"
  | "player-win"
  | "dealer-win"
  | "dealer-bust"
  | "push";

export type BJHandState = {
  deck: Card[];
  playerCards: Card[];
  dealerCards: Card[];
  playerValue: number;
  dealerValue: number;
  status: BlackjackStatus;
  revealDealer: boolean;
  log?: string;
};

export type BJActionPayload = {
  deck: Card[];
  playerCards: Card[];
  dealerCards: Card[];
};
