import type { ActionId } from "./actions";

export type Step = {
  // Translation key for the line the narrator says. <keys/> in it is filled
  // from `keys`, so the sentence never names a platform's keys itself.
  say: string;
  // Loads text into the practice document. Only the steps that change it.
  document?: string;
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

export type Chapter = {
  title: string;
  steps: Step[];
};

export const chapters: Chapter[] = [
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
