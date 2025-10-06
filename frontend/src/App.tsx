import { useEffect, useRef, useState } from "react";
import { startGame, playRound, war } from "./api";
import type { Card } from "./api";
import winArrow from "./assets/win-arrow.png";
import deckBack from "./assets/deck-back.png";
import pokerBackground from "./assets/poker-background.jpg";
import "./App.css";
import { useRowIndices } from "./hooks/useRowIndices";
import { useColumnIndices } from "./hooks/useColumnIndices";

const face: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const show = (c: Card) => `${c ? (face[c.num] ?? c.num) + c.suit : null}`;

export default function App() {
  const [deckA, setDeckA] = useState<Card[]>([]);
  const [deckB, setDeckB] = useState<Card[]>([]);
  const [prevDeckA, setPrevDeckA] = useState<Card[]>([]);
  const [prevDeckB, setPrevDeckB] = useState<Card[]>([]);

  const [cardA, setCardA] = useState<Card | null>(null);
  const [cardB, setCardB] = useState<Card | null>(null);
  const [bonus, setBonus] = useState<Card[]>([]);
  const [warRound, setWarRound] = useState(false);

  const [log, setLog] = useState<string>("");

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
    setLog("Cleared cards. Ready for next draw.");
  }

  async function handleRound() {
    setCardA(null);
    setCardB(null);
    const data = await playRound(deckA, deckB, bonus);
    setPrevDeckA((deckA) => deckA.slice(-(deckA.length - 1)));
    setPrevDeckB((deckB) => deckB.slice(-(deckB.length - 1)));
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(deckA[0]);
    setCardB(deckB[0]);
    setLog(data.log);
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
    <div   style={{
          fontFamily: "system-ui, sans-serif",
          padding: "20px 40px",
          margin: "0 auto",
          paddingLeft: "15vw",
          color: "white",
        }}>
      <img
        src={pokerBackground}
        alt="Green felt background"
        style={{
          position: "fixed",
          top: 0,
          left: "-15vw",
          width: "115%",
          height: "100%",
          zIndex: -1,
          objectFit: "cover",
        }}
      />
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 2,
            justifyContent: "flex-end",
          }}
        >
          <button
            style={{
              backgroundColor: "#1e3c78",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "11px",
              fontSize: "1.8em",
            }}
            onClick={handleStart}
          >
            New Game
          </button>
        </div>
        <p
          style={{
            margin: "0 0 10px 0",
            textAlign: "right",
            fontSize: "1.5em",
          }}
        >
          {log}
        </p>

        <DisplayPlayerDeck
          player="A"
          cardA={cardA}
          cardB={cardB}
          handleRound={handleRound}
          handleWar={handleWar}
          handleClear={handleClear}
          prevDeckA={prevDeckA}
          prevDeckB={prevDeckB}
          warRound={warRound}
        />

        {bonus && bonus.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <strong>Bonus pile ({bonus.length}): </strong>
            {bonus.map((c, i) => (
              <CardView key={i} card={c} className="card-view" />
            ))}
          </div>
        )}

        <DisplayPlayerDeck
          player="B"
          cardA={cardA}
          cardB={cardB}
          handleRound={handleRound}
          handleWar={handleWar}
          handleClear={handleClear}
          prevDeckA={prevDeckA}
          prevDeckB={prevDeckB}
          warRound={warRound}
        />
      {/* </div> */}
    </div>
  );
}

function Column({ title, cards }: { title: string; cards: Card[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rowIndices = useRowIndices(containerRef);
  const colIndices = useColumnIndices(containerRef);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginRight: "-35vw",
      }}
    >
      <h3>{title}</h3>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, width: "80vw" }}
        ref={containerRef}
      >
        {cards.map((c, i) => (
          <CardView
            key={i}
            card={c}
            className="card-view"
            rowIndex={rowIndices[i] ?? -1}
            colIndex={colIndices[i] ?? -1}
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
  rowIndex = 0,
  colIndex = 0,
}: {
  card: Card;
  className?: string;
  rowIndex?: number;
  colIndex?: number;
}) {
  const txt = show(card);
  const redCard = card?.suit === SUITS[1] || card?.suit === SUITS[2];
  return (
    <div
      data-row={rowIndex}
      data-col={colIndex}
      style={{ position: "relative", left: `${-colIndex * 50}px` }}
    >
      {className === "card-view" ? (
        rowIndex === 0 && colIndex === 0 ? (
          <div className={`${className} ${redCard ? "red-view" : ""}`}>
            <span>{txt}</span>
            <span style={{ textAlign: "right" }}>{txt}</span>
          </div>
        ) : (
          <div
            className={`${className} "card-buffer"`}
            style={{
              backgroundImage: `url(${deckBack})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          ></div>
        )
      ) : (
        <div className={`${className} ${redCard ? "red-view" : ""}`}>
          <span style={{ paddingTop: "6px", paddingLeft: "6px" }}>{txt}</span>
          <span
            style={{
              textAlign: "right",
              paddingRight: "6px",
              paddingBottom: "6px",
            }}
          >
            {txt}
          </span>
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
          <span
            className="display-view"
            style={{
              backgroundImage: `url(${deckBack})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            &nbsp;
          </span>
          <span style={{ visibility: "hidden", width: "70px" }} />
        </div>
      )}
      </div>
  );
}
