import random
from collections import deque
from typing import List, Dict, Tuple

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = list(range(2, 15))  # 2..14   (11=J,12=Q,13=K,14=A)
FACE = {11: "J", 12: "Q", 13: "K", 14: "A"}
CARDIMAGES = {
    "♠": {2: "src/assets/playingDeck/2-S.png", 3: "src/assets/playingDeck/3-S.png", 4: "src/assets/playingDeck/4-S.png", 5: "src/assets/playingDeck/5-S.png", 6: "src/assets/playingDeck/6-S.png", 7: "src/assets/playingDeck/7-S.png", 8: "src/assets/playingDeck/8-S.png", 9: "src/assets/playingDeck/9-S.png", 10: "src/assets/playingDeck/10-S.png", 11: "src/assets/playingDeck/J-S.png", 12: "src/assets/playingDeck/Q-S.png", 13: "src/assets/playingDeck/K-S.png", 14: "src/assets/playingDeck/A-S.png"},
    "♥": {2: "src/assets/playingDeck/2-H.png", 3: "src/assets/playingDeck/3-H.png", 4: "src/assets/playingDeck/4-H.png", 5: "src/assets/playingDeck/5-H.png", 6: "src/assets/playingDeck/6-H.png", 7: "src/assets/playingDeck/7-H.png", 8: "src/assets/playingDeck/8-H.png", 9: "src/assets/playingDeck/9-H.png", 10: "src/assets/playingDeck/10-H.png", 11: "src/assets/playingDeck/J-H.png", 12: "src/assets/playingDeck/Q-H.png", 13: "src/assets/playingDeck/K-H.png", 14: "src/assets/playingDeck/A-H.png"},
    "♦": {2: "src/assets/playingDeck/2-D.png", 3: "src/assets/playingDeck/3-D.png", 4: "src/assets/playingDeck/4-D.png", 5: "src/assets/playingDeck/5-D.png", 6: "src/assets/playingDeck/6-D.png", 7: "src/assets/playingDeck/7-D.png", 8: "src/assets/playingDeck/8-D.png", 9: "src/assets/playingDeck/9-D.png", 10: "src/assets/playingDeck/10-D.png", 11: "src/assets/playingDeck/J-D.png", 12: "src/assets/playingDeck/Q-D.png", 13: "src/assets/playingDeck/K-D.png", 14: "src/assets/playingDeck/A-D.png"},
    "♣": {2: "src/assets/playingDeck/2-C.png", 3: "src/assets/playingDeck/3-C.png", 4: "src/assets/playingDeck/4-C.png", 5: "src/assets/playingDeck/5-C.png", 6: "src/assets/playingDeck/6-C.png", 7: "src/assets/playingDeck/7-C.png", 8: "src/assets/playingDeck/8-C.png", 9: "src/assets/playingDeck/9-C.png", 10: "src/assets/playingDeck/10-C.png", 11: "src/assets/playingDeck/J-C.png", 12: "src/assets/playingDeck/Q-C.png", 13: "src/assets/playingDeck/K-C.png", 14: "src/assets/playingDeck/A-C.png"},
}

def display_card(card: Dict) -> str:
    rank = FACE.get(card["num"], str(card["num"]))
    cardImage = CARDIMAGES[card["suit"]][card["num"]]
    return f"{rank}{card['suit']}"

def build_deck() -> List[Dict]:
    return [{"suit": s, "num": r, "image": CARDIMAGES[s][r]} for s in SUITS for r in RANKS]

def double_deck_shuffled() -> List[Dict]:
    deck = build_deck() + build_deck()
    return random.sample(deck, len(deck))

def start_bj(deck: List[Dict]):
    qDeck = deque(deck)
    p1=qDeck.popleft()
    print(p1)
    d1=qDeck.popleft()
    p2=qDeck.popleft()
    d2=qDeck.popleft()
    return {"playerCards": [p1, p2], "dealerCards": [d1, d2], "deck": list(qDeck)}

def split_shuffled_decks() -> Tuple[List[Dict], List[Dict]]:
    deck = build_deck()
    shuffled = random.sample(deck, len(deck))
    mid = len(shuffled) // 2
    return shuffled[:mid], shuffled[mid:]

def play_round(deckA: List[Dict], deckB: List[Dict], bonus: List[Dict] | None = None):
    """Draw one card each. If tie, return tie with bonus to carry to WAR."""
    bonus = [] if bonus is None else list(bonus)
    qa, qb = deque(deckA), deque(deckB)
    if not qa or not qb:
        return {"deckA": deckA, "deckB": deckB, "result": "game-over", "log": "No cards to play."}

    a = qa.popleft()
    b = qb.popleft()

    if a["num"] > b["num"]:
        qa.extend([*bonus, a, b])
        return {"deckA": list(qa), "deckB": list(qb), "result": "A",
                "log": f"A wins: {display_card(a)} vs {display_card(b)}"}
    elif b["num"] > a["num"]:
        qb.extend([*bonus, b, a])
        return {"deckA": list(qa), "deckB": list(qb), "result": "B",
                "log": f"B wins: {display_card(a)} vs {display_card(b)}"}
    else:
        return {"deckA": list(qa), "deckB": list(qb), "result": "tie",
                "log": f"Tie: {display_card(a)} vs {display_card(b)}", "bonus": [a, b]}


def war_round(deckA: List[Dict], deckB: List[Dict], bonus: List[Dict]):
    """WAR: each shows 3; compare 3rd. On tie again, accumulate bonus and signal tie_again."""
    qa, qb = deque(deckA), deque(deckB)
    if len(qa) < 3 or len(qb) < 3:
        if len(qa) < 3 <= len(qb):
            return {"deckA": list(qa), "deckB": list(qb), "result": "B", "log": "A cannot continue WAR."}
        if len(qb) < 3 <= len(qa):
            return {"deckA": list(qa), "deckB": list(qb), "result": "A", "log": "B cannot continue WAR."}
        return {"deckA": list(qa), "deckB": list(qb), "result": "game-over", "log": "Both too short for WAR."}

    a1, a2, a3 = qa.popleft(), qa.popleft(), qa.popleft()
    b1, b2, b3 = qb.popleft(), qb.popleft(), qb.popleft()
    log = (f"WAR: A [{display_card(a1)},{display_card(a2)},{display_card(a3)}] vs "
           f"B [{display_card(b1)},{display_card(b2)},{display_card(b3)}] -> "
           f"{display_card(a3)} vs {display_card(b3)}")

    if a3["num"] > b3["num"]:
        qa.extend([*bonus, a1, a2, a3, b1, b2, b3])
        return {"deckA": list(qa), "deckB": list(qb), "result": "A", "log": f"{log} | A wins WAR"}
    if b3["num"] > a3["num"]:
        qb.extend([*bonus, b1, b2, b3, a1, a2, a3])
        return {"deckA": list(qa), "deckB": list(qb), "result": "B", "log": f"{log} | B wins WAR"}

    new_bonus = [*bonus, a1, a2, a3, b1, b2, b3]
    return {"deckA": list(qa), "deckB": list(qb), "result": "tie_again", "log": f"{log} | tie again", "bonus": new_bonus}