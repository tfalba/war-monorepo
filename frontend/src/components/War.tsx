import { useEffect, useRef, useState } from "react";
import { startGame, playRound, war } from "./../api";
import type { Card } from "./../api";
import winArrow from "./../assets/win-arrow.png";
import deckBack from "./../assets/deck-back.png";
import pokerBackground from "./../assets/poker-background.jpg";
import "./../App.css";
import { useColumnIndices } from "./../hooks/useColumnIndices";

const face: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const show = (c: Card) => `${c ? (face[c.num] ?? c.num) + c.suit : null}`;

export default function War() {
  const [deckA, setDeckA] = useState<Card[]>([]);
  const [deckB, setDeckB] = useState<Card[]>([]);
  const [prevDeckA, setPrevDeckA] = useState<Card[]>([]);
  const [prevDeckB, setPrevDeckB] = useState<Card[]>([]);

  const [cardA, setCardA] = useState<Card | null>(null);
  const [cardB, setCardB] = useState<Card | null>(null);
  const [bonus, setBonus] = useState<Card[]>([]);
  const [warRound, setWarRound] = useState(false);
  const [winningPlayer, setWinningPlayer] = useState<string | null>(null);
  const [prevWinningPlayer, setPrevWinningPlayer] = useState<string | null>(null);

  const [log, setLog] = useState<string>("");
  const players = ["A", "B"];

  useEffect(() => {
    handleStart();
  }, []);

  async function handleStart() {
    const data = await startGame();
    setPrevDeckA(data.deckA);
    setPrevDeckB(data.deckB);
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(null);
    setCardB(null);
    setBonus([]);
    setLog(data.log);
  }

  function handleClear() {
    setPrevDeckA(deckA);
    setPrevDeckB(deckB);
    setCardA(null);
    setCardB(null);
    setBonus([]);
    setWarRound(false);
    setPrevWinningPlayer(winningPlayer);
    setWinningPlayer(null)
    setLog("Cleared cards. Ready for next draw.");
  }

  async function handleRound() {
    setCardA(null);
    setCardB(null);
    setWinningPlayer(null)
    const data = await playRound(deckA, deckB, bonus);
    setPrevDeckA((deckA) => deckA.slice(-(deckA.length - 1)));
    setPrevDeckB((deckB) => deckB.slice(-(deckB.length - 1)));
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(deckA[0]);
    setCardB(deckB[0]);
    setLog(data.log);
    setPrevWinningPlayer(null)
    setWinningPlayer(data.result === "A" ? "A" : data.result === "B" ? "B" : null);
    if (data.result === "tie" && data.bonus) {
      setBonus(data.bonus);
      setWarRound(true);
    } else setBonus([]);
  }

  async function handleWar() {
    if (!bonus || bonus.length === 0) return;
    setCardA(null);
    setCardB(null);
    setPrevDeckA((deckA) => deckA.slice(-(deckA.length - 3)));
    setPrevDeckB((deckB) => deckB.slice(-(deckB.length - 3)));

    const data = await war(deckA, deckB, bonus);
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(deckA[2]);
    setCardB(deckB[2]);
    setLog(data.log);
    const newBonus = bonus.concat(deckA.slice(0, 2)).concat(deckB.slice(0, 2));
    setBonus(newBonus);
    if (data.result === "tie_again" && data.bonus) {
      setBonus(data.bonus);
      setWarRound(true);
    } else {
      setWarRound(false);
    }
    // else setBonus([]);
  }

  return (
    <div className={"war-container"}>
      <img
        src={pokerBackground}
        alt="Green felt background"
        className="image-background"
      />
      <button className="button-style" onClick={handleStart}>
        New Game
      </button>
      <p
        style={{
          margin: "0 0 10px 0",
          textAlign: "center",
          fontSize: "1.8em",
        }}
      >
        {log}
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
        />
      ))}

      {bonus && bonus.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <strong>Bonus pile ({bonus.length}): </strong>
          {bonus.map((c, i) => (
            <CardView winner={true} key={i} card={c} className="card-view" />
          ))}
        </div>
      )}
      {/* </div> */}
    </div>
  );
}

function Column({ title, cards, winner }: { title: string; cards: Card[]; winner: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const colIndices = useColumnIndices(containerRef);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginRight: "-40vw",
      }}
    >
      <h3 style={{ margin: "0 auto" }}>{title}</h3>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, width: "80vw" }}
        ref={containerRef}
      >
        {[...cards].reverse().map((c, i) => (
          <CardView
            key={i}
            card={c}
            className="card-view"
            colIndex={colIndices[i] ?? -1}
            index={i}
            length={cards.length}
            winner={winner}
          />
        ))}
      </div>
    </div>
  );
}
const SUITS = ["♠", "♥", "♦", "♣"];

function CardView({
  card,
  className,
  colIndex = 0,
  index = 0,
  length = 1,
  winner = false,
}: {
  card: Card;
  className?: string;
  colIndex?: number;
  index?: number;
  length?: number;
  winner?: boolean;
}) {
  const txt = show(card);
  const redCard = card?.suit === SUITS[1] || card?.suit === SUITS[2];
  return (
    <div
      data-col={colIndex}
      style={{ position: "relative", left: `${-colIndex * 50}px` }}
    >
              { className== "display-view" || (winner && (index === 0 || index === 1)) ?

    //   {index === length - 1 || (winner && (index === 0 || index === 1)) ?
          <div className={`${className} ${redCard ? "red-view" : ""}`}>
            <span>{txt}</span>
            <span> {txt}</span>
          </div> :
            <div className={`${className} card-back`}></div>
      }
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
  winningPlayer
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
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        justifyContent: "space-evenly",
        marginTop: player === "A" ? 0 : 40,
        fontSize: "1.5em",
      }}
    >
      <Column
        title={`Player ${player} (${
          player === "A" ? prevDeckA.length : prevDeckB.length
        })`}
        cards={player === "A" ? prevDeckA : prevDeckB}
        winner={winningPlayer === player}
      />

      {cardA && cardB ? (
        <div
          className="card-buffer"
          onClick={warRound ? handleWar : handleClear}
        >
          <CardView
            card={player === "A" ? cardA : cardB}
            className="display-view"
          />
          {(player === "A" ? cardA.num > cardB.num : cardB.num > cardA.num) ? (
            <img style={{ width: "70px" }} src={winArrow} alt="Win" />
          ) : (
            <span style={{ visibility: "hidden", width: "70px" }} />
          )}
        </div>
      ) : (
        <div className="card-buffer" onClick={handleRound}>
          <span className="display-view card-back">&nbsp;</span>
          <span style={{ visibility: "hidden", width: "70px" }} />
        </div>
      )}
    </div>
  );
}
