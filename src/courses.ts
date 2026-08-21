import type { ActionId } from "./actions";
import type { Scene } from "./useBrowser";

export type Step = {
  // Translation key for the line the narrator says. <keys/> in it is filled
  // from `keys`, so the sentence never names a platform's keys itself.
  say: string;
  // Loads text into the practice document. Only the steps that change it.
  document?: string;
  // The same thing for a course taught in the browser: what the tabs and the
  // history start out as. A chapter about the digits needs tabs to count.
  scene?: Scene;
  // What <keys/> prints, and what lights up on the keyboard — but only while
  // the step is actually waiting for input. Lighting a key on the step before
  // makes the learner press it early and then repeat themselves.
  keys?: ActionId;
  // The partner of `keys`, printed as <keysAlt/>. A drill that runs both ways
  // has to show both combinations, not one of them and the other in words.
  keysAlt?: ActionId;
  // Any one of these counts. A step asking for a round trip accepts both the
  // journey out and the journey back.
  expect?: ActionId | ActionId[];
  repeat?: number;
  // Adds Shift to whatever `keys` and `expect` name. Selecting is not a new
  // set of shortcuts, it is the familiar ones with Shift held — the lesson and
  // the code say the same thing.
  withShift?: boolean;
  // Satisfied once the document contains this text. Checked by what the
  // document became, because the goal here is the correction, not a keystroke.
  expectText?: string;
  // The mirror image: satisfied once this text is gone. Deleting has no
  // keystroke worth checking — what matters is that the words left.
  expectGone?: string;
  // Satisfied once nothing is left. An empty document is the one state
  // expectGone cannot express: every string contains the empty string.
  expectEmpty?: boolean;
  // Satisfied once the caret sits after this text, trailing space ignored:
  // a word jump lands right after the word on macOS and after the space that
  // follows it on Windows. For steps whose whole job is getting somewhere,
  // the destination is the answer.
  expectCaretAfter?: string;
  // Replaces `say` once the requirement is met, so finishing a drill reads as
  // an answer rather than as the same sentence with a counter missing.
  done?: string;
};

type Chapter = {
  title: string;
  steps: Step[];
};

// One line of the closing sheet: a shortcut, and whether Shift is held — the
// same keys with Shift do a different job and earn their own line.
export type Summary = {
  keys: ActionId;
  withShift?: boolean;
  // Overrides the name taken from the action. Two courses can reach for the
  // same shortcut and mean different things by it: the ends of a text in one,
  // the ends of a page in the other.
  label?: string;
};

// A course is a shelf of chapters with a name and a reason to take it. The
// list screen shows nothing else, because there is nothing else to decide on.
export type Course = {
  title: string;
  blurb: string;
  chapters: Chapter[];
  // What the course is taught on. Absent means the sheet of paper the first
  // course is written on.
  stage?: "browser";
  // What the closing sheet lists, in the order it should read — which is not
  // the order the chapters teach in: erasing a word comes last in the course
  // but belongs beside the selecting it saves you from. Written out rather
  // than gathered from the steps, because the sheet is the author's summary of
  // the course and not an index of it.
  summary: Summary[];
};

const textChapters: Chapter[] = [
  {
    title: "chapter1.title",
    steps: [
      { say: "chapter1.intro", document: "chapter1.text" },
      { say: "chapter1.spotTypo" },
      { say: "chapter1.trySlow", keys: "moveLeft", expect: "moveLeft", repeat: 10, done: "chapter1.trySlowDone" },
      { say: "chapter1.tooSlow" },
      // Nobody crawls up a paragraph one character at a time; they hop lines
      // first. Teaching the arrows without this leaves out how people move.
      {
        say: "chapter1.tryLines",
        keys: "moveUp",
        keysAlt: "moveDown",
        expect: ["moveUp", "moveDown"],
        repeat: 6,
        done: "chapter1.tryLinesDone",
      },
      { say: "chapter1.stillSlow" },
      { say: "chapter1.tryFast", keys: "moveWordLeft", expect: "moveWordLeft", done: "chapter1.tryFastDone" },
      { say: "chapter1.itJumped" },
      {
        say: "chapter1.practise",
        keys: "moveWordRight",
        // Left alone runs out of words; a round trip does not.
        expect: ["moveWordLeft", "moveWordRight"],
        repeat: 10,
        done: "chapter1.practiseDone",
      },
      // The chapter opened by promising to fix the typo; here it keeps that promise.
      { say: "chapter1.fixIt", keys: "moveWordLeft", expectText: "chapter1.fixed", done: "chapter1.fixedDone" },
    ],
  },
  {
    title: "chapter2.title",
    steps: [
      { say: "chapter2.intro", document: "chapter2.text" },
      { say: "chapter2.tryLineStart", keys: "lineStart", expect: "lineStart", done: "chapter2.tryLineStartDone" },
      { say: "chapter2.tryLineEnd", keys: "lineEnd", expect: "lineEnd", done: "chapter2.tryLineEndDone" },
      {
        say: "chapter2.drillLine",
        keys: "lineStart",
        keysAlt: "lineEnd",
        expect: ["lineStart", "lineEnd"],
        repeat: 6,
        done: "chapter2.drillLineDone",
      },
      { say: "chapter2.wholeText" },
      { say: "chapter2.docStart", keys: "documentStart", expect: "documentStart", done: "chapter2.docStartDone" },
      { say: "chapter2.docEnd", keys: "documentEnd", expect: "documentEnd", done: "chapter2.docEndDone" },
      // A round trip: you cannot arrive at the top twice without leaving it.
      {
        say: "chapter2.practise",
        keys: "documentStart",
        keysAlt: "documentEnd",
        expect: ["documentStart", "documentEnd"],
        repeat: 6,
        done: "chapter2.practiseDone",
      },
      { say: "chapter2.closing" },
    ],
  },
  {
    title: "chapter3.title",
    steps: [
      { say: "chapter3.intro", document: "chapter3.text" },
      { say: "chapter3.tryChar", keys: "moveLeft", expect: "moveLeft", withShift: true, repeat: 10, done: "chapter3.tryCharDone" },
      { say: "chapter3.tryWord", keys: "moveWordLeft", expect: "moveWordLeft", withShift: true, repeat: 8, done: "chapter3.tryWordDone" },
      {
        say: "chapter3.tryEdge",
        keys: "lineStart",
        keysAlt: "lineEnd",
        expect: ["lineStart", "lineEnd"],
        withShift: true,
        // Two, not more: between one direction and the other the selection has
        // to be dropped, and drilling that reads as a trick question.
        repeat: 2,
        done: "chapter3.tryEdgeDone",
      },
      // The most common thing anyone does with a selection — and, together with
      // the step above, the only way to wipe a line back to its start that
      // works on every platform.
      { say: "chapter3.deleteIt", keys: "deleteBack", expect: "deleteBack", done: "chapter3.deleteItDone" },
      { say: "chapter3.selectAll", keys: "selectAll", expect: "selectAll", done: "chapter3.selectAllDone" },
      // Clearing a document whole is a routine need, and it is just the two
      // moves above put together.
      { say: "chapter3.wipeAll", keys: "deleteBack", expectEmpty: true, done: "chapter3.wipeAllDone" },
      { say: "chapter3.closing" },
    ],
  },
  {
    title: "chapter4.title",
    steps: [
      { say: "chapter4.intro", document: "chapter4.text" },
      {
        say: "chapter4.spot",
        keys: "moveWordLeft",
        keysAlt: "moveWordRight",
        expectCaretAfter: "chapter4.landing",
        done: "chapter4.spotDone",
      },
      { say: "chapter4.selectWord", keys: "moveWordLeft", expect: "moveWordLeft", withShift: true, done: "chapter4.selectWordDone" },
      // Copy first: cutting is copying plus deleting, so it reads better second.
      { say: "chapter4.copyIt", keys: "copy", expect: "copy", done: "chapter4.copyItDone" },
      { say: "chapter4.cutIt", keys: "cut", expect: "cut", done: "chapter4.cutItDone" },
      // Cutting a word leaves the spaces that surrounded it. Real editing has
      // to tidy that up, so the lesson does too.
      { say: "chapter4.tidySpace", keys: "deleteBack", expectGone: "chapter4.doubleSpace", done: "chapter4.tidySpaceDone" },
      { say: "chapter4.moveThere", keys: "moveWordLeft", expect: "moveWordLeft", done: "chapter4.moveThereDone" },
      { say: "chapter4.pasteIt", keys: "paste", expectText: "chapter4.fixed", done: "chapter4.pasteItDone" },
      { say: "chapter4.undoIt", keys: "undo", expect: "undo", repeat: 2, done: "chapter4.undoItDone" },
      { say: "chapter4.redoIt", keys: "redo", expect: "redo", done: "chapter4.redoItDone" },
      { say: "chapter4.deleteWord", keys: "deleteWordLeft", expect: "deleteWordLeft", repeat: 3, done: "chapter4.deleteWordDone" },
      { say: "chapter4.closing" },
    ],
  },
  {
    // The workshop: three messes and almost no hand-holding. By now the steps
    // state the goal and let the learner recall the technique, which is the
    // whole point of a closing chapter.
    title: "chapter5.title",
    steps: [
      { say: "chapter5.intro", document: "chapter5.text" },
      // The brief and the first task are one step: a lone brief let the learner
      // fix what they could already see before the task ever appeared.
      { say: "chapter5.fixTypo", expectText: "chapter5.typoFixed", done: "chapter5.fixTypoDone" },
      { say: "chapter5.swap", expectText: "chapter5.swapFixed", done: "chapter5.swapDone" },
      { say: "chapter5.dropLine", expectGone: "chapter5.extra", done: "chapter5.dropLineDone" },
      { say: "chapter5.closing" },
    ],
  },
];

// Plain Delete is not listed: on its own it erases the selection, which nobody
// needs told.
const textSummary: Summary[] = [
  { keys: "moveLeft" },
  { keys: "moveUp" },
  { keys: "moveWordLeft" },
  { keys: "lineStart" },
  { keys: "documentStart" },
  { keys: "moveLeft", withShift: true },
  { keys: "moveWordLeft", withShift: true },
  { keys: "lineStart", withShift: true },
  { keys: "selectAll" },
  { keys: "deleteWordLeft" },
  { keys: "copy" },
  { keys: "cut" },
  { keys: "paste" },
  { keys: "undo" },
  { keys: "redo" },
];

const browserChapters: Chapter[] = [
  {
    title: "browser1.title",
    steps: [
      { say: "browser1.intro", scene: "start" },
      { say: "browser1.open", keys: "newTab", expect: "newTab", done: "browser1.openDone" },
      // The new tab arrives with the caret already in the address bar. Saying
      // so now is what makes the third chapter feel like a shortcut rather than
      // a new thing to remember.
      { say: "browser1.whereItWent" },
      { say: "browser1.openMore", keys: "newTab", expect: "newTab", repeat: 2, done: "browser1.openMoreDone" },
      { say: "browser1.close", keys: "closeTab", expect: "closeTab", done: "browser1.closeDone" },
      { say: "browser1.oops" },
      // The reason anyone finishes this course.
      { say: "browser1.reopen", keys: "reopenTab", expect: "reopenTab", done: "browser1.reopenDone" },
      {
        say: "browser1.drill",
        keys: "newTab",
        keysAlt: "closeTab",
        expect: ["newTab", "closeTab"],
        repeat: 6,
        done: "browser1.drillDone",
      },
      { say: "browser1.closing" },
    ],
  },
  {
    title: "browser2.title",
    steps: [
      { say: "browser2.intro", scene: "many" },
      // Control and not Command, even on a Mac. Worth a step of its own,
      // because everything else in this course follows the other rule.
      {
        say: "browser2.next",
        keys: "nextTab",
        expect: "nextTab",
        // As many presses as there are tabs, so the wrap round to the first one
        // actually happens rather than being described.
        repeat: 5,
        done: "browser2.nextDone",
      },
      { say: "browser2.prev", keys: "prevTab", expect: "prevTab", done: "browser2.prevDone" },
      {
        say: "browser2.drill",
        keys: "nextTab",
        keysAlt: "prevTab",
        expect: ["nextTab", "prevTab"],
        repeat: 6,
        done: "browser2.drillDone",
      },
      { say: "browser2.digits" },
      { say: "browser2.third", keys: "thirdTab", expect: "thirdTab", done: "browser2.thirdDone" },
      // Nine is not the ninth tab, it is the last one however many there are.
      { say: "browser2.last", keys: "lastTab", expect: "lastTab", done: "browser2.lastDone" },
      { say: "browser2.closing" },
    ],
  },
  {
    title: "browser3.title",
    steps: [
      { say: "browser3.intro", scene: "start" },
      { say: "browser3.focus", keys: "addressBar", expect: "addressBar", done: "browser3.focusDone" },
      // The address arrives selected, so everything the first course taught
      // about typing over a selection applies here unchanged.
      { say: "browser3.selected" },
      { say: "browser3.type", expectText: "browser3.query", done: "browser3.typeDone" },
      { say: "browser3.arrived" },
      { say: "browser3.tip" },
      { say: "browser3.again", keys: "addressBar", expect: "addressBar", done: "browser3.againDone" },
      { say: "browser3.closing" },
    ],
  },
  {
    title: "browser4.title",
    steps: [
      { say: "browser4.intro", scene: "start" },
      { say: "browser4.open", keys: "findOnPage", expect: "findOnPage", done: "browser4.openDone" },
      { say: "browser4.type", expectText: "browser4.term", done: "browser4.typeDone" },
      // Enter belongs to the find bar for as long as this step is unfinished:
      // the step's own expectation outranks the app's own navigation, and hands
      // the key back the moment the drill is done.
      { say: "browser4.next", keys: "findNext", expect: "findNext", repeat: 3, done: "browser4.nextDone" },
      { say: "browser4.prev", keys: "findPrev", expect: "findPrev", repeat: 3, done: "browser4.prevDone" },
      { say: "browser4.close", keys: "closeFind", expect: "closeFind", done: "browser4.closeDone" },
      { say: "browser4.closing" },
    ],
  },
  {
    title: "browser5.title",
    steps: [
      { say: "browser5.intro", scene: "visited" },
      { say: "browser5.down", keys: "pageDown", expect: "pageDown", repeat: 3, done: "browser5.downDone" },
      { say: "browser5.up", keys: "pageUp", expect: "pageUp", repeat: 3, done: "browser5.upDone" },
      // The same shortcut as the ends of a text in the first course, doing the
      // same job on a page. Nothing new to learn, which is the point.
      {
        say: "browser5.ends",
        keys: "documentEnd",
        keysAlt: "documentStart",
        expect: ["documentStart", "documentEnd"],
        repeat: 4,
        done: "browser5.endsDone",
      },
      { say: "browser5.back", keys: "historyBack", expect: "historyBack", done: "browser5.backDone" },
      { say: "browser5.forward", keys: "historyForward", expect: "historyForward", done: "browser5.forwardDone" },
      { say: "browser5.reload", keys: "reload", expect: "reload", done: "browser5.reloadDone" },
      { say: "browser5.closing" },
    ],
  },
  {
    // The workshop again: the goal is stated, the shortcut is not.
    title: "browser6.title",
    steps: [
      { say: "browser6.intro", scene: "many" },
      { say: "browser6.close", expect: "closeTab", done: "browser6.closeDone" },
      { say: "browser6.oops", expect: "reopenTab", done: "browser6.oopsDone" },
      // Two requirements at once: open the find bar and type the word. Between
      // them they describe the task without naming either key. It has to come
      // while the article is still the tab in front, so it runs before the two
      // tasks that move off it.
      { say: "browser6.find", expect: "findOnPage", expectText: "browser6.term", done: "browser6.findDone" },
      // Leaving the find bar open would sit over the two tasks that follow,
      // and putting a tool away is part of using it.
      { say: "browser6.tidy", expect: "closeFind", done: "browser6.tidyDone" },
      { say: "browser6.back", expect: "historyBack", done: "browser6.backDone" },
      { say: "browser6.jump", expect: "lastTab", done: "browser6.jumpDone" },
      { say: "browser6.closing" },
    ],
  },
];

const browserSummary: Summary[] = [
  { keys: "newTab" },
  { keys: "closeTab" },
  { keys: "reopenTab" },
  { keys: "nextTab" },
  { keys: "prevTab" },
  { keys: "thirdTab" },
  { keys: "lastTab" },
  { keys: "addressBar" },
  { keys: "findOnPage" },
  { keys: "findNext" },
  { keys: "findPrev" },
  { keys: "pageDown" },
  { keys: "pageUp" },
  { keys: "documentStart", label: "action.pageEnds" },
  { keys: "historyBack" },
  { keys: "reload" },
];

export const courses: Course[] = [
  {
    title: "course.text.title",
    blurb: "course.text.blurb",
    chapters: textChapters,
    summary: textSummary,
  },
  {
    title: "course.browser.title",
    blurb: "course.browser.blurb",
    chapters: browserChapters,
    stage: "browser",
    summary: browserSummary,
  },
];
