import { useState } from "react";
import War from "./components/War";
import BlackJack from "./components/BlackJack";
import Roulette from "./components/Roulette";

type Game = "War" | "Blackjack" | "Roulette";

export default function App() {
  const [selectedGame, setSelectedGame] = useState<Game>("War");

  const games: Game[] = ["War", "Blackjack", "Roulette"];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emeraldDeep via-felt to-table text-paper">
      <div className="mx-auto flex max-w-[100rem] flex-col gap-3 border border-white/10 bg-black/50 px-7 py-4 text-left shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4">
          <div className="flex gap-4 items-center">
            <p className="text-lg uppercase font-semibold tracking-[0.35em] text-paper/90">
              Card Arcade
            </p>
            <h1 className="text-5xl font-cursive font-semibold text-gold/90">{selectedGame}</h1>
           
          </div>
          <div className="flex flex-wrap gap-2">
            {games.map((game) => (
              <button
                key={game}
                className={`btn ${selectedGame === game ? "btn-primary" : "btn-outline-paper"}`}
                onClick={() => setSelectedGame(game)}
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        {selectedGame === "War" ? (
          <War />
        ) : selectedGame === "Blackjack" ? (
          <BlackJack />
        ) : (
          <Roulette />
        )}
      </div>
    </div>
  );
}
