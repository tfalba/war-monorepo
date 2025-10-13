import { useState } from "react";

import "./App.css";
import War from "./components/War";
import BlackJack from "./components/BlackJack";
import GameButtons from "./components/GameButtons";
import switchGame from "./assets/switch-game-2.png"


export default function App() {
  const [selectedGame, setSelectedGame] = useState('War');
  const [startGame, setStartGame] = useState(false);

  function toggleGame(otherGame: string) {
    setSelectedGame(otherGame);
    setStartGame(false);
    // Do we want a setStartGame(false)?
    // setPlayWar(!playWar);
  }

  function handleNewRound(game: string) {
    // setSelectedGame(selectedGame)
    if (startGame && game === selectedGame) { 
      setStartGame(true)
    return true;
    }
  else {setStartGame(false); return false;}
  }

  async function handleStart(start: boolean) {
      if (start) {
        setStartGame(false);
        handleNewRound(selectedGame);
      } else {
      setStartGame(true);
      handleNewRound(selectedGame);
      }
      // handleNewRound(selectedGame)
    // console.log(newRound, 'new')
    // setStartGame(newRound);
    // handleNewRound(selectedGame);
  }

  return (
    <>
      <div style={{display: 'flex', marginLeft: 40}} >
         
                 <img
                 onClick={() => toggleGame(selectedGame === 'War' ? 'Black Jack' : 'War')}
                 style={{width: 140}}
        src={switchGame}
        alt="Green felt background"
      />
        {/* {selectedGame === 'War' ? 'Switch to BJ' : 'Switch to War'} */}
      </div>
       {/* <GameButtons
              handleGameChange={() => toggleGame(selectedGame === 'War' ? 'Black Jack' : 'War')}
              game={selectedGame}
            /> */}
    <div className="black-marble">
    
      {selectedGame === 'War' ? (
        <War  />
      ) : (
        <BlackJack  />
      )}
    </div>
    </>
  );
}
