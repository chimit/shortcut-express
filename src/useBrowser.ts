import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ActionId } from "./actions";

// The browser the second course is taught in. It is drawn, not embedded: a real
// browser inside the window would answer the shortcuts itself and the learner
// would never find out which key did it. Here every tab that opens, every jump
// the find bar makes, happens because the lesson recognised the keystroke.

// Where a chapter starts. The text course reloads its practice document between
// chapters; this is the same idea for a browser — a chapter that teaches the
// digits needs tabs to count, and one that teaches Back needs somewhere to go
// back to.
export type Scene = "start" | "many" | "visited";

// Which page each tab is showing. The titles and the prose behind them come
// from the locale, so both languages read like a real page and not a caption.
const scenes: Record<Scene, { tabs: number[]; active: number; history: number[] }> = {
  start: { tabs: [0], active: 0, history: [0] },
  many: { tabs: [0, 1, 2, 3, 4], active: 0, history: [2, 0] },
  visited: { tabs: [0], active: 0, history: [2, 0] },
};

type BrowserState = {
  // A tab holds a page number; the page's title and text live in the locale.
  tabs: number[];
  active: number;
  // What closing puts away and reopening takes back out, newest first — a
  // stack, because that is what the shortcut restores.
  closed: { page: number; at: number }[];
  history: number[];
  at: number;
  findOpen: boolean;
  // Which match of the find bar is the current one. −1 while nothing is typed.
  hit: number;
  // Where the caret should be. The nonce makes a second press of the same
  // shortcut re-select the address, the way a real browser does.
  focus: "page" | "address" | "find";
  nonce: number;
  reloading: boolean;
};

const load = (scene: Scene): BrowserState => ({
  ...scenes[scene],
  closed: [],
  at: scenes[scene].history.length - 1,
  findOpen: false,
  hit: -1,
  focus: "page",
  nonce: 0,
  reloading: false,
});

type Event =
  | { act: ActionId; matches: number }
  | { scene: Scene }
  | { go: number }
  | { hits: number }
  | { tab: number }
  | { settled: true };

const reduce = (state: BrowserState, event: Event): BrowserState => {
  if ("scene" in event) return load(event.scene);
  if ("settled" in event) return { ...state, reloading: false };
  // Navigating from the address bar: the page joins the history, and anything
  // forward of here is dropped, exactly as a browser forgets a branch you left.
  if ("go" in event) {
    const history = [...state.history.slice(0, state.at + 1), event.go];
    const tabs = [...state.tabs];
    tabs[state.active] = event.go;
    return { ...state, tabs, history, at: history.length - 1, focus: "page", nonce: state.nonce + 1 };
  }
  if ("hits" in event) {
    return { ...state, hit: event.hits > 0 ? 0 : -1 };
  }
  // A digit jumps to that tab, counting from the left — except nine, which is
  // whichever tab is last. A number with no tab under it does nothing, exactly
  // as in a real browser.
  if ("tab" in event) {
    const to = event.tab === 9 ? state.tabs.length - 1 : event.tab - 1;
    return to <= state.tabs.length - 1 ? { ...state, active: to, focus: "page" } : state;
  }

  const { act: action, matches } = event;
  const last = state.tabs.length - 1;

  switch (action) {
    case "newTab":
      // A new tab is empty and lands after the one you were on, which is where
      // every browser puts it and where the eye expects to find it.
      return {
        ...state,
        tabs: [...state.tabs.slice(0, state.active + 1), -1, ...state.tabs.slice(state.active + 1)],
        active: state.active + 1,
        focus: "address",
        nonce: state.nonce + 1,
      };
    case "closeTab": {
      // The last tab does not close: a browser with no tabs is a browser that
      // has quit, and this course is not about quitting.
      if (state.tabs.length === 1) return state;
      const tabs = state.tabs.filter((_, index) => index !== state.active);
      return {
        ...state,
        tabs,
        active: Math.min(state.active, tabs.length - 1),
        closed: [{ page: state.tabs[state.active], at: state.active }, ...state.closed],
      };
    }
    case "reopenTab": {
      const [back, ...rest] = state.closed;
      if (!back) return state;
      const tabs = [...state.tabs];
      tabs.splice(back.at, 0, back.page);
      return { ...state, tabs, active: back.at, closed: rest };
    }
    // The ends wrap: a browser cycles round rather than stopping, and a learner
    // who holds the keys down should see it come back to where it started.
    case "nextTab":
      return { ...state, active: state.active === last ? 0 : state.active + 1, focus: "page" };
    case "prevTab":
      return { ...state, active: state.active === 0 ? last : state.active - 1, focus: "page" };
    case "addressBar":
      return { ...state, focus: "address", nonce: state.nonce + 1 };
    case "findOnPage":
      return { ...state, findOpen: true, focus: "find", nonce: state.nonce + 1 };
    case "closeFind":
      // Nothing to close is nothing to do: Escape then belongs entirely to the
      // lesson, and must not quietly move the caret about.
      return state.findOpen
        ? { ...state, findOpen: false, hit: -1, focus: "page", nonce: state.nonce + 1 }
        : state;
    case "findNext":
      return matches ? { ...state, hit: (state.hit + 1) % matches } : state;
    case "findPrev":
      return matches ? { ...state, hit: (state.hit - 1 + matches) % matches } : state;
    case "historyBack":
      return state.at === 0 ? state : { ...state, at: state.at - 1, ...onPage(state, state.at - 1) };
    case "historyForward":
      return state.at === state.history.length - 1
        ? state
        : { ...state, at: state.at + 1, ...onPage(state, state.at + 1) };
    case "reload":
      return { ...state, reloading: true };
    default:
      return state;
  }
};

// Moving through the history shows that page in the tab you are on.
const onPage = (state: BrowserState, at: number) => {
  const tabs = [...state.tabs];
  tabs[state.active] = state.history[at];
  return { tabs };
};

// Everything the browser stage answers to by name. The digits are not here:
// they are recognised by shape, so that all nine work and not only the two a
// chapter stops to teach. A key in neither place is left alone — most of all
// Command+Q, which must go on quitting the app.
export const browserKeys: ActionId[] = [
  "newTab",
  "closeTab",
  "reopenTab",
  "nextTab",
  "prevTab",
  "addressBar",
  "findOnPage",
  "findNext",
  "findPrev",
  "closeFind",
  "pageDown",
  "pageUp",
  "documentStart",
  "documentEnd",
  "historyBack",
  "historyForward",
  "reload",
];

const scrolls: ActionId[] = ["pageDown", "pageUp", "documentStart", "documentEnd"];

// Scrolling is done here rather than left to the browser we are running inside:
// a real page only scrolls when it happens to hold the focus, and the whole
// point is that the keystroke works because the lesson saw it.
//
// The destination is asked for twice. The keystroke that scrolls is often the
// one that also finishes a step, and the reply below is shorter once answered —
// which grows the page by the difference and cancels a smooth scroll already in
// flight, stranding it half way down. The second request, a frame later, aims
// at the same place against the settled layout and simply finishes the journey.
const scrollBy = (page: HTMLElement | null, action: ActionId) => {
  if (!page || !scrolls.includes(action)) return false;
  const screen = page.clientHeight * 0.9;
  const to =
    action === "pageDown"
      ? page.scrollTop + screen
      : action === "pageUp"
        ? page.scrollTop - screen
        : action === "documentStart"
          ? 0
          : page.scrollHeight;
  page.scrollTo({ top: to, behavior: "smooth" });
  requestAnimationFrame(() => page.scrollTo({ top: to, behavior: "smooth" }));
  return true;
};

// The chapter index is passed alongside the scene because two chapters can call
// for the same one: leaving a chapter with four tabs open and arriving at the
// next one to find them still there would make the lesson depend on what the
// last one happened to end with.
export const useBrowser = (scene: Scene, chapterIndex: number) => {
  const [state, dispatch] = useReducer(reduce, "start", load);
  const pageRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const findRef = useRef<HTMLInputElement>(null);

  useEffect(() => dispatch({ scene }), [scene, chapterIndex]);

  // The caret goes where the shortcut just sent it. Selecting the address on
  // arrival is the whole point of that shortcut: you type over the old one.
  useEffect(() => {
    if (state.focus === "address") addressRef.current?.select();
    else if (state.focus === "find") findRef.current?.select();
    else pageRef.current?.focus();
  }, [state.focus, state.nonce]);

  useEffect(() => {
    if (!state.reloading) return;
    const timer = setTimeout(() => dispatch({ settled: true }), 500);
    return () => clearTimeout(timer);
  }, [state.reloading]);

  // How many matches the find bar is showing. It is a derived number — the page
  // text and the search term give it — so it is counted where both are, in the
  // component, and mirrored here rather than stored. Writing the ref during that
  // render is deliberate: the listener below is stable and reads it only from an
  // event, which runs after the commit.
  const matchesRef = useRef(0);

  // Called from the one keyboard listener the app has. Stable, so that
  // listener is not rebuilt every time a tab opens: everything this touches is
  // a ref or the reducer's dispatch.
  const handle = useCallback((action: ActionId) => {
    if (scrollBy(pageRef.current, action)) return;
    dispatch({ act: action, matches: matchesRef.current });
  }, []);

  return {
    state,
    handle,
    matchesRef,
    pageRef,
    addressRef,
    findRef,
    // Typing an address and pressing Enter lands on the same page every time:
    // the lesson is the shortcut that got the caret there, and a page that
    // changed with the spelling would make the next chapter unrepeatable.
    navigate: () => dispatch({ go: 2 }),
    // Stable, like handle, and for the same reason.
    jump: useCallback((tab: number) => dispatch({ tab }), []),
    found: (matches: number) => dispatch({ hits: matches }),
  };
};
