import { useEffect, useRef, useState } from "react";
import { startGame, playRound, war } from "./api";
import type { Card } from "./api";
import winArrow from "./assets/win-arrow.png";
import deckBack from "./assets/deck-back.png";
import pokerBackground from "./assets/poker-background.jpg";
import "./App.css";
import { useRowIndices } from "./hooks/useRowIndices";
import { useColumnIndices } from "./hooks/useColumnIndices";
import War from "./components/War";
import BlackJack from "./components/BlackJack";

const face: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const show = (c: Card) => `${c ? (face[c.num] ?? c.num) + c.suit : null}`;

export default function App() {
  const [playWar, setPlayWar] = useState(true);

  function toggleGame() {
    setPlayWar(!playWar);
  }

  return (
    <>
      <button className="button-style switch-button" onClick={toggleGame}>
        {!playWar ? "Switch to War" : "Switch to BlackJack"}
      </button>
      {playWar ? <War /> : <BlackJack />}
    </>
  );
}
