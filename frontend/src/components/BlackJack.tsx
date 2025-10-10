import { useEffect, useState } from "react";
import { startBlackJackGame, startBlackJackRound } from "./../api";
import type { Card } from "./../api";
import pokerBackground from "./../assets/poker-background.jpg";
import "./../App.css";
import { CardView } from "./CardView";
import GameButtons from "./GameButtons";

const cardValue: Record<number, number> = { 11: 10, 12: 10, 13: 10, 14: 11 };
const calcValue = (c: Card) => (c ? cardValue[c.num] ?? c?.num : 0);

export default function BlackJack({
  handleGameChange,
}: {
  handleGameChange: () => void;
}) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [showDealer, setShowDealer] = useState(false);

  const totalValue = (cards: Card[]) => {
    let newValue = 0;
    cards.map((c, i) => {
      newValue += calcValue(c);
    });
    return newValue;
  };

  useEffect(() => {
    handleStart();
  }, []);

  function handleClear() {
    setPlayerCards([]);
    setDealerCards([]);
    setShowDealer(false);
  }
  async function handleStart() {
    setDeck([]);
    handleClear()
    const data = await startBlackJackGame();
    setDeck(data.deck);
  }

  async function handleDeal() {
    handleClear();
    const data = await startBlackJackRound(deck);
    setDeck(data.deck);
    setPlayerCards(data.playerCards);
    setDealerCards(data.dealerCards);
  }

  async function playDealer() {
    // const data = await playDealer(dealerCards, deck);
    setShowDealer(true);
  }

  return (
    <div className={"war-container"}>
      <img
        src={pokerBackground}
        alt="Green felt background"
        className="image-background"
      />
      <GameButtons
        handleGameChange={handleGameChange}
        handleStart={handleStart}
      />
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
            flexWrap: "wrap",
            gap: 8,
            flex: 3,
            marginLeft: 50,
          }}
        >
          {[...deck].reverse().map((c, i) => (
            <CardView
              key={i}
              card={c}
              className="card-view"
              game="Black Jack"
            />
          ))}
        </div>
        <div
          style={{ display: "flex", flex: 2, flexDirection: "column", gap: 20, minHeight: 480, justifyContent: 'flex-end' }}
        >
          <div style={{ display: "flex", gap: 14, marginLeft: 100 }}>
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
              <span>{totalValue(dealerCards)}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 14, marginLeft: 100 }}>
            {playerCards &&
              playerCards.map((c, i) => (
                <CardView
                  key={i}
                  card={c}
                  className="display-view"
                  showCard={true}
                />
              ))}
            {playerCards.length > 0 && <span>{totalValue(playerCards)}</span>}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <button className="button-style">Hit</button>
            <button onClick={playDealer} className="button-style">
              Stand
            </button>
            <button onClick={handleDeal} className="button-style">
              Begin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
