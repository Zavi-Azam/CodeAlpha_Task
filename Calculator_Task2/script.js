"use strict";

/* ===========================
   CONFIGURATION
=========================== */

Big.DP = 15;          // Decimal precision
Big.RM = Big.roundHalfUp;

const MAX_DISPLAY_CHARS = 14;

/* ===========================
   DOM REFERENCES
=========================== */

const display = document.getElementById("display");
const keys = document.querySelector(".keys");

/* ===========================
   STATE
=========================== */

let tokens = [];
let current = "";

/* ===========================
   INPUT HANDLING
=========================== */

keys.addEventListener("click", handleInput);
document.addEventListener("keydown", handleKeyboard);

function handleInput(event) {
  const btn = event.target;
  if (!btn.matches("button")) return;

  if (btn.dataset.num) addNumber(btn.dataset.num);
  if (btn.dataset.op) addOperator(btn.dataset.op);
  if (btn.dataset.action === "clear") reset();
  if (btn.dataset.action === "delete") backspace();
  if (btn.dataset.action === "equals") evaluate();
}

function handleKeyboard(event) {
  if (/\d|\./.test(event.key)) addNumber(event.key);
  if (/[+\-*/]/.test(event.key)) addOperator(event.key);
  if (event.key === "Enter") evaluate();
  if (event.key === "Backspace") backspace();
  if (event.key === "Escape") reset();
}

/* ===========================
   STATE MANAGEMENT
=========================== */

function addNumber(value) {
  if (value === "." && current.includes(".")) return;
  current += value;
  render();
}

function addOperator(op) {
  if (!current && tokens.length === 0) return;
  if (!current && isOperator(tokens.at(-1))) return;

  if (current) {
    tokens.push(current);
    current = "";
  }
  tokens.push(op);
  render();
}

function backspace() {
  if (current) {
    current = current.slice(0, -1);
  } else {
    tokens.pop();
  }
  render();
}

function reset() {
  tokens = [];
  current = "";
  render();
}

/* ===========================
   DISPLAY FORMATTING
=========================== */

function formatForDisplay(value) {
  const str = value.toString();

  // Fits screen → show full number
  if (str.length <= MAX_DISPLAY_CHARS) {
    return str;
  }

  // Too large → scientific notation with 8 significant digits
  const big = new Big(value);
  return big.toExponential(8);
}

/* ===========================
   RENDER
=========================== */

function render() {
  const raw = [...tokens, current].join("");
  display.textContent = raw ? formatForDisplay(raw) : "0";
}

/* ===========================
   EVALUATION PIPELINE
=========================== */

function evaluate() {
  if (current) tokens.push(current);
  if (tokens.length < 3) return;

  try {
    const rpn = toRPN(tokens);
    const result = computeRPN(rpn);
    tokens = [result];
    current = "";
    render();
  } catch {
    display.textContent = "Error";
    tokens = [];
    current = "";
  }
}

/* ===========================
   PURE MATH ENGINE
=========================== */

function isOperator(token) {
  return ["+", "-", "*", "/"].includes(token);
}

function precedence(op) {
  return op === "+" || op === "-" ? 1 : 2;
}

/* --- Shunting Yard Algorithm --- */
function toRPN(input) {
  const output = [];
  const ops = [];

  for (const token of input) {
    if (!isOperator(token)) {
      output.push(token);
    } else {
      while (
        ops.length &&
        precedence(ops.at(-1)) >= precedence(token)
      ) {
        output.push(ops.pop());
      }
      ops.push(token);
    }
  }

  return output.concat(ops.reverse());
}

/* --- Stack-based Big Decimal Evaluation --- */
function computeRPN(rpn) {
  const stack = [];

  for (const token of rpn) {
    if (!isOperator(token)) {
      stack.push(new Big(token));
    } else {
      const b = stack.pop();
      const a = stack.pop();

      if (!a || !b) throw new Error("Invalid Expression");

      switch (token) {
        case "+": stack.push(a.plus(b)); break;
        case "-": stack.push(a.minus(b)); break;
        case "*": stack.push(a.times(b)); break;
        case "/":
          if (b.eq(0)) throw new Error("Divide by zero");
          stack.push(a.div(b));
          break;
      }
    }
  }

  return stack[0].toString();
}
