import { useEffect, useState } from "react";
import { startBlackJackGame, startBlackJackRound } from "./../api";
import type { Card } from "./../api";
import pokerBackground from "./../assets/poker-background.jpg";
import "./../App.css";
import { CardView } from "./CardView";
import GameButtons from "./GameButtons";
import blackBackground from "./../assets/black-wavy-background.png";
import clearHand from "./../assets/clear-hand.png";
import newGame from "./../assets/new-game-2.png";
import continuePlay from "./../assets/continue-play.png";
import newRound from "./../assets/new-round-4.png";
import standButton from "./../assets/stand-button.png";
import hitButton from "./../assets/hit-button.png";
import blackJackTitle from "./../assets/black-jack-title.png"


const cardValue: Record<number, number> = { 11: 10, 12: 10, 13: 10, 14: 11 };
const calcValue = (c: Card) => (c ? cardValue[c.num] ?? c?.num : 0);

export default function BlackJack({}: {}) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardDeck, setDiscardDeck] = useState<Card[]>([]);
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

  function clearRound() {
    setDiscardDeck([...playerCards, ...dealerCards, ...discardDeck]);
    handleClear();
  }
  function handleClear() {
    setPlayerCards([]);
    setDealerCards([]);
    setShowDealer(false);
  }
  async function handleStart() {
    setDeck([]);
    setDiscardDeck([]);
    handleClear();
    const data = await startBlackJackGame();
    setDeck(data.deck);
  }

  async function handleDeal() {
    // setDiscardDeck([...playerCards, ...dealerCards, ...discardDeck]);
    // handleClear();
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
        src={blackBackground}
        alt="Green felt background"
        className="image-background"
      />
      <img src={blackJackTitle} style={{width: '30vw', position: 'absolute', top: '14vh', left: '34%'}} alt="Black Jack"></img>

      <div style = {{ display: 'flex', position: 'absolute', top: 40, right: '20%'}}>
        <div onClick={handleDeal}>
          {!showDealer &&
              dealerCards.length === 0 &&
              playerCards.length === 0  ? (
            <img style={{ width: '15vw' }} src={newGame} alt="New Deal" />
          ) : (
            <img style={{ width: '15vw' }} src={newRound} alt="New Round" />
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
              <span
                className="total-style"
              >
                {totalValue(dealerCards)}
              </span>
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
              <span
                className="total-style"
              >
                {totalValue(playerCards)}
              </span>
            )}
          </div>
          {showDealer ? (
            <div style={{display: 'flex'}}>
              <button onClick={clearRound} className="button-style">
                Clear
              </button>
            </div>
          ) : playerCards.length > 0 && dealerCards.length > 0 ? (
            <div style={{display: 'flex'}}>
                  <img
                  onClick={playDealer}
              style={{ width: '11vw' }}
              src={hitButton}
               alt="Hit"
            />
                  <img
                  onClick={playDealer}
              style={{ width: '13vw' }}
              src={standButton}
               alt="Stand"
            />
            </div>
     
          ) : 
           <div style={{display: 'flex'}}>
              <button onClick={handleDeal} className="button-style">
                Play
              </button>
            </div>}
        </div>
      </div>
    </div>
  );
}
