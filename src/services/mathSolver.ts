/**
 * Instant Math & Logic Evaluator for Brain Brick Robotics.
 * Parses natural language arithmetic (Russian & English, digits & words)
 * and returns calculated solution without needing cloud roundtrip or motor movement.
 */

export interface MathSolution {
  solved: boolean;
  expression: string;
  result: number | string;
  spoken: string;
}

export function trySolveMath(text: string): MathSolution | null {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase().trim();

  // Normalize Russian word numbers to digits
  const wordMap: Record<string, number | string> = {
    "ноль": 0, "нуль": 0,
    "один": 1, "одна": 1, "одну": 1,
    "два": 2, "две": 2, "дважды": "2 *",
    "три": 3, "трижды": "3 *",
    "четыре": 4, "четырежды": "4 *",
    "пять": 5, "пятью": 5,
    "шесть": 6, "шестью": 6,
    "семь": 7, "семью": 7,
    "восемь": 8, "восемью": 8,
    "девять": 9, "девятью": 9,
    "десять": 10,
    "одиннадцать": 11, "двенадцать": 12, "тринадцать": 13, "четырнадцать": 14, "пятнадцать": 15,
    "шестнадцать": 16, "семнадцать": 17, "восемнадцать": 18, "девятнадцать": 19,
    "двадцать": 20, "тридцать": 30, "сорок": 40, "пятьдесят": 50, "шестьдесят": 60, "семьдесят": 70, "восемьдесят": 80, "девяносто": 90, "сто": 100
  };

  const opMap: Record<string, string> = {
    "плюс": "+", "прибавить": "+", "добавить": "+", "сложи": "+", "сложить": "+",
    "минус": "-", "отнять": "-", "вычесть": "-",
    "умножить на": "*", "умножить": "*", "помножить на": "*",
    "разделить на": "/", "поделить на": "/", "делить на": "/"
  };

  let cleaned = lower
    .replace(/сколько будет/g, "")
    .replace(/посчитай/g, "")
    .replace(/вычисли/g, "")
    .replace(/реши/g, "")
    .replace(/равно/g, "")
    .replace(/будет/g, "")
    .replace(/\?/g, "")
    .trim();

  // Replace operator phrases
  for (const [phrase, symbol] of Object.entries(opMap)) {
    cleaned = cleaned.replaceAll(phrase, ` ${symbol} `);
  }

  // Replace word numbers (Cyrillic-safe word boundaries)
  for (const [word, val] of Object.entries(wordMap)) {
    const regex = new RegExp(`(^|\\s)${word}($|\\s)`, "gi");
    cleaned = cleaned.replace(regex, `$1${val}$2`);
    cleaned = cleaned.replace(regex, `$1${val}$2`); // double-pass for adjacent words
  }

  // Match simple binary arithmetic: num1 op num2
  const match = cleaned.match(/(-?\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(-?\d+(?:\.\d+)?)/);
  if (match) {
    const n1 = parseFloat(match[1]);
    const op = match[2];
    const n2 = parseFloat(match[3]);
    let res: number | string = 0;
    if (op === "+") res = n1 + n2;
    else if (op === "-") res = n1 - n2;
    else if (op === "*") res = n1 * n2;
    else if (op === "/") res = n2 !== 0 ? Math.round((n1 / n2) * 100) / 100 : "бесконечность";

    const opName = op === "+" ? "плюс" : op === "-" ? "минус" : op === "*" ? "умножить на" : "разделить на";

    return {
      solved: true,
      expression: `${n1} ${op} ${n2}`,
      result: res,
      spoken: `${n1} ${opName} ${n2} будет ${res}.`
    };
  }

  return null;
}
