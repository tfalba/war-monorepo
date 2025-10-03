import { useEffect, useState } from "react";
import { startGame, playRound, war } from "./api";
import type { Card } from "./api";

const face: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const show = (c: Card) => `${c ? (face[c.num] ?? c.num) + c.suit :  null}`;

export default function App() {
  const [deckA, setDeckA] = useState<Card[]>([]);
  const [deckB, setDeckB] = useState<Card[]>([]);
  const [prevDeckA, setPrevDeckA] = useState<Card[]>([]);
  const [prevDeckB, setPrevDeckB] = useState<Card[]>([]);

  const [cardA, setCardA] = useState<Card | null>(null);
  const [cardB, setCardB] = useState<Card | null>(null);
  const [bonus, setBonus] = useState<Card[] | null>(null);
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
    setBonus(null);
    setLog(data.log);
  }

  function handleClear() {
    setPrevDeckA(deckA);
    setPrevDeckB(deckB);
    setCardA(null);
    setCardB(null);
    setBonus(null);
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
    if (data.result === "tie" && data.bonus) setBonus(data.bonus);
    else setBonus(null);
  }

  async function handleWar() {
    if (!bonus || bonus.length === 0) return;
    setCardA(null);
    setCardB(null);
    setPrevDeckA(deckA);
    setPrevDeckB(deckB);
    const data = await war(deckA, deckB, bonus);
    setDeckA(data.deckA);
    setDeckB(data.deckB);
    setCardA(deckA[2]);
    setCardB(deckB[2]);
    setLog(data.log);
    if (data.result === "tie_again" && data.bonus) setBonus(data.bonus);
    // else setBonus(null);
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: 16,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1>War (FastAPI + React)</h1>
      <p>{log}</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={handleStart}>New Game</button>
        <button onClick={handleRound} disabled={!!cardA && !!cardB}>
          Play Draw
        </button>

        {/* <button onClick={handleRecord} disabled={bonus && bonus.length > 0} >Handle Record</button> */}
        <button onClick={handleClear} disabled={!cardA && !cardB}>
          Handle Clear
        </button>

        <button onClick={handleWar} disabled={!bonus || bonus.length === 0}>
          Resolve WAR
        </button>
        {/* ADD HANDLE CLEAR WAR */}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Column title={`Deck A (${prevDeckA.length})`} cards={prevDeckA} />

        {cardA && cardB ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <DisplayCard card={cardA} />
            {cardA.num > cardB.num ? <span>***</span> : null}
          </div>
        ) : (
          <div />
        )}
        <Column title={`Deck B (${prevDeckB.length})`} cards={prevDeckB} />

        {cardB && cardA ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <DisplayCard card={cardB} />
            {cardB.num > cardA.num ? <span>***</span> : null}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }} />
        )}
      </div>

      {bonus && bonus.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong>Bonus pile ({bonus.length}): </strong>
          {bonus.map((c, i) => (
            <CardView key={i} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Column({ title, cards }: { title: string; cards: Card[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {cards.slice(0, 35).map((c, i) => (
          <CardView key={i} card={c} />
        ))}
        {cards.length > 35 && <span>…</span>}
      </div>
    </div>
  );
}
const SUITS = ["♠", "♥", "♦", "♣"];

function CardView({ card }: { card: Card }) {
  const txt = show(card);
  return (
    <span
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "4px 8px",
        display: "inline-block",
        minWidth: 36,
        textAlign: "center",
        color: `${
          card?.suit === SUITS[1] || card?.suit === SUITS[2] ? "red" : "black"
        }`,
      }}
    >
      {txt}
    </span>
  );
}

function DisplayCard({ card }: { card: Card }) {
  const txt = show(card);
  return (
    <span
      style={{
        border: `${
          card?.suit === SUITS[1] || card?.suit === SUITS[2]
            ? "2px solid red"
            : "2px solid black"
        }`,
        borderRadius: 8,
        padding: "4px 8px",
        display: "inline-block",
        minWidth: 36,
        width: 100,
        textAlign: "center",
        color: `${
          card?.suit === SUITS[1] || card?.suit === SUITS[2] ? "red" : "black"
        }`,
      }}
    >
      {txt}
    </span>
  );
}
