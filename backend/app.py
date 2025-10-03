from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from war import split_shuffled_decks, play_round, war_round, record_round

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
    # cardA: Dict
    # cardB: Dict
    bonus: Optional[List[Dict]] = None

@app.get("/game/start")
def game_start():
    deckA, deckB = split_shuffled_decks()
    return {"deckA": deckA, "deckB": deckB, "log": "New shuffled game."}

# @app.post("/game/round")
# def game_round(state: DeckState):
#     return play_round(state.deckA, state.deckB, state.cardA, state.cardB, state.bonus)

@app.post("/game/round")
def game_round(state: DeckState):
    return play_round(state.deckA, state.deckB, state.bonus)

@app.post("/game/war")
def game_war(state: DeckState):
    return war_round(state.deckA, state.deckB, state.bonus or [])

@app.post("/game/return")
def return_round(state: DeckState):
    return record_round(state.deckA, state.deckB, state.bonus)