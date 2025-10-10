import { useEffect } from "react";
import type { Card } from "./../api";
import winArrow from "./../assets/win-arrow.png";
import pokerBackground from "./../assets/poker-background.jpg";
import "./../App.css";
import { useGameHelpers } from "./../hooks/useGameHelpers";
import GameButtons from "./GameButtons";
import { CardView } from "./CardView";



export default function War({
  handleGameChange,
}: {
  handleGameChange: () => void;
}) {
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
      <p
        className="title-display"
      >
        {log
          ? `${log}${roundNumber > 0 ? ` Round ${roundNumber}` : ""}`
          : ` Begin Round ${roundNumber + 1}`}
      </p>

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
        />
      ))}

      {bonus && bonus.length > 0 && (
        <div className="bonus-container">
          <strong>Bonus pile ({bonus.length}): </strong>
          {bonus.map((c, i) => (
            <CardView showCard={true} key={i} idx={i} card={c} className="card-view" />
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
}) {
  const cards = player === "A" ? prevDeckA : prevDeckB;
  const winner = winningPlayer === player;
  const handlePlay =
    cardA && cardB ? (warRound ? handleWar : handleClear) : handleRound;
  function showCardStatus(c: Card, i: number, classN: string) {
    if ( c && (i < prevBonus.length + 2) && (winner || classN==='display-view')) {
      return true;
    } else return false;
  }
    // cardA && cardB ? return true : return false}
  return (
    <div
      className="player-container"
      style={{
        marginTop: player === "A" ? 0 : 40,
      }}
    >
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 2, marginLeft: 100 }}
      >
        {[...cards].reverse().map((c, i) => (
          <CardView
            key={i}
            card={c}
            className="card-view"
            showCard={showCardStatus(c, i, 'card-view')}
          />
        ))}
        <span style={{ marginLeft: "8px", fontSize: "1.5em", placeContent: "center", height: '1em', marginTop: '1em', background: '#06902b'}}>
          {/* {"Total: "} */}
          {cards.length}
        </span>
      </div>

      <div className="card-buffer" onClick={handlePlay}>
        <CardView
          card={player === "A" ? cardA : cardB}
          className="display-view"
          showCard={showCardStatus(player === "A" ? cardA : cardB, 0, 'display-view')}
        />
        {cardA &&
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
