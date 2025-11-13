import { useState } from "react";

import "./App.css";
import "./index.css";

import War from "./components/War";
import BlackJack from "./components/BlackJack";
import switchGame from "./assets/switch-game-2.png";

export default function App() {
  const [selectedGame, setSelectedGame] = useState("War");

  function toggleGame(otherGame: string) {
    setSelectedGame(otherGame);
  }

  return (
        <div className="bg-felt bg-tablePattern shadow-insetFelt rounded-2xl p-8 text-gold">
      <div style={{ display: "flex", marginLeft: 40, marginTop: 40 }}>
        <img
          onClick={() =>
            toggleGame(selectedGame === "War" ? "Black Jack" : "War")
          }
          style={{ width: "15vw" }}
          src={switchGame}
          alt="Green felt background"
        />
      </div>
      <div>
        {selectedGame === "War" ? <War /> : <BlackJack />}
      </div>
    </div>
  );
}
