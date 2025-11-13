import { useState } from "react";
import type { Card } from "../api";
// import deckBack from "./../assets/back-deck-new.png";
import deckBack from "./../assets/new-card-back.png";


const face: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const show = (c: Card) => `${c ? (face[c.num] ?? c.num) + c.suit : null}`;

export function CardView({
  card,
  idx = 0,
  className,
  game = "War",
  showCard = false,
}: {
  card: Card;
  idx?: number;
  className?: string;
  game?: string;
  showCard?: boolean;
}) {
  const txt = show(card);
  const gameDeckSpace = game === "War" ? -60 : -74;
  const deckSpace = className==='card-view' ? gameDeckSpace : 0;
  const topSpace = game === "Black Jack" && className==='card-view' ? 0 : 0;

  return (
    <div
      className={`${className}`}
      style={{ marginTop: `${topSpace*idx}px`, marginLeft: `${deckSpace}px` }}
    >
      <img
        // style={{ height: `${showCard && '105%'}`}}
        style={{height: `${game === 'War' ? 110 : ''}`}}
        src={showCard ? card?.image : deckBack}
        alt={showCard ? txt : "deck back"}
      />
    </div>
  );
}


export function PlayingCard({ frontImg, flipped, setFlipped, handlePlay }: {frontImg: string, flipped: boolean, setFlipped: () => void, handlePlay: () => void}) {
  // const [flipped, setFlipped] = useState(true);
  const handlePlayTmp = (f: boolean) => {
    console.log(f, 'flipped');
    if (!f) {
    setFlipped()
    handlePlay()
    } else {
    setFlipped();
    console.log(flipped, f, 'flipped after')
    }
  }

  return (
        <div className="scene" onClick={() => handlePlayTmp(flipped)} role="button" tabIndex={0}>

    {/* // <div className="scene" onClick={() => setFlipped(!flipped)} role="button" tabIndex={0}> */}
      <div className={`card ${flipped ? "is-flipped" : ""}`}>
        <div className="card__face card__face--front">
          <img src={frontImg} alt="Front of card" />
        </div>
        <div className="card__face card__face--back">
          <img src={deckBack} alt="Back of card" />
        </div>
      </div>
    </div>
  );
}