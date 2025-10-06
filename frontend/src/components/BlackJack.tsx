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

export default function BlackJack() {

  useEffect(() => {
    handleStart();
  }, []);
    async function handleStart() {
        console.log("Starting BlackJack game...");
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
     
    </div>
  );
}
