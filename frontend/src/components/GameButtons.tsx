export default function GameButtons({
  handleGameChange,
    handleStart,
}: {
  handleGameChange: () => void;
  handleStart: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "space-between" }}>
      <button className="button-style" onClick={handleGameChange}>
        Switch Game
      </button>
      <button className="button-style" onClick={handleStart}>
        New Game
      </button>
    </div>
  );
}

