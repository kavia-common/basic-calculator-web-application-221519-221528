import { useEffect, useMemo, useRef, useState } from "react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Calculator • Ocean Professional" },
    {
      name: "description",
      content:
        "A modern calculator supporting +, -, ×, ÷ with keyboard input. Ocean Professional theme.",
    },
  ];
};

type Operation = "+" | "-" | "×" | "÷" | null;

function formatNumber(value: string): string {
  // Avoid formatting partial/invalid states like ".", "-", or "-."
  if (value === "" || value === "." || value === "-" || value === "-.") return value;
  const num = Number(value);
  if (!isFinite(num)) return value;
  const [integer, decimal] = value.split(".");
  const formattedInt = Number(integer).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
  return decimal !== undefined ? `${formattedInt}.${decimal}` : formattedInt;
}

export default function Index() {
  const [current, setCurrent] = useState<string>("0");
  const [previous, setPrevious] = useState<string>("");
  const [op, setOp] = useState<Operation>(null);
  const [error, setError] = useState<string>("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  const canAppendDecimal = useMemo(() => !current.includes("."), [current]);

  function resetAll() {
    setCurrent("0");
    setPrevious("");
    setOp(null);
    setError("");
  }

  function del() {
    if (error) {
      resetAll();
      return;
    }
    setCurrent((c) => {
      if (c.length <= 1) return "0";
      const next = c.slice(0, -1);
      return next === "-" || next === "-0" ? "0" : next;
    });
  }

  function appendDigit(d: string) {
    if (error) setError("");
    setCurrent((c) => {
      if (c === "0" && d !== ".") return d;
      if (c === "-0" && d !== ".") return "-" + d;
      if (d === ".") {
        if (!canAppendDecimal) return c;
        return c + ".";
      }
      return c + d;
    });
  }

  function chooseOperation(nextOp: Operation) {
    if (error) setError("");
    if (nextOp === null) return;
    // Prevent starting with operation unless it's "-" to create negative number
    if (previous === "" && (current === "0" || current === "")) {
      if (nextOp === "-") {
        // toggle negative initial entry
        setCurrent((c) => (c.startsWith("-") ? c.slice(1) : c === "0" ? "-0" : "-" + c));
      }
      return;
    }
    if (op && previous !== "" && current !== "" && current !== "-") {
      // chain calculation
      const result = compute(previous, current, op);
      if (result.err) {
        setError(result.err);
        setCurrent("0");
        setPrevious("");
        setOp(null);
        return;
      }
      setPrevious(result.value);
      setCurrent("");
      setOp(nextOp);
      return;
    }
    // move current to previous and set op
    setPrevious(current);
    setCurrent("");
    setOp(nextOp);
  }

  function equals() {
    if (!op || previous === "" || current === "" || current === "-") return;
    const result = compute(previous, current, op);
    if (result.err) {
      setError(result.err);
      setCurrent("0");
      setPrevious("");
      setOp(null);
      return;
    }
    setCurrent(result.value);
    setPrevious("");
    setOp(null);
  }

  function compute(aStr: string, bStr: string, operation: Operation): { value: string; err?: string } {
    const a = Number(aStr);
    const b = Number(bStr);
    if (!isFinite(a) || !isFinite(b)) return { value: "0" };
    switch (operation) {
      case "+":
        return { value: String(a + b) };
      case "-":
        return { value: String(a - b) };
      case "×":
        return { value: String(a * b) };
      case "÷":
        if (b === 0) return { value: "0", err: "Cannot divide by zero" };
        return { value: String(a / b) };
      default:
        return { value: bStr };
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key;
      if ((key >= "0" && key <= "9") || key === ".") {
        if (key === ".") {
          if (!canAppendDecimal) {
            e.preventDefault();
            return;
          }
        }
        appendDigit(key);
        return;
      }
      if (key === "+" || key === "-" || key === "*" || key === "/") {
        e.preventDefault();
        chooseOperation(keyMapToOp(key));
        return;
      }
      if (key === "Enter" || key === "=") {
        e.preventDefault();
        equals();
        return;
      }
      if (key === "Backspace") {
        e.preventDefault();
        del();
        return;
      }
      if (key === "Escape") {
        e.preventDefault();
        resetAll();
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canAppendDecimal, op, previous, current]);

  function keyMapToOp(k: string): Operation {
    switch (k) {
      case "+": return "+";
      case "-": return "-";
      case "*": return "×";
      case "/": return "÷";
      default: return null;
    }
  }

  const showPrev = previous !== "" && op;
  const theme = {
    primary: "#2563EB",
    accent: "#F59E0B",
    error: "#EF4444",
    bg: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
  };

  return (
    <div
      ref={containerRef}
      className="min-h-dvh w-full flex items-center justify-center"
      style={{ background: theme.bg }}
    >
      <div className="w-full max-w-md px-4">
        <div
          className="rounded-3xl shadow-xl border border-gray-200"
          style={{
            background: `linear-gradient(180deg, rgba(59,130,246,0.08) 0%, ${theme.surface} 60%)`,
          }}
        >
          <div className="p-5 sm:p-6 border-b border-gray-200 rounded-t-3xl bg-white/60 backdrop-blur">
            <div className="flex flex-col items-end gap-1">
              <div
                className="text-sm text-gray-500 h-5"
                aria-live="polite"
                aria-atomic="true"
              >
                {showPrev ? (
                  <span>
                    {formatNumber(previous)} {op}
                  </span>
                ) : (
                  <span>&nbsp;</span>
                )}
              </div>
              <div className="w-full min-h-[2.75rem] sm:min-h-[3.25rem] text-right font-semibold text-gray-900 tracking-tight">
                <span className="block text-3xl sm:text-4xl tabular-nums">
                  {error ? (
                    <span className="text-red-600">{error}</span>
                  ) : (
                    formatNumber(current)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-4 gap-3">
              <CalcButton
                label="AC"
                onClick={resetAll}
                variant="secondary"
                ariaLabel="All Clear"
              />
              <CalcButton
                label="DEL"
                onClick={del}
                variant="secondary"
                ariaLabel="Delete"
              />
              <CalcButton
                label="÷"
                onClick={() => chooseOperation("÷")}
                variant="primary"
                ariaLabel="Divide"
                isActive={op === "÷"}
              />
              <CalcButton
                label="×"
                onClick={() => chooseOperation("×")}
                variant="primary"
                ariaLabel="Multiply"
                isActive={op === "×"}
              />

              {["7", "8", "9"].map((d) => (
                <CalcButton key={d} label={d} onClick={() => appendDigit(d)} />
              ))}
              <CalcButton
                label="-"
                onClick={() => chooseOperation("-")}
                variant="primary"
                ariaLabel="Subtract"
                isActive={op === "-"}
              />

              {["4", "5", "6"].map((d) => (
                <CalcButton key={d} label={d} onClick={() => appendDigit(d)} />
              ))}
              <CalcButton
                label="+"
                onClick={() => chooseOperation("+")}
                variant="primary"
                ariaLabel="Add"
                isActive={op === "+"}
              />

              {["1", "2", "3"].map((d) => (
                <CalcButton key={d} label={d} onClick={() => appendDigit(d)} />
              ))}
              <CalcButton
                label="="
                onClick={equals}
                variant="accent"
                ariaLabel="Equals"
                className="row-span-2"
              />

              <CalcButton
                label="0"
                onClick={() => appendDigit("0")}
                className="col-span-2"
              />
              <CalcButton
                label="."
                onClick={() => appendDigit(".")}
                disabled={!canAppendDecimal}
              />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          Keyboard: 0-9, . , + - * / , Enter = , Backspace , Escape
        </p>
      </div>
    </div>
  );
}

type ButtonVariant = "default" | "primary" | "secondary" | "accent";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function CalcButton(props: {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  isActive?: boolean;
}) {
  const {
    label,
    onClick,
    variant = "default",
    className,
    ariaLabel,
    disabled,
    isActive,
  } = props;

  const base =
    "select-none rounded-xl py-3 sm:py-4 text-lg font-medium shadow-sm transition transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const palettes: Record<ButtonVariant, string> = {
    default:
      "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 focus-visible:ring-blue-500",
    secondary:
      "bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 focus-visible:ring-amber-500",
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    accent:
      "bg-amber-500 text-gray-900 hover:bg-amber-600 focus-visible:ring-amber-500",
  };

  const active =
    isActive && (variant === "primary" || variant === "accent")
      ? "outline outline-2 outline-offset-2 outline-blue-200"
      : "";

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      className={classNames(base, palettes[variant], active, className)}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
