export default function GameButtons({
  handleGameChange,
    game = 'War',
}: {
  handleGameChange: () => void;
  game: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <button className="btn btn-primary" onClick={handleGameChange}>
        {game === 'War' ? 'Switch to BJ' : 'Switch to War'}
      </button>
      <span>{game}</span>
    </div>
  );
}
