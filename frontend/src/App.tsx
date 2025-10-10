import { useState } from "react";

import "./App.css";
import War from "./components/War";
import BlackJack from "./components/BlackJack";

export default function App() {
  const [playWar, setPlayWar] = useState(true);

  function toggleGame() {
    setPlayWar(!playWar);
  }

  return (
    <div className="black-marble">
      {playWar ? (
        <War handleGameChange={toggleGame} />
      ) : (
        <BlackJack handleGameChange={toggleGame} />
      )}
    </div>
  );
}
