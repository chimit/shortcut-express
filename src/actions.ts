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
const actions = {
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
  // --- The browser ---------------------------------------------------------
  // Tabs. The three that matter, in the order a day goes: open one, close it,
  // and — the one nobody knows — bring back the one you closed by accident.
  newTab: {
    macos: { meta: true, code: "KeyT" },
    windows: { ctrl: true, code: "KeyT" },
    linux: { ctrl: true, code: "KeyT" },
  },
  closeTab: {
    macos: { meta: true, code: "KeyW" },
    windows: { ctrl: true, code: "KeyW" },
    linux: { ctrl: true, code: "KeyW" },
  },
  reopenTab: {
    macos: { meta: true, shift: true, code: "KeyT" },
    windows: { ctrl: true, shift: true, code: "KeyT" },
    linux: { ctrl: true, shift: true, code: "KeyT" },
  },
  // Control, not Command, even on a Mac: this pair is the same on every
  // browser and every system, which is rare enough to be worth teaching first.
  nextTab: {
    macos: { ctrl: true, code: "Tab" },
    windows: { ctrl: true, code: "Tab" },
    linux: { ctrl: true, code: "Tab" },
  },
  prevTab: {
    macos: { ctrl: true, shift: true, code: "Tab" },
    windows: { ctrl: true, shift: true, code: "Tab" },
    linux: { ctrl: true, shift: true, code: "Tab" },
  },
  // The digits count tabs from the left. One of them is enough to teach the
  // rule; the nine is the exception worth its own line, being always the last
  // tab however many there are.
  thirdTab: {
    macos: { meta: true, code: "Digit3" },
    windows: { ctrl: true, code: "Digit3" },
    linux: { ctrl: true, code: "Digit3" },
  },
  lastTab: {
    macos: { meta: true, code: "Digit9" },
    windows: { ctrl: true, code: "Digit9" },
    linux: { ctrl: true, code: "Digit9" },
  },
  addressBar: {
    macos: { meta: true, code: "KeyL" },
    windows: { ctrl: true, code: "KeyL" },
    linux: { ctrl: true, code: "KeyL" },
  },
  findOnPage: {
    macos: { meta: true, code: "KeyF" },
    windows: { ctrl: true, code: "KeyF" },
    linux: { ctrl: true, code: "KeyF" },
  },
  // Enter and Escape again, under the names the find bar gives them. The same
  // keys the app itself runs on, which the lesson has to borrow back for a
  // step: see how the step's own expectation outranks the navigation.
  findNext: {
    macos: { code: "Enter" },
    windows: { code: "Enter" },
    linux: { code: "Enter" },
  },
  findPrev: {
    macos: { shift: true, code: "Enter" },
    windows: { shift: true, code: "Enter" },
    linux: { shift: true, code: "Enter" },
  },
  closeFind: {
    macos: { code: "Escape" },
    windows: { code: "Escape" },
    linux: { code: "Escape" },
  },
  // A screenful at a time, the way a reader turns pages.
  pageDown: {
    macos: { code: "Space" },
    windows: { code: "Space" },
    linux: { code: "Space" },
  },
  pageUp: {
    macos: { shift: true, code: "Space" },
    windows: { shift: true, code: "Space" },
    linux: { shift: true, code: "Space" },
  },
  // History. Apple's browsers agree on the brackets; everywhere else the
  // arrows carry it, which is the same shape as the Home/End split already
  // taught for the ends of a line.
  historyBack: {
    macos: { meta: true, code: "BracketLeft" },
    windows: { alt: true, code: "ArrowLeft" },
    linux: { alt: true, code: "ArrowLeft" },
  },
  historyForward: {
    macos: { meta: true, code: "BracketRight" },
    windows: { alt: true, code: "ArrowRight" },
    linux: { alt: true, code: "ArrowRight" },
  },
  reload: {
    macos: { meta: true, code: "KeyR" },
    windows: { ctrl: true, code: "KeyR" },
    linux: { ctrl: true, code: "KeyR" },
  },

  // --- Any application ------------------------------------------------------
  // The keys that mean the same thing whatever is on the screen. Only the
  // modifier changes between platforms, which makes this the most portable
  // course in the book and the least interesting table in this file.
  save: {
    macos: { meta: true, code: "KeyS" },
    windows: { ctrl: true, code: "KeyS" },
    linux: { ctrl: true, code: "KeyS" },
  },
  saveAs: {
    macos: { meta: true, shift: true, code: "KeyS" },
    windows: { ctrl: true, shift: true, code: "KeyS" },
    linux: { ctrl: true, shift: true, code: "KeyS" },
  },
  newDoc: {
    macos: { meta: true, code: "KeyN" },
    windows: { ctrl: true, code: "KeyN" },
    linux: { ctrl: true, code: "KeyN" },
  },
  openDoc: {
    macos: { meta: true, code: "KeyO" },
    windows: { ctrl: true, code: "KeyO" },
    linux: { ctrl: true, code: "KeyO" },
  },
  print: {
    macos: { meta: true, code: "KeyP" },
    windows: { ctrl: true, code: "KeyP" },
    linux: { ctrl: true, code: "KeyP" },
  },
  // The same keystroke the browser course closed a tab with. Not a repetition:
  // one key closes whatever is open, and saying so once is the whole lesson.
  closeDoc: {
    macos: { meta: true, code: "KeyW" },
    windows: { ctrl: true, code: "KeyW" },
    linux: { ctrl: true, code: "KeyW" },
  },
  // The one shortcut the app holds back rather than lets through, and only on
  // the single step that asks for it — see the guard in App. macOS separates
  // closing a window from quitting the application and Windows does not, which
  // is why this row is the course's one genuine difference of idea.
  quit: {
    macos: { meta: true, code: "KeyQ" },
    windows: { alt: true, code: "F4" },
    linux: { alt: true, code: "F4" },
  },
  // Inside a dialog. Enter and Escape yet again, under the names a dialog
  // gives them; Tab and Space have waited until there was a dialog to use
  // them in, because outside one they type rather than navigate.
  acceptDialog: {
    macos: { code: "Enter" },
    windows: { code: "Enter" },
    linux: { code: "Enter" },
  },
  cancelDialog: {
    macos: { code: "Escape" },
    windows: { code: "Escape" },
    linux: { code: "Escape" },
  },
  nextField: {
    macos: { code: "Tab" },
    windows: { code: "Tab" },
    linux: { code: "Tab" },
  },
  toggle: {
    macos: { code: "Space" },
    windows: { code: "Space" },
    linux: { code: "Space" },
  },
  // The cap says "=" and the lesson says "plus", because that is what is
  // printed above it and what every menu calls this command.
  zoomIn: {
    macos: { meta: true, code: "Equal" },
    windows: { ctrl: true, code: "Equal" },
    linux: { ctrl: true, code: "Equal" },
  },
  zoomOut: {
    macos: { meta: true, code: "Minus" },
    windows: { ctrl: true, code: "Minus" },
    linux: { ctrl: true, code: "Minus" },
  },
  zoomReset: {
    macos: { meta: true, code: "Digit0" },
    windows: { ctrl: true, code: "Digit0" },
    linux: { ctrl: true, code: "Digit0" },
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
  Tab: "Tab",
  Space: "Space",
  BracketLeft: "[",
  BracketRight: "]",
  // Nobody calls it "Command and equals". The cap prints the plus above it.
  Equal: "+",
  Minus: "−",
  Enter: "Enter",
  Escape: "Esc",
  Backspace: "Delete",
};

// What is printed on one keycap. Codes we have no legend for are shown as
// they come: a key nobody has named is still a key.
export const keyName = (code: string): string =>
  // Every letter and digit prints itself, so only the keys whose legend is not
  // their code need naming above.
  codeNames[code] ?? code.replace(/^(Key|Digit)/, "");

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
