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
      <img src={blackJackTitle} style={{width: '350px', position: 'absolute', top: 0, left: '30%'}} alt="Black Jack"></img>

      <div style = {{ display: 'flex', position: 'absolute', top: 10, right: 200}}>
        <div onClick={handleDeal}>
          {!showDealer &&
              dealerCards.length === 0 &&
              playerCards.length === 0  ? (
            <img style={{ width: 140 }} src={newGame} alt="New Deal" />
          ) : (
            <img style={{ width: 140 }} src={newRound} alt="New Round" />
          )}
        </div>

        {/* <div onClick={handlePlay}>
          {cardA && cardB ? (
            <img style={{ width: 180 }} src={clearHand} alt="Clear Hand" />
          ) : (
            <img
              style={{ width: 180 }}
              src={continuePlay}
              alt="Continue Play"
            />
          )}
        </div> */}
      </div>
      {/* <img
        src={pokerBackground}
        alt="Green felt background"
        className="image-background"
      /> */}
      {/* <GameButtons
        handleGameChange={handleGameChange}
        handleStart={handleStart}
      /> */}
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
            {/* {!showDealer &&
              dealerCards.length === 0 &&
              playerCards.length === 0 && (
                <button
                  onClick={handleDeal}
                  className="button-style round-button"
                >
                  Play New Hand
                </button>
              )} */}

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
                // style={{
                //   marginLeft: "8px",
                //   fontSize: "2rem",
                //   placeContent: "center",
                //   height: "3rem",
                //   width: "3rem",
                //   marginTop: "1em",
                // //   background: "#5469bf",
                //   background: "#363794",
                // }}
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
                // style={{
                //   marginLeft: "8px",
                //   fontSize: "2rem",
                //   placeContent: "center",
                //   height: "3rem",
                //   width: "3rem",
                //   marginTop: "1em",
                // //   background: "#5469bf",
                //     background: "#363794",

                // }}
              >
                {totalValue(playerCards)}
              </span>
            )}
          </div>
          {showDealer ? (
            <div>
              <button onClick={clearRound} className="button-style">
                Clear
              </button>
            </div>
          ) : playerCards.length > 0 && dealerCards.length > 0 ? (
            <div>
                  <img
                  onClick={playDealer}
              style={{ width: 122 }}
              src={hitButton}
               alt="Hit"
            />
                  <img
                  onClick={playDealer}
              style={{ width: 140 }}
              src={standButton}
               alt="Stand"
            />
            </div>
        //     <div onClick={handleStart}>
        //   {prevDeckA && prevDeckB ? (
        //     <img style={{ width: 180 }} src={newRound} alt="New Round" />
        //   ) : (
        //     <img style={{ width: 180 }} src={newGame} alt="Start Game" />
        //   )}
        // </div>

        // <div onClick={handlePlay}>
        //   {cardA && cardB ? (
        //     <img style={{ width: 180 }} src={clearHand} alt="Clear Hand" />
        //   ) : (
        //     <img
        //       style={{ width: 180 }}
        //       src={continuePlay}
        //       alt="Continue Play"
        //     />
        //   )}
        // </div>
            
            // <div style={{ display: "flex", gap: 20 }}>
            //   <button className="button-style">Hit</button>
            //   <button onClick={playDealer} className="button-style">
            //     Stand
            //   </button>
            
            // </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
