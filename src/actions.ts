import type { LessonPlatform } from "./platform";

export type Combo = {
  code: string;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
};

// Lessons name an intention, never a key. What that intention costs in keys is
// stated once, here, per platform — so a lesson is written once and reads
// natively everywhere. Note that lineStart is a combination on macOS and a
// dedicated key on Windows: the same objective, genuinely different technique.
export const actions = {
  moveLeft: {
    macos: { code: "ArrowLeft" },
    windows: { code: "ArrowLeft" },
    linux: { code: "ArrowLeft" },
  },
  moveWordLeft: {
    macos: { alt: true, code: "ArrowLeft" },
    windows: { ctrl: true, code: "ArrowLeft" },
    linux: { ctrl: true, code: "ArrowLeft" },
  },
  moveWordRight: {
    macos: { alt: true, code: "ArrowRight" },
    windows: { ctrl: true, code: "ArrowRight" },
    linux: { ctrl: true, code: "ArrowRight" },
  },
  moveUp: {
    macos: { code: "ArrowUp" },
    windows: { code: "ArrowUp" },
    linux: { code: "ArrowUp" },
  },
  moveDown: {
    macos: { code: "ArrowDown" },
    windows: { code: "ArrowDown" },
    linux: { code: "ArrowDown" },
  },
  // The clearest case for naming intentions rather than keys: on macOS these
  // are combinations, on a PC they are dedicated keys.
  lineStart: {
    macos: { meta: true, code: "ArrowLeft" },
    windows: { code: "Home" },
    linux: { code: "Home" },
  },
  lineEnd: {
    macos: { meta: true, code: "ArrowRight" },
    windows: { code: "End" },
    linux: { code: "End" },
  },
  documentStart: {
    macos: { meta: true, code: "ArrowUp" },
    windows: { ctrl: true, code: "Home" },
    linux: { ctrl: true, code: "Home" },
  },
  documentEnd: {
    macos: { meta: true, code: "ArrowDown" },
    windows: { ctrl: true, code: "End" },
    linux: { ctrl: true, code: "End" },
  },
  // The cap says "delete" on a Mac and "Backspace" on a PC, but it is the
  // same physical key and the same habit.
  deleteBack: {
    macos: { code: "Backspace" },
    windows: { code: "Backspace" },
    linux: { code: "Backspace" },
  },
  // Erasing without selecting first: a whole word at a time.
  deleteWordLeft: {
    macos: { alt: true, code: "Backspace" },
    windows: { ctrl: true, code: "Backspace" },
    linux: { ctrl: true, code: "Backspace" },
  },
  selectAll: {
    macos: { meta: true, code: "KeyA" },
    windows: { ctrl: true, code: "KeyA" },
    linux: { ctrl: true, code: "KeyA" },
  },
  cut: {
    macos: { meta: true, code: "KeyX" },
    windows: { ctrl: true, code: "KeyX" },
    linux: { ctrl: true, code: "KeyX" },
  },
  copy: {
    macos: { meta: true, code: "KeyC" },
    windows: { ctrl: true, code: "KeyC" },
    linux: { ctrl: true, code: "KeyC" },
  },
  paste: {
    macos: { meta: true, code: "KeyV" },
    windows: { ctrl: true, code: "KeyV" },
    linux: { ctrl: true, code: "KeyV" },
  },
  undo: {
    macos: { meta: true, code: "KeyZ" },
    windows: { ctrl: true, code: "KeyZ" },
    linux: { ctrl: true, code: "KeyZ" },
  },
  // Redo is the one place the two worlds genuinely disagree: Apple shifts the
  // undo key, Windows has its own.
  redo: {
    macos: { meta: true, shift: true, code: "KeyZ" },
    windows: { ctrl: true, code: "KeyY" },
    linux: { ctrl: true, code: "KeyY" },
  },
  // Plain Enter continues, the way a chat window sends. A newline in the
  // practice document is Shift+Enter, which no lesson claims.
  nextStep: {
    macos: { code: "Enter" },
    windows: { code: "Enter" },
    linux: { code: "Enter" },
  },
  prevStep: {
    macos: { code: "Escape" },
    windows: { code: "Escape" },
    linux: { code: "Escape" },
  },
} satisfies Record<string, Record<LessonPlatform, Combo>>;

export type ActionId = keyof typeof actions;

export const comboFor = (action: ActionId, currentPlatform: LessonPlatform): Combo =>
  actions[action][currentPlatform];

export const matches = (event: KeyboardEvent, combo: Combo): boolean =>
  event.code === combo.code &&
  event.altKey === Boolean(combo.alt) &&
  event.ctrlKey === Boolean(combo.ctrl) &&
  event.metaKey === Boolean(combo.meta) &&
  event.shiftKey === Boolean(combo.shift);

// Codes the keyboard should light up. Modifiers resolve to the left-hand cap,
// the one a learner reaches for.
export const keysOf = (combo: Combo): string[] => [
  ...(combo.ctrl ? ["ControlLeft"] : []),
  ...(combo.alt ? ["AltLeft"] : []),
  ...(combo.shift ? ["ShiftLeft"] : []),
  ...(combo.meta ? ["MetaLeft"] : []),
  combo.code,
];

type Modifier = "ctrl" | "alt" | "shift" | "meta";

const modifierNames: Record<LessonPlatform, Record<Modifier, string>> = {
  macos: { ctrl: "Control", alt: "Option", shift: "Shift", meta: "Command" },
  windows: { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win" },
  linux: { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Super" },
};

const codeNames: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Home: "Home",
  Enter: "Enter",
  Escape: "Esc",
  Backspace: "Delete",
  KeyA: "A",
  KeyC: "C",
  KeyV: "V",
  KeyX: "X",
  KeyY: "Y",
  KeyZ: "Z",
};

// What is printed on one keycap. Codes we have no legend for are shown as
// they come: a key nobody has named is still a key.
export const keyName = (code: string): string => codeNames[code] ?? code;

// One entry per physical key, so a sentence can draw each of them as its own
// cap. Spelled out, because a beginner reads "Option", not "⌥".
export const comboParts = (combo: Combo, currentPlatform: LessonPlatform): string[] => {
  const names = modifierNames[currentPlatform];
  return [
    ...(combo.ctrl ? [names.ctrl] : []),
    ...(combo.alt ? [names.alt] : []),
    ...(combo.shift ? [names.shift] : []),
    ...(combo.meta ? [names.meta] : []),
    keyName(combo.code),
  ];
};

const shortModifiers: Record<LessonPlatform, Record<Modifier, string>> = {
  macos: { ctrl: "⌃", alt: "⌥", shift: "⇧", meta: "⌘" },
  windows: { ctrl: "Ctrl", alt: "Alt", shift: "⇧", meta: "⊞" },
  linux: { ctrl: "Ctrl", alt: "Alt", shift: "⇧", meta: "❖" },
};

// The compact form that fits on a button.
export const comboShort = (combo: Combo, currentPlatform: LessonPlatform): string => {
  const names = shortModifiers[currentPlatform];
  const code = combo.code === "Enter" ? "⏎" : keyName(combo.code);
  const parts = [
    ...(combo.ctrl ? [names.ctrl] : []),
    ...(combo.alt ? [names.alt] : []),
    ...(combo.shift ? [names.shift] : []),
    ...(combo.meta ? [names.meta] : []),
    code,
  ];
  return currentPlatform === "macos" ? parts.join("") : parts.join("+");
};
