import random
from collections import deque
from typing import List, Dict, Tuple, Optional

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = list(range(2, 15))  # 2..14   (11=J,12=Q,13=K,14=A)
FACE = {11: "J", 12: "Q", 13: "K", 14: "A"}
CARDIMAGES = {
    "♠": {2: "/assets/playingDeck/2-S.png", 3: "/assets/playingDeck/3-S.png", 4: "/assets/playingDeck/4-S.png", 5: "/assets/playingDeck/5-S.png", 6: "/assets/playingDeck/6-S.png", 7: "/assets/playingDeck/7-S.png", 8: "/assets/playingDeck/8-S.png", 9: "/assets/playingDeck/9-S.png", 10: "/assets/playingDeck/10-S.png", 11: "/assets/playingDeck/J-S.png", 12: "/assets/playingDeck/Q-S.png", 13: "/assets/playingDeck/K-S.png", 14: "/assets/playingDeck/A-S.png"},
    "♥": {2: "/assets/playingDeck/2-H.png", 3: "/assets/playingDeck/3-H.png", 4: "/assets/playingDeck/4-H.png", 5: "/assets/playingDeck/5-H.png", 6: "/assets/playingDeck/6-H.png", 7: "/assets/playingDeck/7-H.png", 8: "/assets/playingDeck/8-H.png", 9: "/assets/playingDeck/9-H.png", 10: "/assets/playingDeck/10-H.png", 11: "/assets/playingDeck/J-H.png", 12: "/assets/playingDeck/Q-H.png", 13: "/assets/playingDeck/K-H.png", 14: "/assets/playingDeck/A-H.png"},
    "♦": {2: "/assets/playingDeck/2-D.png", 3: "/assets/playingDeck/3-D.png", 4: "/assets/playingDeck/4-D.png", 5: "/assets/playingDeck/5-D.png", 6: "/assets/playingDeck/6-D.png", 7: "/assets/playingDeck/7-D.png", 8: "/assets/playingDeck/8-D.png", 9: "/assets/playingDeck/9-D.png", 10: "/assets/playingDeck/10-D.png", 11: "/assets/playingDeck/J-D.png", 12: "/assets/playingDeck/Q-D.png", 13: "/assets/playingDeck/K-D.png", 14: "/assets/playingDeck/A-D.png"},
    "♣": {2: "/assets/playingDeck/2-C.png", 3: "/assets/playingDeck/3-C.png", 4: "/assets/playingDeck/4-C.png", 5: "/assets/playingDeck/5-C.png", 6: "/assets/playingDeck/6-C.png", 7: "/assets/playingDeck/7-C.png", 8: "/assets/playingDeck/8-C.png", 9: "/assets/playingDeck/9-C.png", 10: "/assets/playingDeck/10-C.png", 11: "/assets/playingDeck/J-C.png", 12: "/assets/playingDeck/Q-C.png", 13: "/assets/playingDeck/K-C.png", 14: "/assets/playingDeck/A-C.png"},
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
    p_cards = [qDeck.popleft(), qDeck.popleft()]
    d_cards = [qDeck.popleft(), qDeck.popleft()]
    return build_bj_state(list(qDeck), p_cards, d_cards, "player-turn", reveal=False, log="Blackjack deal")

def split_shuffled_decks() -> Tuple[List[Dict], List[Dict]]:
    deck = build_deck()
    shuffled = random.sample(deck, len(deck))
    mid = len(shuffled) // 2
    return shuffled[:mid], shuffled[mid:]

def play_round(deckA: List[Dict], deckB: List[Dict], bonus: Optional[List[Dict]] = None):
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


# ---------------- Blackjack helpers ---------------- #
def bj_card_value(card: Dict) -> int:
    num = card["num"]
    if num >= 11 and num <= 13:
        return 10
    if num == 14:
        return 11
    return num


def bj_hand_value(cards: List[Dict]) -> int:
    total = 0
    aces = 0
    for card in cards:
        value = bj_card_value(card)
        total += value
        if card["num"] == 14:
            aces += 1
    while total > 21 and aces > 0:
        total -= 10
        aces -= 1
    return total


def build_bj_state(
    deck: List[Dict],
    player_cards: List[Dict],
    dealer_cards: List[Dict],
    status: str,
    reveal: bool,
    log: str = "",
) -> Dict:
    return {
        "deck": deck,
        "playerCards": player_cards,
        "dealerCards": dealer_cards,
        "playerValue": bj_hand_value(player_cards),
        "dealerValue": bj_hand_value(dealer_cards),
        "status": status,
        "revealDealer": reveal,
        "log": log,
    }


def bj_hit(deck: List[Dict], player_cards: List[Dict], dealer_cards: List[Dict]) -> Dict:
    qDeck = deque(deck)
    player = list(player_cards)
    dealer = list(dealer_cards)
    if qDeck:
        drawn = qDeck.popleft()
        player.append(drawn)
        log = f"Player hits: {display_card(drawn)}"
    else:
        log = "No more cards in shoe."
    value = bj_hand_value(player)
    if value > 21:
        return build_bj_state(list(qDeck), player, dealer, "player-bust", True, "Player busts!")
    return build_bj_state(list(qDeck), player, dealer, "player-turn", False, log)


def bj_stand(deck: List[Dict], player_cards: List[Dict], dealer_cards: List[Dict]) -> Dict:
    qDeck = deque(deck)
    player = list(player_cards)
    dealer = list(dealer_cards)
    while bj_hand_value(dealer) < 17 and qDeck:
        dealer.append(qDeck.popleft())
    player_total = bj_hand_value(player)
    dealer_total = bj_hand_value(dealer)
    if dealer_total > 21:
        status = "dealer-bust"
        log = "Dealer busts!"
    elif dealer_total < player_total:
        status = "player-win"
        log = "Player wins!"
    elif dealer_total > player_total:
        status = "dealer-win"
        log = "Dealer wins!"
    else:
        status = "push"
        log = "Push."
    return build_bj_state(list(qDeck), player, dealer, status, True, log)
