import { useEffect, useMemo, useState } from "react";

type Color = "red" | "black" | "green";

const BANK_STORAGE_KEY = "bj_bank";
const MIN_BET = 5;
const SPIN_DURATION_MS = 2200;

const ROULETTE_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const getNumberColor = (num: number): Color => {
  if (num === 0) return "green";
  return RED_NUMBERS.has(num) ? "red" : "black";
};

const getStoredBank = () => {
  if (typeof window === "undefined") return 1000;
  const storedBank = Number(window.localStorage.getItem(BANK_STORAGE_KEY));
  return Number.isFinite(storedBank) && storedBank > 0 ? storedBank : 1000;
};

const emptyColorBets = () => ({ red: 0, black: 0, green: 0 });

export default function Roulette() {
  const [bank, setBank] = useState(() => getStoredBank());
  const [chipValue, setChipValue] = useState(5);
  const [numberBets, setNumberBets] = useState<Record<number, number>>({});
  const [colorBets, setColorBets] = useState(() => emptyColorBets());
  const [message, setMessage] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastWinAmount, setLastWinAmount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BANK_STORAGE_KEY, bank.toString());
  }, [bank]);

  const totalBet = useMemo(() => {
    const numberTotal = Object.values(numberBets).reduce((sum, amt) => sum + amt, 0);
    const colorTotal = Object.values(colorBets).reduce((sum, amt) => sum + amt, 0);
    return numberTotal + colorTotal;
  }, [colorBets, numberBets]);

  const placeBet = (updater: () => void) => {
    if (spinning) return;
    if (chipValue > bank) {
      setMessage("Not enough bankroll to place that chip.");
      return;
    }
    setMessage("");
    setBank((b) => b - chipValue);
    updater();
  };

  const handleNumberBet = (num: number) => {
    placeBet(() => {
      setNumberBets((prev) => ({
        ...prev,
        [num]: (prev[num] ?? 0) + chipValue,
      }));
    });
  };

  const handleColorBet = (color: Color) => {
    placeBet(() => {
      setColorBets((prev) => ({ ...prev, [color]: prev[color] + chipValue }));
    });
  };

  const resetBets = () => {
    setNumberBets({});
    setColorBets(emptyColorBets());
  };

  const settleBets = (result: number) => {
    const resultColor = getNumberColor(result);
    const numberBet = numberBets[result] ?? 0;
    const colorBet = colorBets[resultColor] ?? 0;

    let payout = 0;
    let profit = 0;

    if (numberBet > 0) {
      payout += numberBet * 36;
      profit += numberBet * 35;
    }

    if (resultColor === "green" && colorBets.green > 0) {
      payout += colorBets.green * 36;
      profit += colorBets.green * 35;
    } else if ((resultColor === "red" || resultColor === "black") && colorBet > 0) {
      payout += colorBet * 2;
      profit += colorBet;
    }

    setBank((b) => b + payout);
    setLastWinAmount(profit);
    setMessage(profit > 0 ? `You win $${profit}.` : "No win this spin.");
    resetBets();
  };

  const handleSpin = () => {
    if (spinning) return;
    if (totalBet <= 0) {
      setMessage("Place your bets before spinning.");
      return;
    }
    setMessage("Spinning...");
    setSpinning(true);
    setWinningNumber(null);
    setLastWinAmount(0);
    const result = Math.floor(Math.random() * 37);
    const index = ROULETTE_ORDER.indexOf(result);
    const slotAngle = 360 / ROULETTE_ORDER.length;
    const spins = 4 * 360;
    const finalRotation = spins + index * slotAngle;
    setWheelRotation((prev) => prev + finalRotation);

    window.setTimeout(() => {
      setWinningNumber(result);
      setSpinning(false);
      settleBets(result);
    }, SPIN_DURATION_MS);
  };

  const numberButtons = Array.from({ length: 37 }, (_, i) => i);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-black/30 p-6 shadow-insetFelt md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold/70">
            Casino Mode
          </p>
          <h2 className="text-4xl font-display text-chipBlue text-outline-blue">
            Roulette
          </h2>
          <p className="text-sm text-white/70">
            Place bets, spin the wheel, and chase the hit.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={handleSpin} disabled={spinning}>
            {spinning ? "Spinning..." : "Spin Wheel"}
          </button>
          <button
            className="btn btn-outline"
            onClick={resetBets}
            disabled={spinning || totalBet === 0}
          >
            Clear Bets
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
          <div className="roulette-wheel-wrap">
            <div
              className={`roulette-wheel ${spinning ? "is-spinning" : ""}`}
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="roulette-wheel__ring" />
              <div className="roulette-wheel__center">
                {winningNumber !== null ? winningNumber : "?"}
              </div>
            </div>
            <div className={`roulette-ball ${spinning ? "is-bouncing" : ""}`} />
          </div>

          <div className="rounded-2xl border border-gold/20 bg-black/30 px-4 py-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>Bankroll</span>
              <span className="text-base font-semibold text-white">
                ${bank.toFixed(0)}
              </span>
            </div>
            <div className="mt-2 grid gap-2 text-xs uppercase tracking-[0.28em] text-white/50 sm:grid-cols-2">
              <span>Total Bet</span>
              <span className="text-right text-sm font-semibold text-white/90">
                ${totalBet.toFixed(0)}
              </span>
              <span>Last Win</span>
              <span className="text-right text-sm font-semibold text-emerald-100">
                ${lastWinAmount.toFixed(0)}
              </span>
            </div>
            {message && (
              <p className="mt-3 text-xs text-gold/80">{message}</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Chip Value
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {[5, 20, 100].map((value) => (
                <button
                  key={value}
                  className={`chip-btn ${value === chipValue ? "bg-gold text-emeraldDeep" : "bg-white text-ink chip-btn-white"}`}
                  onClick={() => setChipValue(value)}
                  disabled={spinning}
                >
                  ${value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn btn-primary"
                onClick={() => handleColorBet("red")}
                disabled={spinning}
              >
                Bet Red ${colorBets.red || 0}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => handleColorBet("black")}
                disabled={spinning}
              >
                Bet Black ${colorBets.black || 0}
              </button>
              <button
                className="btn btn-accent"
                onClick={() => handleColorBet("green")}
                disabled={spinning}
              >
                Bet Green ${colorBets.green || 0}
              </button>
            </div>
            <p className="mt-3 text-xs text-white/60">
              Green pays 35:1 when 0 hits. Red/Black pay 1:1.
            </p>
          </div>

          <div className="roulette-board">
            {numberButtons.map((num) => {
              const color = getNumberColor(num);
              const betAmount = numberBets[num] ?? 0;
              return (
                <button
                  key={num}
                  className={`roulette-number ${color}`}
                  onClick={() => handleNumberBet(num)}
                  disabled={spinning}
                >
                  <span>{num}</span>
                  {betAmount > 0 && <em>${betAmount}</em>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
