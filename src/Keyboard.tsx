import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { platforms, type LessonPlatform } from "./platform";
import "./Keyboard.css";

type Key = {
  id: string;
  label?: string;
  // Rendered above the label, the way a Mac keycap puts ⌘ over "command".
  symbol?: ReactNode;
  // In key units, where a letter key is 1. Every row adds up to 15, as on a
  // real board, so the columns line up and the caps stay square.
  width?: number;
  // Wide caps print their label against the outer edge of the keyboard.
  align?: "start" | "end";
  // Where the symbol sits relative to the label. Defaults to above it, which
  // is how Apple prints its modifiers and how a cap carrying two legends —
  // the tilde over the backtick — is read.
  symbolAt?: "beside" | "below";
};

const keyNames = {
  macos: { tab: "tab", capsLock: "caps lock", enter: "return", shift: "shift", backspace: "delete" },
  pc: { tab: "Tab", capsLock: "Caps Lock", enter: "Enter", shift: "Shift", backspace: "Backspace" },
};

// A Magic Keyboard row spans 14.5 units and keeps its two shifts equal; a PC
// board spans the ANSI 15 and stretches Backspace, Enter and the right Shift.
const keyWidths = {
  macos: { backspace: 1.5, tab: 1.5, backslash: 1, capsLock: 1.75, enter: 1.75, shiftLeft: 2.25, shiftRight: 2.25 },
  pc: { backspace: 2, tab: 1.5, backslash: 1.5, capsLock: 1.75, enter: 2.25, shiftLeft: 2.25, shiftRight: 2.75 },
};

// PC caps carry an icon beside the word; Apple leaves these caps text-only.
const pcSymbols = { tab: "⇥", shift: "⇧", enter: "↵", backspace: "⟵" };

const namesFor = (currentPlatform: LessonPlatform) =>
  currentPlatform === "macos" ? keyNames.macos : keyNames.pc;

const symbolsFor = (currentPlatform: LessonPlatform) =>
  currentPlatform === "macos" ? ({} as Partial<typeof pcSymbols>) : pcSymbols;

const widthsFor = (currentPlatform: LessonPlatform) =>
  currentPlatform === "macos" ? keyWidths.macos : keyWidths.pc;

// Latin, whatever language the app is set to. Every shortcut in every course
// names a Latin letter, and a board printed in Cyrillic would light the cap
// two rows away from the one the sentence just asked for. A keyboard sold in
// Russia carries both legends anyway; this draws the half the lessons use.
const letters: [string, string, string] = ["QWERTYUIOP[]", "ASDFGHJKL;'", "ZXCVBNM,./"];

const letterCodes = [
  [
    "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU",
    "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight",
  ],
  [
    "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH",
    "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote",
  ],
  [
    "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB",
    "KeyN", "KeyM", "Comma", "Period", "Slash",
  ],
] as const;

const letterRows = (currentPlatform: LessonPlatform): Key[][] => {
  const [top, home, bottom] = letters;
  const names = namesFor(currentPlatform);
  const widths = widthsFor(currentPlatform);
  const symbols = symbolsFor(currentPlatform);

  return [
    [
      { id: "Tab", label: names.tab, symbol: symbols.tab, symbolAt: "beside", width: widths.tab, align: "start" },
      ...top.split("").map((label, index) => ({ id: letterCodes[0][index], label })),
      { id: "Backslash", label: "\\", width: widths.backslash },
    ],
    [
      { id: "CapsLock", label: names.capsLock, width: widths.capsLock, align: "start" },
      ...home.split("").map((label, index) => ({ id: letterCodes[1][index], label })),
      { id: "Enter", label: names.enter, symbol: symbols.enter, symbolAt: "beside", width: widths.enter, align: "end" },
    ],
    [
      { id: "ShiftLeft", label: names.shift, symbol: symbols.shift, symbolAt: "beside", width: widths.shiftLeft, align: "start" },
      ...bottom.split("").map((label, index) => ({ id: letterCodes[2][index], label })),
      { id: "ShiftRight", label: names.shift, symbol: symbols.shift, symbolAt: "beside", width: widths.shiftRight, align: "end" },
    ],
  ];
};

// Only the letter caps change with the language; the symbol row reads the same
// on every board, this key included.
const topRow = (currentPlatform: LessonPlatform): Key[] => [
  { id: "Backquote", symbol: "~", label: "`" },
  ..."1234567890".split("").map((label) => ({ id: `Digit${label}`, label })),
  // Both legends, as they are printed: the lesson calls this key "plus" because
  // every menu does, and the cap has to agree with the sentence.
  { id: "Minus", symbol: "_", label: "−" },
  { id: "Equal", symbol: "+", label: "=" },
  {
    id: "Backspace",
    label: namesFor(currentPlatform).backspace,
    symbol: symbolsFor(currentPlatform).backspace,
    // "Backspace" already fills the cap, so its arrow goes underneath.
    symbolAt: "below",
    width: widthsFor(currentPlatform).backspace,
    align: "end",
  },
];

// The Magic Keyboard prints a thin globe outline here, not the word "fn".
// Drawn rather than taken from the emoji font so it stays monochrome and
// follows the keycap colour when the key lights up.
const globe = (
  <svg aria-hidden="true" fill="none" height="12" stroke="currentColor" strokeWidth="1.1" viewBox="0 0 16 16" width="12">
    <circle cx="8" cy="8" r="6.4" />
    <ellipse cx="8" cy="8" rx="2.8" ry="6.4" />
    <path d="M2.1 5.7h11.8M2.1 10.3h11.8" />
  </svg>
);

const bottomRow = (currentPlatform: LessonPlatform): Key[] => {
  if (currentPlatform === "macos") {
    return [
      { id: "Fn", symbol: globe, align: "start" },
      // Widths follow the words: each is just wide enough to carry its legend.
      { id: "ControlLeft", symbol: "⌃", label: "control", width: 1.2, align: "start" },
      { id: "AltLeft", symbol: "⌥", label: "option", width: 1.15, align: "start" },
      { id: "MetaLeft", symbol: "⌘", label: "command", width: 1.5, align: "start" },
      { id: "Space", width: 4 },
      // The right-hand pair prints against the outer edge of the board.
      { id: "MetaRight", symbol: "⌘", label: "command", width: 1.5, align: "end" },
      { id: "AltRight", symbol: "⌥", label: "option", width: 1.15, align: "end" },
    ];
  }

  // The system and menu caps carry an icon and no word at all. Linux has no
  // symbol of its own on hardware, so we use the ❖ that Super is written with
  // in documentation.
  const meta = currentPlatform === "windows" ? "⊞" : "❖";

  return [
    { id: "ControlLeft", label: "Ctrl", width: 1.25 },
    { id: "MetaLeft", symbol: meta, width: 1.25 },
    { id: "AltLeft", label: "Alt", width: 1.25 },
    { id: "Space", width: 6.25 },
    { id: "AltRight", label: "Alt", width: 1.25 },
    { id: "MetaRight", symbol: meta, width: 1.25 },
    { id: "ContextMenu", symbol: "▤", width: 1.25 },
    { id: "ControlRight", label: "Ctrl", width: 1.25 },
  ];
};

// A MacBook has none of these: there the same lessons are taught with
// Fn+Delete and Cmd+arrows, so the cluster is drawn only where the learner
// actually has it. Insert, PgUp and PgDn carry no lesson — they are here so
// the block keeps the shape a Windows user recognises.
const navKeys: Key[] = [
  { id: "Insert", label: "Insert" },
  { id: "Home", label: "Home" },
  { id: "PageUp", label: "Page Up" },
  { id: "Delete", label: "Delete" },
  { id: "End", label: "End" },
  { id: "PageDown", label: "Page Down" },
];

// Apple prints solid triangles on its arrow keys; PC boards print line arrows.
const arrowsFor = (currentPlatform: LessonPlatform): Key[] => {
  const [up, left, down, right] =
    currentPlatform === "macos" ? ["▲", "◀", "▼", "▶"] : ["↑", "←", "↓", "→"];

  return [
    { id: "ArrowUp", label: up },
    { id: "ArrowLeft", label: left },
    { id: "ArrowDown", label: down },
    { id: "ArrowRight", label: right },
  ];
};


function KeyCap({
  keyDef,
  pressed,
  hinted = false,
  extraClass = "",
}: {
  keyDef: Key;
  pressed: boolean;
  hinted?: boolean;
  extraClass?: string;
}) {
  const stacked = keyDef.symbol && keyDef.label;

  return (
    <kbd
      className={[
        "keyboard__key",
        stacked ? "keyboard__key--stacked" : "",
        stacked && keyDef.symbolAt ? `keyboard__key--symbol-${keyDef.symbolAt}` : "",
        keyDef.symbol && !keyDef.label ? "keyboard__key--icon-only" : "",
        keyDef.align ? `keyboard__key--${keyDef.align}` : "",
        hinted ? "keyboard__key--hinted" : "",
        pressed ? "keyboard__key--pressed" : "",
        extraClass,
      ].join(" ")}
      style={{ "--key-width": keyDef.width ?? 1 } as React.CSSProperties}
    >
      {keyDef.symbol && <span className="keyboard__key-symbol">{keyDef.symbol}</span>}
      {keyDef.label && <span className="keyboard__key-label">{keyDef.label}</span>}
    </kbd>
  );
}

function ArrowKeys({
  currentPlatform,
  hintedKeys,
  pressedKeys,
}: {
  currentPlatform: LessonPlatform;
  hintedKeys?: Set<string>;
  pressedKeys: Set<string>;
}) {
  return (
    <div className="arrow-keys">
      {arrowsFor(currentPlatform).map((key) => (
        <KeyCap
          extraClass={`arrow-keys__${key.id.replace("Arrow", "").toLowerCase()}`}
          key={key.id}
          hinted={hintedKeys?.has(key.id)}
          keyDef={key}
          pressed={pressedKeys.has(key.id)}
        />
      ))}
    </div>
  );
}

function Keyboard({
  currentPlatform,
  hintedKeys,
  pressedKeys,
}: {
  currentPlatform: LessonPlatform;
  // Keys the current lesson step suggests. The lesson owns the pacing; the
  // keyboard only shows what it is told to show.
  hintedKeys?: Set<string>;
  pressedKeys: Set<string>;
}) {
  const { t } = useTranslation();
  const isMac = currentPlatform === "macos";
  // Apple prints its legends against the outer edge of the board; PC boards
  // centre theirs.
  const centreLegends = (row: Key[]): Key[] => row.map((key) => ({ ...key, align: undefined }));
  const rows = [
    topRow(currentPlatform),
    ...letterRows(currentPlatform),
    bottomRow(currentPlatform),
  ].map((row) => (isMac ? row : centreLegends(row)));
  const platformLabel = platforms.find(({ id }) => id === currentPlatform)?.label;

  return (
    <div
      className={`keyboard keyboard--${currentPlatform}`}
      role="img"
      aria-label={t("keyboard.ariaLabel", { platform: platformLabel })}
    >
      <div className="keyboard__main">
        {rows.map((row, rowIndex) => (
          <div className="keyboard__row" key={rowIndex}>
            {row.map((key) => (
              <KeyCap
                hinted={hintedKeys?.has(key.id)}
                key={key.id}
                keyDef={key}
                pressed={pressedKeys.has(key.id)}
              />
            ))}
            {isMac && rowIndex === rows.length - 1 && (
              <ArrowKeys
            currentPlatform={currentPlatform}
            hintedKeys={hintedKeys}
            pressedKeys={pressedKeys}
          />
            )}
          </div>
        ))}
      </div>

      {!isMac && (
        <div className="keyboard__side">
          <div className="nav-keys">
            {navKeys.map((key) => (
              <KeyCap
                hinted={hintedKeys?.has(key.id)}
                key={key.id}
                keyDef={key}
                pressed={pressedKeys.has(key.id)}
              />
            ))}
          </div>
          <ArrowKeys
            currentPlatform={currentPlatform}
            hintedKeys={hintedKeys}
            pressedKeys={pressedKeys}
          />
        </div>
      )}
    </div>
  );
}

export default Keyboard;
