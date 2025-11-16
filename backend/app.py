# backend/app.py
import os;
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
    bj_hit,
    bj_stand,
)

# ---------- CORS ----------
DEFAULT_FRONTEND = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")
ALLOWED = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_FRONTEND).split(",") if o.strip()]


app = FastAPI(title="War & Blackjack API")

# CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED,
    allow_origin_regex=r"^https://.*\.vercel\.app$",  # previews, e.g. https://casino-games-sooty-xyz.vercel.app
    allow_credentials=False,
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

BlackjackStatus = Literal[
    "player-turn",
    "player-bust",
    "player-win",
    "dealer-win",
    "dealer-bust",
    "push",
]


class BJHandState(BaseModel):
    deck: List[Card]
    playerCards: List[Card]
    dealerCards: List[Card]
    playerValue: int
    dealerValue: int
    status: BlackjackStatus
    revealDealer: bool = False
    log: str = ""


class BJActionPayload(BaseModel):
    deck: List[Card]
    playerCards: List[Card]
    dealerCards: List[Card]


class BJActionRequest(BJActionPayload):
    action: Literal["hit", "stand"]

# ---------- Routes ----------
@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/api/game/start", response_model=DeckState)
def game_start():
    deckA, deckB = split_shuffled_decks()
    return {"deckA": deckA, "deckB": deckB, "bonus": []}

@app.post("/api/game/round", response_model=WarRoundResult)
def game_round(state: DeckState):
    s = _dump_state(state)
    return play_round(s["deckA"], s["deckB"], s["bonus"])

@app.post("/api/game/war", response_model=WarRoundResult)
def game_war(state: DeckState):
    s = _dump_state(state)
    return war_round(s["deckA"], s["deckB"], s["bonus"])

@app.get("/api/game/black-jack-start", response_model=BJDeckState)
def game_blackjack_start():
    return {"deck": double_deck_shuffled()}

@app.post("/api/game/black-jack-round", response_model=BJHandState)
def game_blackjack_round(state: BJDeckState):
    deck = _dump_cards(state.deck)
    return start_bj(deck)


@app.post("/api/game/black-jack-action", response_model=BJHandState)
def game_blackjack_action(payload: BJActionRequest):
    deck = _dump_cards(payload.deck)
    player_cards = _dump_cards(payload.playerCards)
    dealer_cards = _dump_cards(payload.dealerCards)
    if payload.action == "hit":
        return bj_hit(deck, player_cards, dealer_cards)
    return bj_stand(deck, player_cards, dealer_cards)
