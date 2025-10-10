from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from war import split_shuffled_decks, play_round, war_round, double_deck_shuffled, start_bj

app = FastAPI(title="War API")

# CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DeckState(BaseModel):
    deckA: List[Dict]
    deckB: List[Dict]
    bonus: Optional[List[Dict]] = None

class BJDeckState(BaseModel):
    deck: List[Dict]
    # playerDeck: List[Dict]
    # dealerDeck: List[Dict]

@app.get("/game/start")
def game_start():
    deckA, deckB = split_shuffled_decks()
    return {"deckA": deckA, "deckB": deckB, "log": "New shuffled game."}

@app.get("/game/black-jack-start")
def game_blackjack_start():
    deck = double_deck_shuffled()
    return {"deck": deck, "log": "New shuffled Blackjack game."}

@app.post("/game/black-jack-round")
def game_blackjack_round(state: BJDeckState):
    return start_bj(state.deck)

@app.post("/game/round")
def game_round(state: DeckState):
    return play_round(state.deckA, state.deckB, state.bonus)

@app.post("/game/war")
def game_war(state: DeckState):
    return war_round(state.deckA, state.deckB, state.bonus or [])
