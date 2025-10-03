import random
from collections import deque
from typing import List, Dict, Tuple

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = list(range(2, 15))  # 2..14   (11=J,12=Q,13=K,14=A)
FACE = {11: "J", 12: "Q", 13: "K", 14: "A"}

def display_card(card: Dict) -> str:
    rank = FACE.get(card["num"], str(card["num"]))
    return f"{rank}{card['suit']}"

def build_deck() -> List[Dict]:
    return [{"suit": s, "num": r} for s in SUITS for r in RANKS]

def split_shuffled_decks() -> Tuple[List[Dict], List[Dict]]:
    deck = build_deck()
    shuffled = random.sample(deck, len(deck))
    mid = len(shuffled) // 2
    return shuffled[:mid], shuffled[mid:]

# def play_round(deckA: List[Dict], deckB: List[Dict], bonus: List[Dict] | None = None):
#     """Draw one card each. If tie, return tie with bonus to carry to WAR."""
#     bonus = [] if bonus is None else list(bonus)
#     qa, qb = deque(deckA), deque(deckB)
#     if not qa or not qb:
#         return {"deckA": deckA, "deckB": deckB, "result": "game-over", "log": "No cards to play."}

#     a = qa.popleft()
#     b = qb.popleft()

#     if a["num"] > b["num"]:
#         # qa.extend([*bonus, a, b])
#         return {"deckA": list(qa), "deckB": list(qb), "cardA": a, "cardB": b, "result": "A",
#                 "log": f"A wins: {display_card(a)} vs {display_card(b)}"}
#     elif b["num"] > a["num"]:
#         # qb.extend([*bonus, b, a])
#         return {"deckA": list(qa), "deckB": list(qb), "cardA": a, "cardB": b, "result": "B",
#                 "log": f"B wins: {display_card(a)} vs {display_card(b)}"}
#     else:
#         return {"deckA": list(qa), "deckB": list(qb), "cardA": a, "cardB": b, "result": "tie",
#                 "log": f"Tie: {display_card(a)} vs {display_card(b)}", "bonus": [a, b]}

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
    
def record_round(deckA: List[Dict], deckB: List[Dict], cardA: Dict | None = None, cardB: Dict | None = None, bonus: List[Dict] | None = None): 
    bonus = [] if bonus is None else list(bonus)
    qa, qb = deque(deckA), deque(deckB)

    if cardA > cardB:
        qa.extend([*bonus, cardA, cardB])
        return {"deckA": list(qa), "deckB": list(qb), "result": "A"}
    elif cardB > cardA:
        qb.extend([*bonus, cardB, cardA])
        return {"deckA": list(qa), "deckB": list(qb), "result": "B"}
    else:
        return {"deckA": list(qa), "deckB": list(qb), "result": "tie", "bonus": [cardA, cardB]}



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