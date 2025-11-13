# backend/app.py
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, conint
from typing import List, Literal, Optional
from war import (
    split_shuffled_decks,
    play_round,
    war_round,
    double_deck_shuffled,
    start_bj,
)

app = FastAPI(title="War API")

# CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _dump_card(c):
    # pydantic v2
    try:
        return c.model_dump()
    except AttributeError:
        # fallback (v1 or already a dict)
        return getattr(c, "dict", lambda: c)()

def _dump_cards(cards):
    return [ _dump_card(c) for c in cards ]

def _dump_state(state):
    return {
        "deckA": _dump_cards(state.deckA),
        "deckB": _dump_cards(state.deckB),
        "bonus": _dump_cards(state.bonus),
    }

# ---------- Models that MATCH war.py payloads ----------
SuitSym = Literal["♠", "♥", "♦", "♣"]

class Card(BaseModel):
    suit: SuitSym
    num: conint(ge=2, le=14)   # 2..14 (11=J,12=Q,13=K,14=A)
    image: str                 # e.g., "/assets/playingDeck/A-S.png"

class DeckState(BaseModel):
    deckA: List[Card] = Field(default_factory=list)
    deckB: List[Card] = Field(default_factory=list)
    bonus: List[Card] = Field(default_factory=list)

class WarRoundResult(BaseModel):
    deckA: List[Card]
    deckB: List[Card]
    bonus: List[Card] = Field(default_factory=list)
    # war.py uses "result" not "winner"
    result: Optional[Literal["A", "B", "tie", "tie_again", "game-over"]] = None
    log: str

class BJDeckState(BaseModel):
    deck: List[Card]

class BJRoundResult(BaseModel):
    deck: List[Card]
    playerCards: List[Card]
    dealerCards: List[Card]
    log: str

# ---------- Routes ----------
@app.get("/game/start", response_model=DeckState)
def game_start():
    deckA, deckB = split_shuffled_decks()
    return {"deckA": deckA, "deckB": deckB, "bonus": []}

@app.post("/game/round", response_model=WarRoundResult)
def game_round(state: DeckState):
    s = _dump_state(state)
    return play_round(s["deckA"], s["deckB"], s["bonus"])

@app.post("/game/war", response_model=WarRoundResult)
def game_war(state: DeckState):
    s = _dump_state(state)
    return war_round(s["deckA"], s["deckB"], s["bonus"])

@app.get("/game/black-jack-start", response_model=BJDeckState)
def game_blackjack_start():
    return {"deck": double_deck_shuffled()}

@app.post("/game/black-jack-round", response_model=BJRoundResult)
def game_blackjack_round(state: BJDeckState):
    # BJDeckState.deck is a list[Card] models → dump to dicts
    deck = _dump_cards(state.deck)
    return start_bj(deck)
