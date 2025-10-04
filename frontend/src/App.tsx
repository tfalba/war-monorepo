import { useEffect, useRef, useState } from "react";
import { startGame, playRound, war } from "./api";
import type { Card } from "./api";
import winArrow from "./assets/win-arrow.png";
// import deckBack from "./assets/riviera-deck-back.png";
import deckBack from "./assets/deck-back.png";
import greenFelt from "./assets/green-felt-backdrop.png";
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
  // const [bonus, setBonus] = useState<Card[] | null>(null);
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
    // setPrevDeckA(deckA);
    // setPrevDeckB(deckB);
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
    <div
      // className="felt-background"
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "20px 40px",
        margin: "0 auto",
        // backgroundImage: `url(${pokerBackground})`,
        backgroundSize: "cover",
        minHeight: "100vh",
        backgroundRepeat: "no-repeat",
        paddingLeft: 300,
        color: "white",
      }}
    >
      {/* <h1>War (FastAPI + React)</h1> */}
      <p style={{ margin: "0 0 10px 0" }}>{log}</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 2 }}>
        <button onClick={handleStart}>New Game</button>
        <button onClick={handleRound} disabled={!!cardA && !!cardB}>
          Play Draw
        </button>

        {/* <button onClick={handleRecord} disabled={bonus && bonus.length > 0} >Handle Record</button> */}
        <button onClick={handleClear} disabled={!cardA && !cardB}>
          Handle Clear
        </button>

        <button
          onClick={handleWar}
          disabled={!warRound || !bonus || bonus.length === 0}
        >
          Resolve WAR
        </button>
        {/* ADD HANDLE CLEAR WAR */}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 20 }}>
        <Column title={`Deck A (${prevDeckA.length})`} cards={prevDeckA} />

        {cardA && cardB ? (
          <div
            className="card-buffer"
            onClick={warRound ? handleWar : handleClear}
          >
            <CardView card={cardA} className="display-view" />
            {cardA.num > cardB.num ? (
              <img style={{ width: "70px" }} src={winArrow} alt="Win" />
            ) : (
              <span style={{ visibility: "hidden", width: "70px" }}>
                &nbsp;&nbsp;&nbsp;
              </span>
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
                // backgroundColor: "#171f78c7",
              }}
            >
              &nbsp;
            </span>
            <span style={{ visibility: "hidden", width: "70px" }} />
          </div>
        )}
      </div>
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
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 32 }}>
        <Column title={`Deck B (${prevDeckB.length})`} cards={prevDeckB} />

        {cardB && cardA ? (
          <div
            className="card-buffer"
            onClick={warRound ? handleWar : handleClear}
          >
            <CardView card={cardB} className="display-view" />
            {cardB.num > cardA.num ? (
              <img style={{ width: "70px" }} src={winArrow} alt="Win" />
            ) : (
              <span style={{ visibility: "hidden", width: "70px" }}>
                &nbsp;&nbsp;&nbsp;
              </span>
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
                backgroundColor: "#171f78c7",
              }}
            >
              &nbsp;
            </span>
            <span style={{ visibility: "hidden", width: "70px" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ title, cards }: { title: string; cards: Card[] }) {
    // const containerRef = useRef<HTMLElement | null | undefined>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rowIndices = useRowIndices(containerRef);
  const colIndices = useColumnIndices(containerRef);
  //ts-ignore
  console.log("rowIndices", rowIndices);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginRight: '-35vw',
      }}
    >
      <h3>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}  ref={containerRef}>
        {/* {cards.slice(0, 35).map((c, i) => ( */}
                  {cards.map((c, i) => (

          <>
                    {/* <CardView key={i} card={c} className="card-view" styles={{ position: "relative", left: `${-i * 50}px` }} /> */}
          {/* <div style={{ position: "relative", left: `${-i * 6}px`, top: `${i * 2}px` }} data-row={rowIndices[i] ?? -1}> */}
          <CardView idx={i} key={i} card={c} className="card-view" rowIndex={rowIndices[i] ?? -1} colIndex={colIndices[i] ?? -1} />
                  {/* <span>{rowIndices[i]}-{i}</span> */}
          {/* </div> */}
          </>

       ))}
        {cards.length > 35 && <span>…</span>}
      </div>
    </div>
  );
}
const SUITS = ["♠", "♥", "♦", "♣"];

function CardView({
  card,
  className,
  styles,
  rowIndex = 0,
  colIndex = 0,
  idx = 0,
}: {
  card: Card;
  className?: string;
  styles?: React.CSSProperties;
  rowIndex?: number;
  colIndex?: number;
  idx?: number;
}) {
  const txt = show(card);
  const redCard = card?.suit === SUITS[1] || card?.suit === SUITS[2];
  return (
    <div data-row={rowIndex} data-col={colIndex} style={{ position: "relative", left: `${-colIndex * 50}px` }}>
      {className === "card-view" ? (
        <div style={{ ...styles }} className={`${className} ${redCard ? "red-view" : ""}`}>
          <span>{txt}</span>
          <span>{rowIndex}</span>
          <span>{colIndex}</span>
          <span style={{ textAlign: "right" }}>{txt}</span>
        </div>
      ) : (
        <div style={{ ...styles }} className={`${className} ${redCard ? "red-view" : ""}`}>
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
