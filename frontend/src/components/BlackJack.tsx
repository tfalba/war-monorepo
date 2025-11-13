import { useCallback, useEffect, useState } from "react";
import { bjStart, bjRound } from "./../api";
import "./../App.css";
import { CardView } from "./CardView";
import blackBackground from "./../assets/black-wavy-background.png";
import newGame from "./../assets/new-game-2.png";
import newRound from "./../assets/new-round-4.png";
import standButton from "./../assets/stand-button.png";
import hitButton from "./../assets/hit-button.png";
import blackJackTitle from "./../assets/black-jack-title.png";
import type { BJDeckState, Card } from "../types";

const cardValue: Record<number, number> = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 10,
  12: 10,
  13: 10,
  14: 11,
};

const faceLookup: Record<string, number> = {
  J: 10,
  Q: 10,
  K: 10,
  A: 11,
};

const calcValue = (card: Card | null) => {
  if (!card) return 0;
  if (typeof card.num === "number") {
    return cardValue[card.num] ?? 0;
  }
  if (typeof card.rank === "number") {
    return cardValue[card.rank] ?? 0;
  }
  if (typeof card.rank === "string") {
    if (card.rank in faceLookup) {
      return faceLookup[card.rank];
    }
    const numericRank = Number(card.rank);
    return Number.isNaN(numericRank) ? 0 : numericRank;
  }
  return 0;
};

export default function BlackJack() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardDeck, setDiscardDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [showDealer, setShowDealer] = useState(false);

  const totalValue = (cards: Card[]) =>
    cards.reduce((total, card) => total + calcValue(card), 0);

  function clearRound() {
    if (playerCards.length === 0 && dealerCards.length === 0) {
      return;
    }
    setDiscardDeck((prev) => [...playerCards, ...dealerCards, ...prev]);
    handleClear();
  }
  const handleClear = useCallback(() => {
    setPlayerCards([]);
    setDealerCards([]);
    setShowDealer(false);
  }, []);
  const handleStart = useCallback(async () => {
    setDeck([]);
    setDiscardDeck([]);
    handleClear();
    const data = await bjStart();
    setDeck(data.deck ?? []);
  }, [handleClear]);

  useEffect(() => {
    void handleStart();
  }, [handleStart]);

  async function handleDeal() {
    if (deck.length === 0) return;
    const payload: BJDeckState = { deck };
    const data = await bjRound(payload);
    setDeck(data.deck ?? []);
    setPlayerCards(data.playerCards ?? []);
    setDealerCards(data.dealerCards ?? []);
    setShowDealer(false);
  }

  async function playDealer() {
    setShowDealer(true);
  }

  return (
    <div>
      {/* <img
        src={blackBackground}
        alt="Green felt background"
        className="image-background"
      /> */}
      <img
        src={blackJackTitle}
        style={{
          width: "30vw",
          position: "absolute",
          top: "14vh",
          left: "34%",
        }}
        alt="Black Jack"
      ></img>

      <div
        style={{ display: "flex", position: "absolute", top: 40, right: "20%" }}
      >
        <div onClick={handleDeal}>
          {!showDealer &&
          dealerCards.length === 0 &&
          playerCards.length === 0 ? (
            <img style={{ width: "15vw" }} src={newGame} alt="New Deal" />
          ) : (
            <img style={{ width: "15vw" }} src={newRound} alt="New Round" />
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-start",
          gap: 40,
          marginTop: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 30,
            minHeight: 500,
            marginLeft: 50,
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              //   flex: 3,
              marginLeft: 50,
              marginRight: 80,
            }}
          >
            {[...deck].reverse().map((c, i) => (
              <CardView
                key={i}
                idx={i}
                card={c}
                className="card-view"
                game="Black Jack"
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              //   flex: 3,
              marginLeft: 50,
              marginRight: 80,
            }}
          >
            {[...discardDeck].reverse().map((c, i) => (
              <CardView
                key={i}
                idx={i}
                card={c}
                className="card-view"
                game="Black Jack"
                showCard={true}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 2,
            flexDirection: "column",
            gap: 20,
            minHeight: 480,
            minWidth: 400,
            justifyContent: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {dealerCards &&
              dealerCards.map((c, i) => (
                <CardView
                  key={i}
                  card={c}
                  className="display-view"
                  showCard={i === 0 ? showDealer : true}
                />
              ))}
            {dealerCards && showDealer && (
              <span className="total-style">{totalValue(dealerCards)}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {playerCards &&
              playerCards.map((c, i) => (
                <CardView
                  key={i}
                  card={c}
                  className="display-view"
                  showCard={true}
                />
              ))}
            {playerCards.length > 0 && (
              <span className="total-style">{totalValue(playerCards)}</span>
            )}
          </div>
          {showDealer ? (
            <div style={{ display: "flex" }}>
              <button onClick={clearRound} className="button-style">
                Clear
              </button>
            </div>
          ) : playerCards.length > 0 && dealerCards.length > 0 ? (
            <div style={{ display: "flex" }}>
              <img
                onClick={playDealer}
                style={{ width: "11vw" }}
                src={hitButton}
                alt="Hit"
              />
              <img
                onClick={playDealer}
                style={{ width: "13vw" }}
                src={standButton}
                alt="Stand"
              />
            </div>
          ) : (
            <div style={{ display: "flex" }}>
              <button onClick={handleDeal} className="button-style">
                Play
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
