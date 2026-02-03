import { useEffect, useMemo, useRef, useState } from "react";

type Color = "red" | "black" | "green";
type BetStack = { amount: number; chip: number };

const BANK_STORAGE_KEY = "bj_bank";
const SPIN_DURATION_MS = 2200;

const ROULETTE_ORDER: string[] = [
  "00",
  "32",
  "15",
  "19",
  "04",
  "21",
  "02",
  "25",
  "17",
  "34",
  "06",
  "27",
  "13",
  "28",
  "11",
  "30",
  "08",
  "23",
  "10",
  "05",
  "24",
  "16",
  "33",
  "01",
  "20",
  "14",
  "31",
  "09",
  "22",
  "18",
  "29",
  "07",
  "36",
  "12",
  "35",
  "03",
  "26",
];

const RED_NUMBERS = new Set([
  "01",
  "03",
  "05",
  "07",
  "09",
  "12",
  "14",
  "16",
  "18",
  "19",
  "21",
  "23",
  "25",
  "27",
  "28",
  "30",
  "32",
  "34",
]);

const getNumberColor = (num: string): Color => {
  if (num === "00") console.log(num, "green");
  if (RED_NUMBERS.has(num)) console.log(num, "red");
  if (!RED_NUMBERS.has(num) && num !== "00") console.log(num, "black");
  if (num === "00") return "green";
  return RED_NUMBERS.has(num) ? "red" : "black";
};

const DEFAULT_CHIP = 5;

const getChipClass = (chip: number) => {
  if (chip >= 100) return "roulette-coin roulette-coin--blue";
  if (chip >= 20) return "roulette-coin roulette-coin--red";
  return "roulette-coin roulette-coin--white";
};

const getChipForAmount = (amount: number) => {
  if (amount >= 100) return 100;
  if (amount >= 20) return 20;
  return 5;
};

const getStoredBank = () => {
  if (typeof window === "undefined") return 1000;
  const storedBank = Number(window.localStorage.getItem(BANK_STORAGE_KEY));
  return Number.isFinite(storedBank) && storedBank > 0 ? storedBank : 1000;
};

const emptyColorBets = (): Record<Color, BetStack> => ({
  red: { amount: 0, chip: DEFAULT_CHIP },
  black: { amount: 0, chip: DEFAULT_CHIP },
  green: { amount: 0, chip: DEFAULT_CHIP },
});

export default function Roulette() {
  const [bank, setBank] = useState(() => getStoredBank());
  const [lastChipValue, setLastChipValue] = useState(DEFAULT_CHIP);
  const [numberBets, setNumberBets] = useState<Record<string, BetStack>>({});
  const [colorBets, setColorBets] = useState(() => emptyColorBets());
  const [message, setMessage] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const dragStateRef = useRef<
    | {
        kind: "number";
        num: string;
        amount: number;
        chip: number;
        handled: boolean;
      }
    | {
        kind: "color";
        color: Color;
        amount: number;
        chip: number;
        handled: boolean;
      }
    | { kind: "chip"; amount: number; chip: number; handled: boolean }
    | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BANK_STORAGE_KEY, bank.toString());
  }, [bank]);

  const totalBet = useMemo(() => {
    const numberTotal = Object.values(numberBets).reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );
    const colorTotal = Object.values(colorBets).reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );
    return numberTotal + colorTotal;
  }, [colorBets, numberBets]);

  const wheelBackground = useMemo(() => {
    const slotAngle = 360 / ROULETTE_ORDER.length;
    const segments = ROULETTE_ORDER.map((num, idx) => {
      const color = getNumberColor(num);
      const fill =
        color === "red"
          ? "rgba(178, 34, 34, 0.75)"
          : color === "black"
            ? "rgba(15, 15, 15, 0.9)"
            : "rgba(10, 122, 72, 0.9)";
      const start = idx * slotAngle;
      const end = (idx + 1) * slotAngle;
      return `${fill} ${start}deg ${end}deg`;
    }).join(", ");
    return `radial-gradient(circle at center, rgba(12, 12, 12, 0.9) 0 35%, transparent 36%), conic-gradient(${segments})`;
  }, []);

  const placeBetAmount = (amount: number, updater: () => void) => {
    if (spinning) return;
    if (amount > bank) {
      setMessage("Not enough bankroll to place that chip.");
      return;
    }
    setMessage("");
    setBank((b) => b - amount);
    updater();
  };

  const handleNumberBet = (num: string, amount: number) => {
    placeBetAmount(amount, () => {
      setNumberBets((prev) => ({
        ...prev,
        [num]: {
          amount: (prev[num]?.amount ?? 0) + amount,
          chip: amount,
        },
      }));
    });
  };

  const removeNumberBet = (num: string, amount: number) => {
    if (amount <= 0) return;
    setNumberBets((prev) => {
      const current = prev[num]?.amount ?? 0;
      const nextAmount = Math.max(0, current - amount);
      if (nextAmount === 0) {
        const next = { ...prev };
        delete next[num];
        return next;
      }
      return { ...prev, [num]: { amount: nextAmount, chip: prev[num]?.chip ?? DEFAULT_CHIP } };
    });
  };

  const removeColorBet = (color: Color, amount: number) => {
    if (amount <= 0) return;
    setColorBets((prev) => ({
      ...prev,
      [color]: {
        amount: Math.max(0, prev[color].amount - amount),
        chip: prev[color].chip,
      },
    }));
  };

  const handleDragStartNumber = (
    event: React.DragEvent<HTMLSpanElement>,
    num: string,
    amount: number,
  ) => {
    dragStateRef.current = {
      kind: "number",
      num,
      amount,
      chip: numberBets[num]?.chip ?? DEFAULT_CHIP,
      handled: false,
    };
    event.dataTransfer.setDragImage(event.currentTarget, 12, 12);
  };

  const handleDragStartColor = (
    event: React.DragEvent<HTMLSpanElement>,
    color: Color,
    amount: number,
  ) => {
    dragStateRef.current = {
      kind: "color",
      color,
      amount,
      chip: colorBets[color].chip ?? DEFAULT_CHIP,
      handled: false,
    };
    event.dataTransfer.setDragImage(event.currentTarget, 12, 12);
  };

  const handleDragStartChip = (
    event: React.DragEvent<HTMLButtonElement>,
    amount: number,
  ) => {
    dragStateRef.current = { kind: "chip", amount, chip: amount, handled: false };
    setLastChipValue(amount);
    event.dataTransfer.setDragImage(event.currentTarget, 12, 12);
  };

  const handleDropOnNumber = (targetNum: string) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    dragState.handled = true;
    if (dragState.kind === "number") {
      if (dragState.num === targetNum) return;
      setNumberBets((prev) => ({
        ...prev,
        [targetNum]: {
          amount: (prev[targetNum]?.amount ?? 0) + dragState.amount,
          chip: dragState.chip,
        },
      }));
      removeNumberBet(dragState.num, dragState.amount);
      return;
    }
    if (dragState.kind === "color") {
      setNumberBets((prev) => ({
        ...prev,
        [targetNum]: {
          amount: (prev[targetNum]?.amount ?? 0) + dragState.amount,
          chip: dragState.chip,
        },
      }));
      removeColorBet(dragState.color, dragState.amount);
      return;
    }
    if (dragState.kind === "chip") {
      const amount = dragState.amount;
      if (amount > bank) {
        setMessage("Not enough bankroll to place that chip.");
        return;
      }
      setMessage("");
      setBank((b) => b - amount);
      setNumberBets((prev) => ({
        ...prev,
        [targetNum]: {
          amount: (prev[targetNum]?.amount ?? 0) + amount,
          chip: dragState.chip,
        },
      }));
    }
  };

  const handleDropOnColor = (targetColor: Color) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    dragState.handled = true;
    if (dragState.kind === "color") {
      if (dragState.color === targetColor) return;
      setColorBets((prev) => ({
        ...prev,
        [targetColor]: {
          amount: prev[targetColor].amount + dragState.amount,
          chip: dragState.chip,
        },
      }));
      removeColorBet(dragState.color, dragState.amount);
      return;
    }
    if (dragState.kind === "number") {
      setColorBets((prev) => ({
        ...prev,
        [targetColor]: {
          amount: prev[targetColor].amount + dragState.amount,
          chip: dragState.chip,
        },
      }));
      removeNumberBet(dragState.num, dragState.amount);
      return;
    }
    if (dragState.kind === "chip") {
      const amount = dragState.amount;
      if (amount > bank) {
        setMessage("Not enough bankroll to place that chip.");
        return;
      }
      setMessage("");
      setBank((b) => b - amount);
      setColorBets((prev) => ({
        ...prev,
        [targetColor]: {
          amount: prev[targetColor].amount + amount,
          chip: dragState.chip,
        },
      }));
    }
  };

  const handleDragEnd = () => {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    if (!dragState.handled) {
      if (dragState.kind === "number") {
        removeNumberBet(dragState.num, dragState.amount);
      } else if (dragState.kind === "color") {
        removeColorBet(dragState.color, dragState.amount);
      }
    }
    dragStateRef.current = null;
  };

  const handleColorBet = (color: Color, amount: number) => {
    placeBetAmount(amount, () => {
      setColorBets((prev) => ({
        ...prev,
        [color]: {
          amount: prev[color].amount + amount,
          chip: amount,
        },
      }));
    });
  };

  const resetBets = () => {
    setNumberBets({});
    setColorBets(emptyColorBets());
  };

  const settleBets = (result: string) => {
    const resultColor = getNumberColor(result);
    const numberBet = numberBets[result]?.amount ?? 0;
    const colorBet = colorBets[resultColor]?.amount ?? 0;

    let payout = 0;
    let profit = 0;

    if (numberBet > 0) {
      payout += numberBet * 36;
      profit += numberBet * 35;
    }

    if (resultColor === "green" && colorBets.green.amount > 0) {
      payout += colorBets.green.amount * 36;
      profit += colorBets.green.amount * 35;
    } else if (
      (resultColor === "red" || resultColor === "black") &&
      colorBet > 0
    ) {
      payout += colorBet * 2;
      profit += colorBet;
    }

    setBank((b) => b + payout);
    setLastWinAmount(profit);
    setMessage(profit > 0 ? `You win $${profit}.` : "No win this spin.");
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
    const index = ROULETTE_ORDER.indexOf(result.toLocaleString());
    const slotAngle = 360 / ROULETTE_ORDER.length;
    const spins = 4 * 360;
    const finalRotation = spins + index * slotAngle;
    setWheelRotation((prev) => prev + finalRotation);
    setBallRotation((prev) => prev - finalRotation);
    const resultStr = ROULETTE_ORDER[result];

    window.setTimeout(() => {
      setWinningNumber(resultStr);
      setSpinning(false);
      settleBets(resultStr);
    }, SPIN_DURATION_MS);
  };

  const numberButtons = Array.from({ length: 37 }, (_, i) => i);
  const numberStrs = numberButtons.map((n) => {
    if (n < 10) {
      console.log(`0${n}`);
      return `0${n}`;
    } else {
      console.log(n.toString());
      return n.toLocaleString();
    }
  });

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
          <button
            className="btn btn-primary"
            onClick={handleSpin}
            disabled={spinning}
          >
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

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] pb-6">
        <div className="flex flex-col gap-4">
          <div className="roulette-wheel-wrap">
            <div
              className={`roulette-wheel ${spinning ? "is-spinning" : ""}`}
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                background: wheelBackground,
              }}
            >
              <div className="roulette-wheel__ring" />
              {ROULETTE_ORDER.map((num, idx) => (
                <span
                  key={`wheel-${num}-${idx}`}
                  className={`roulette-wheel__number ${getNumberColor(num)}`}
                  style={{
                    transform: `rotate(${idx * (360 / ROULETTE_ORDER.length)}deg)`,
                  }}
                >
                  <span className="roulette-wheel__number-text">{num}</span>
                </span>
              ))}
              <div className="roulette-wheel__center">
                {winningNumber !== null ? winningNumber : "?"}
              </div>
            </div>
            <div
              className={`roulette-ball-orbit ${spinning ? "is-spinning" : ""}`}
              style={{ transform: `rotate(${ballRotation}deg)` }}
            >
              <div
                className={`roulette-ball ${spinning ? "is-bouncing" : ""}`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-black/80 px-4 py-4 shadow-soft mx-auto min-w-[50%] w-[320px]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>Bankroll</span>
              <span className="text-base font-semibold text-white">
                ${bank.toFixed(0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.36em] text-white/50">
              <span>Total Bet</span>
              <span className="text-right text-sm font-semibold text-white/90">
                ${totalBet.toFixed(0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.36em] text-white/50">
              <span>Last Win</span>
              <span className="text-right text-sm font-semibold text-emerald-100">
                ${lastWinAmount.toFixed(0)}
              </span>
            </div>
            {message && <p className="mt-3 text-xs text-gold/80">{message}</p>}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Drag Chips
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {[5, 20, 100].map((value) => {
                  const chipClass =
                    value === 5
                      ? "bg-white text-ink chip-btn-white"
                      : value === 20
                        ? "bg-chipRed text-white"
                        : "bg-chipBlue text-white";
                  return (
                    <button
                      key={value}
                      className={`chip-btn ${chipClass}`}
                      draggable={!spinning}
                      onDragStart={(event) => handleDragStartChip(event, value)}
                      onClick={() => setLastChipValue(value)}
                      disabled={spinning}
                    >
                      ${value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 pt-2 pb-4 px-4 shadow-soft">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn rounded-xl text-white focus-visible:outline-gold/60 flex-1"
                style={{ background: "rgba(178, 34, 34, 0.85)" }}
                onClick={() => handleColorBet("red", lastChipValue)}
                disabled={spinning}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnColor("red")}
              >
                <span className="flex items-center gap-1">
                  <span>Bet Red</span>
                  <span
                    className="roulette-stack"
                    draggable={colorBets.red.amount > 0 && !spinning}
                    onDragStart={(event) =>
                      handleDragStartColor(event, "red", colorBets.red.amount)
                    }
                    onDragEnd={handleDragEnd}
                  >
                    {colorBets.red.amount > 0 && (
                      <span className={getChipClass(colorBets.red.chip)}>
                        ${colorBets.red.amount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <button
                className="btn btn-outline rounded-xl bg-black/85 flex-1"
                onClick={() => handleColorBet("black", lastChipValue)}
                disabled={spinning}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnColor("black")}
              >
                <span className="flex items-center gap-1">
                  <span>Bet Black</span>
                  <span
                    className="roulette-stack"
                    draggable={colorBets.black.amount > 0 && !spinning}
                    onDragStart={(event) =>
                      handleDragStartColor(event, "black", colorBets.black.amount)
                    }
                    onDragEnd={handleDragEnd}
                  >
                    {colorBets.black.amount > 0 && (
                      <span className={getChipClass(colorBets.black.chip)}>
                        ${colorBets.black.amount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </div>
          </div>
          <div className="roulette-board">
            {numberStrs
              .filter((num) => num !== "00")
              .map((num) => {
                const color = getNumberColor(num);
                const betAmount = numberBets[num]?.amount ?? 0;
                const betChip = getChipForAmount(betAmount);
                const isWinner = winningNumber === num;
                

                return (
                  <button
                    key={num}
                    className={`roulette-number ${color} ${isWinner ? "winner" : ""}`}
                    onClick={() => handleNumberBet(num, lastChipValue)}
                    disabled={spinning}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropOnNumber(num)}
                  >
                    <span>{num}</span>
                    <span
                      className="roulette-stack"
                      aria-label={`$${betAmount} bet`}
                      draggable={betAmount > 0 && !spinning}
                      onDragStart={(event) =>
                        handleDragStartNumber(event, num, betAmount)
                      }
                      onDragEnd={handleDragEnd}
                    >
                    {betAmount > 0 && (
                      <span key={`coin-${num}`} className={getChipClass(betChip)}>
                        ${betAmount}
                      </span>
                    )}
                    </span>
                  </button>
                );
              })}
          </div>
          <button
            key={"00"}
            className={`mx-auto w-[40%] roulette-number ${getNumberColor("00")} ${winningNumber === "00" ? "winner" : ""}`}
            onClick={() => handleNumberBet("00", lastChipValue)}
            disabled={spinning}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDropOnNumber("00")}
          >
            <span>{"00"}</span>
            <span
              className="roulette-stack"
              aria-label={`$${numberBets["00"]?.amount ?? 0} bet`}
              draggable={(numberBets["00"]?.amount ?? 0) > 0 && !spinning}
              onDragStart={(event) =>
                handleDragStartNumber(event, "00", numberBets["00"]?.amount ?? 0)
              }
              onDragEnd={handleDragEnd}
            >
              {(numberBets["00"]?.amount ?? 0) > 0 && (
                <span
                  key="coin-00"
                  className={getChipClass(getChipForAmount(numberBets["00"]?.amount ?? 0))}
                >
                  ${numberBets["00"]?.amount ?? 0}
                </span>
              )}
            </span>
          </button>
          <p className="mt-3 text-xs text-white/60">
            Green pays 35:1 when 00 hits. Red/Black pay 1:1.
          </p>
        </div>
      </div>
    </section>
  );
}
