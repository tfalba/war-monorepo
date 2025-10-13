export default function GameButtons({
  handleGameChange,
    game = 'War',
}: {
  handleGameChange: () => void;
  game: string;
}) {
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "space-between" }}>
      <button className="button-style" onClick={handleGameChange}>
        {game === 'War' ? 'Switch to BJ' : 'Switch to War'}
      </button>
      <span>{game}</span>
            {/* <button className="button-style" onClick={gameStarted ? () => handleStart(true) : () => handleStart(false)}> */}

      {/* <button className="button-style" onClick={() => handleStart(!gameStarted)}>
        {gameStarted ? 'New Round' : 'Start Game'}
      </button> */}
    </div>
  );
}

