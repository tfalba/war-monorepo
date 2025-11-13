import { useEffect, useState } from "react";
import type { Card } from "./../api";
import winArrow from "./../assets/win-arrow.png";
import pokerBackground from "./../assets/poker-background.jpg";
import blackBackground from "./../assets/black-wavy-background.png";
import "./../App.css";
import { useGameHelpers } from "./../hooks/useGameHelpers";
import GameButtons from "./GameButtons";
import clearHand from "./../assets/clear-hand.png";
import newGame from "./../assets/new-game-2.png";
import continuePlay from "./../assets/continue-play-2.png";
// import newRound from "./../assets/new-round.png";
// import newRound from "./../assets/new-round-2.png";
// import newRound from "./../assets/new-round-3.png";
import newRound from "./../assets/new-round-4.png";
import warTitle from "./../assets/war-title.png";



import { CardView, PlayingCard } from "./CardView";

export default function War({}: {}) {
    const [flipped, setFlipped] = useState(true);

  const {
    handleStart,
    handleClear,
    handleRound,
    handleWar,
    prevDeckA,
    prevDeckB,
    cardA,
    cardB,
    bonus,
    prevBonus,
    warRound,
    prevWinningPlayer,
    log,
    roundNumber,
  } = useGameHelpers();

  const players = ["A", "B"];

  useEffect(() => {
    handleStart();
  }, []);

  // const handlePlay =
  //   cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;
      const handlePlay =
    cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;
  return (
    <div className={"war-container"}>
      <img
        src={blackBackground}
        alt="Green felt background"
        className="image-background"
      />
            <img src={warTitle} style={{width: '25vw', position: 'absolute', top: '14vh', left: '36%'}} alt="Black Jack"></img>


      <div style = {{ display: 'flex', position: 'absolute', top: 40, right: '20%'}}>
        <div onClick={handleStart}>
          {prevDeckA && prevDeckB ? (
            <img style={{ width: '15vw' }} src={newRound} alt="New Round" />
          ) : (
            <img style={{ width: '15vw' }} src={newGame} alt="Start Game" />
          )}
        </div>

        <div onClick={handlePlay}>
          {cardA && cardB ? (
            <img style={{ width: '15vw' }} src={clearHand} alt="Clear Hand" />
          ) : (
            <img
              style={{ width: '15vw' }}
              src={continuePlay}
              alt="Continue Play"
            />
          )}
        </div>
      </div>

      {players.map((p) => (
        <DisplayPlayerDeck
          key={p}
          player={p}
          cardA={cardA}
          cardB={cardB}
          handleRound={handleRound}
          handleWar={handleWar}
          handleClear={handleClear}
          prevDeckA={prevDeckA}
          prevDeckB={prevDeckB}
          warRound={warRound}
          winningPlayer={prevWinningPlayer}
          prevBonus={prevBonus}
          flipped={flipped}
          setFlipped={() => setFlipped(!flipped)}
        />
      ))}

      {bonus && bonus.length > 0 && (
        <div className="bonus-container">
          <strong>Bonus pile ({bonus.length}): </strong>
          {bonus.map((c, i) => (
            <CardView
              showCard={true}
              key={i}
              idx={i}
              card={c}
              className="card-view"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DisplayPlayerDeck({
  player,
  cardA,
  cardB,
  handleRound,
  handleWar,
  handleClear,
  prevDeckA,
  prevDeckB,
  warRound,
  winningPlayer,
  prevBonus,
  flipped,
  setFlipped,
}: {
  player: string;
  cardA: Card | null;
  cardB: Card | null;
  handleRound: () => void;
  handleWar: () => void;
  handleClear: () => void;
  prevDeckA: Card[];
  prevDeckB: Card[];
  warRound: boolean;
  winningPlayer: string | null;
  prevBonus: Card[];
  flipped: boolean;
  setFlipped: () => void;
}) {
  const cards = player === "A" ? prevDeckA : prevDeckB;
  const winner = winningPlayer === player;
  const handlePlay =
    cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;
  function showCardStatus(c: Card, i: number, classN: string) {
    if (
      c &&
      i < prevBonus.length + 2 &&
      (winner || classN === "display-view")
    ) {
      return true;
    } else return false;
  }
  // cardA && cardB ? return true : return false}
  return (
    <div
      className="player-container"
      style={{
        marginTop: player === "A" ? 30 : 0,
      }}
    >
      <div
        onClick={handlePlay}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          flex: 1.5,
          marginLeft: 100,
        }}
      >
        {[...cards].reverse().map((c, i) => (
          <CardView
            key={i}
            card={c}
            className="card-view"
            showCard={showCardStatus(c, i, "card-view")}
          />
        ))}
        <span
          className="total-style"
          // style={{ marginLeft: "8px", fontSize: "2rem", placeContent: "center", height: '3rem', width: '3rem', marginTop: '1rem', background: '#5469bf'}}
        >
          {/* {"Total: "} */}
          {cards.length}
        </span>
      </div>

      {/* <div className="card-buffer" onClick={handlePlay}>
        <CardView
          card={player === "A" ? cardA : cardB}
          className="display-view"
          showCard={showCardStatus(
            player === "A" ? cardA : cardB,
            0,
            "display-view"
          )}
        />
        {cardA &&
        cardB &&
        (player === "A" ? cardA.num > cardB.num : cardB.num > cardA.num) ? (
          <img style={{ width: "70px" }} src={winArrow} alt="Win" />
        ) : (
          <span style={{ visibility: "hidden", width: "70px" }} />
        )}
      </div> */}

      <div className="card-buffer">
        {cardA && cardB ?
        <PlayingCard flipped={flipped} setFlipped={setFlipped} frontImg={player=== "A" ? cardA?.image : cardB?.image} handlePlay={handlePlay} />
        : null }
        {/* <CardView
          card={player === "A" ? cardA : cardB}
          className="display-view"
          showCard={showCardStatus(
            player === "A" ? cardA : cardB,
            0,
            "display-view"
          )}
        /> */}
        {!flipped && cardA &&
        cardB &&
        (player === "A" ? cardA.num > cardB.num : cardB.num > cardA.num) ? (
          <img style={{ width: "70px" }} src={winArrow} alt="Win" />
        ) : (
          <span style={{ visibility: "hidden", width: "70px" }} />
        )}
      </div>
    </div>
  );
}
