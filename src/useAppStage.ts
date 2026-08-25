import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ActionId } from "./actions";

// The stage the third course is taught on: the sheet of paper the first course
// wrote on, plus the things an application puts over it — a Save dialog, an
// Open dialog, a print preview — and a zoom the page actually answers to.
//
// Drawn here for the same reason the browser was. A real Save dialog belongs to
// the operating system: it would open over the window, answer the keys itself,
// and the learner would never find out which keystroke summoned it.

// What the window is showing. Anything but "step" means the learner opened or
// closed something, and the practice document follows suit.
export type Shown = "step" | "new" | "closed" | "file1" | "file2" | "file3";

export const files = ["file1", "file2", "file3"] as const;

type Dialog = "save" | "open" | "print";

type State = {
  dialog: Dialog | null;
  // Which control the Save dialog has the caret in: the name, then the tick.
  field: number;
  // The name the document was last saved under. Empty until it has one, which
  // is what makes the first Save ask and every later one silent.
  name: string;
  // Nothing reads this but the tick beside it: the checkbox exists so that
  // Space has something to switch, and switching it is the whole lesson.
  copy: boolean;
  // Which file the Open dialog is standing on.
  pick: number;
  shown: Shown;
  // Whether the document has been written since it was last touched. The dot
  // in the title bar reads off this, and it is the whole visible answer a
  // second Save can give.
  saved: boolean;
  // Steps away from full size rather than a factor: the lesson counts presses,
  // and the ends are where a real application stops zooming too.
  zoom: number;
  // Bumped whenever the caret should be sent somewhere again, so reopening a
  // dialog re-selects the name that is already in it.
  nonce: number;
};

const start: State = {
  dialog: null,
  field: 0,
  name: "",
  copy: false,
  pick: 0,
  shown: "step",
  saved: false,
  zoom: 0,
  nonce: 0,
};

// Four steps down and three up. Down is the longer road because shrinking is
// what people reach for when a page will not fit, and stopping short of the
// point where the words disappear is not a limitation worth teaching.
const zoomLevels = { min: -4, max: 3 };

const clamp = (level: number) => Math.max(zoomLevels.min, Math.min(zoomLevels.max, level));

export const zoomOf = (level: number) => 1 + level * 0.12;

type Event = { act: ActionId; typed: string } | { reset: true } | { touched: true };

const reduce = (state: State, event: Event): State => {
  if ("reset" in event) return start;
  if ("touched" in event) return state.saved ? { ...state, saved: false } : state;

  // A dialog always arrives with the caret in its first control.
  const open = (dialog: Dialog): State => ({
    ...state,
    dialog,
    field: 0,
    pick: 0,
    nonce: state.nonce + 1,
  });

  switch (event.act) {
    // A document that has never been named has to be named now; one that has a
    // name is simply written again, and the dot going out is the only answer
    // there is to give. Both are what every application does. A file opened
    // from the list counts as named, whatever the last saved document was
    // called — otherwise Save would ask for a name the file already has.
    case "save":
      return state.name || state.shown.startsWith("file")
        ? { ...state, saved: true }
        : open("save");
    case "saveAs":
      return open("save");
    case "openDoc":
      return open("open");
    case "print":
      return open("print");
    // Both of these keep the zoom and drop everything else: that setting
    // belongs to the window, not to what is in it. And a brand-new empty
    // document has nothing unsaved about it yet, so it carries no dot until
    // the first keystroke — which is exactly what the chapter says it does.
    case "newDoc":
      return { ...start, zoom: state.zoom, shown: "new", saved: true, nonce: state.nonce + 1 };
    case "closeDoc":
      return { ...start, zoom: state.zoom, shown: "closed", nonce: state.nonce + 1 };
    case "acceptDialog":
      if (state.dialog === "open") {
        return { ...state, dialog: null, shown: files[state.pick], saved: true, nonce: state.nonce + 1 };
      }
      if (state.dialog === "save") {
        // An empty field keeps whatever name the document already had, exactly
        // as a dialog that will not let you save a nameless file.
        return {
          ...state,
          dialog: null,
          name: event.typed.trim() || state.name,
          saved: Boolean(event.typed.trim() || state.name),
          nonce: state.nonce + 1,
        };
      }
      return { ...state, dialog: null, nonce: state.nonce + 1 };
    // Cancelling keeps nothing, which is the point of it.
    case "cancelDialog":
      return { ...state, dialog: null, nonce: state.nonce + 1 };
    // Only the save dialog has a second control to move to.
    case "nextField":
      return state.dialog === "save" ? { ...state, field: (state.field + 1) % 2 } : state;
    case "toggle":
      return { ...state, copy: !state.copy };
    case "moveUp":
      return { ...state, pick: Math.max(0, state.pick - 1) };
    case "moveDown":
      return { ...state, pick: Math.min(files.length - 1, state.pick + 1) };
    case "zoomIn":
      return { ...state, zoom: clamp(state.zoom + 1) };
    case "zoomOut":
      return { ...state, zoom: clamp(state.zoom - 1) };
    case "zoomReset":
      return { ...state, zoom: 0 };
    default:
      return state;
  }
};

// Everything the stage answers to by name.
export const appKeys: ActionId[] = [
  "save",
  "saveAs",
  "newDoc",
  "openDoc",
  "print",
  "closeDoc",
  "acceptDialog",
  "cancelDialog",
  "nextField",
  "toggle",
  "moveUp",
  "moveDown",
  "zoomIn",
  "zoomOut",
  "zoomReset",
];

// When a key belongs to the stage rather than to the document underneath it.
// Everything the stage declines falls through untouched: the practice document
// still has to receive its own arrows, its own Tab and its own spaces.
const consumes = (state: State, action: ActionId): boolean => {
  switch (action) {
    case "acceptDialog":
    case "cancelDialog":
      return state.dialog !== null;
    // Absorbed by any dialog, even the two with a single control: a Tab that
    // slipped past would land on a button behind the shade, which is the one
    // thing a modal dialog must never let happen.
    case "nextField":
      return state.dialog !== null;
    // Space is a space while the caret is in the name field. It only becomes a
    // tick once Tab has moved off it — which is exactly the rule the chapter
    // is teaching, so the code and the lesson say the same thing.
    case "toggle":
      return state.dialog === "save" && state.field === 1;
    case "moveUp":
    case "moveDown":
      return state.dialog === "open";
    default:
      return true;
  }
};

// The stage is restored on entering a chapter, and on coming back into the
// course after stepping out to the shelf. Both for the same reason the practice
// document is retyped: a chapter about zoom that opened with the last chapter's
// dialog still standing, or a chapter that reopened showing a file the learner
// opened twenty minutes ago, would depend on how it was left rather than on
// what it teaches.
export const useAppStage = (chapterIndex: number, away: boolean) => {
  const [state, dispatch] = useReducer(reduce, start);
  const nameRef = useRef<HTMLInputElement>(null);
  const checkRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => dispatch({ reset: true }), [chapterIndex, away]);

  // The caret goes wherever the dialog just put it. The name arrives selected
  // for the same reason the address bar does: you type over it.
  useEffect(() => {
    if (state.dialog === "save") {
      if (state.field === 0) nameRef.current?.select();
      else checkRef.current?.focus();
    } else if (state.dialog) {
      panelRef.current?.focus();
    }
  }, [state.dialog, state.field, state.nonce]);

  // Mirrored during the render so the one keyboard listener the app has can
  // stay stable: it reads this only from an event, which runs after the commit.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Answers whether the keystroke was the stage's to take, so the caller knows
  // whether to hold it back from the document underneath.
  const handle = useCallback((action: ActionId) => {
    if (!consumes(stateRef.current, action)) return false;
    dispatch({ act: action, typed: nameRef.current?.value ?? "" });
    return true;
  }, []);

  // Typing in the document undoes the last save. Nothing else in the app can
  // report this: the dot is the only thing that ever showed it.
  const touch = useCallback(() => dispatch({ touched: true }), []);

  return { state, handle, touch, nameRef, checkRef, panelRef };
};
