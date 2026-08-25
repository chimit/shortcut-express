import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { changeLanguage, type Language } from "./i18n";
import { initialPlatform, platforms, type LessonPlatform } from "./platform";
import { comboFor, comboParts, comboShort, keysOf, matches, type ActionId, type Combo } from "./actions";
import { courses, type Step } from "./courses";
import Browser, { BrowserTabs } from "./Browser";
import CourseList from "./CourseList";
import Dialog from "./Dialog";
import Keyboard from "./Keyboard";
import Summary from "./Summary";
import { useAppStage, appKeys, zoomOf } from "./useAppStage";
import { useBrowser, browserKeys } from "./useBrowser";
import { useDocument } from "./useDocument";
import "./App.css";

// Stands in wherever no step is running — the course list, the closing screen.
// A null step would mean a guard on every line that reads one; an empty one
// simply asks for nothing.
const noStep: Step = { say: "" };

// Drawn rather than typed: −, □ and ✕ are wildly different sizes in a font,
// and the close glyph in particular comes out tiny next to the others.
const windowGlyph = (path: string) => (
  <svg aria-hidden="true" fill="none" height="11" stroke="currentColor" strokeWidth="1.1" viewBox="0 0 11 11" width="11">
    {path === "square" ? <rect height="7" width="7" x="2" y="2" /> : <path d={path} />}
  </svg>
);

const pcWindowControls = [
  windowGlyph("M1.5 5.5h8"),
  windowGlyph("square"),
  windowGlyph("M1.7 1.7l7.6 7.6M9.3 1.7l-7.6 7.6"),
];

// Drawn for the same reason as those: an arrow character sits on the text
// baseline and will not line up with the label beside it. A chevron rather than
// a full arrow, which is what the platform itself uses for going back.
const backArrow = (
  <svg
    aria-hidden="true"
    fill="none"
    height="12"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.6"
    viewBox="0 0 12 12"
    width="12"
  >
    <path d="M7.5 2.5L4 6l3.5 3.5" />
  </svg>
);

// A shortcut is several keys, so each one is drawn as its own cap.
function KeyCombo({ combo, currentPlatform }: { combo: Combo; currentPlatform: LessonPlatform }) {
  return (
    <span className="key-combo">
      {comboParts(combo, currentPlatform).map((part, index) => (
        <span key={part}>
          {index > 0 && <span className="key-combo__plus">+</span>}
          <kbd className="key-cap">{part}</kbd>
        </span>
      ))}
    </span>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const [currentPlatform, setCurrentPlatform] = useState<LessonPlatform>(initialPlatform);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  // Which course the chapter and step below belong to, and whether the list is
  // covering it. Kept apart so stepping out to the list and back in returns to
  // the same course rather than looking like a switch to a different one.
  const [listOpen, setListOpen] = useState(true);
  const [courseIndex, setCourseIndex] = useState(0);
  const [pickedCourse, setPickedCourse] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const currentLanguage: Language = i18n.resolvedLanguage === "ru" ? "ru" : "en";

  const isMac = currentPlatform === "macos";
  const [showHint, setShowHint] = useState(false);
  const course = listOpen ? null : courses[courseIndex];
  // One past the last chapter is the closing screen: walking off the end of a
  // course is the same move as walking off the end of a chapter.
  const finished = course !== null && chapterIndex >= course.chapters.length;
  const chapter = course && !finished ? course.chapters[chapterIndex] : null;
  const step = chapter?.steps[stepIndex] ?? noStep;

  // The third stage: the same sheet of paper, inside an application that can
  // save it, open another one and print it.
  const isApp = course?.stage === "app";
  const stage = useAppStage(chapterIndex, listOpen);

  // The document only changes on the steps that say so; the rest inherit it.
  // Unless the learner opened something: then the window shows that instead,
  // and the text is retyped exactly as a change of chapter retypes it.
  const stepDocument = chapter?.steps.slice(0, stepIndex + 1).reverse().find((s) => s.document)?.document;
  const shown = isApp ? stage.state.shown : "step";
  const documentKey = shown === "step" ? stepDocument : shown === "closed" ? undefined : `app.${shown}.text`;
  const { draft: written, caret, ready: docReady, follow } = useDocument(editorRef, documentKey ? t(documentKey) : "");

  // The second stage: a drawn browser instead of a sheet of paper. Its scene
  // is inherited down the steps exactly as the practice document is.
  const isBrowser = course?.stage === "browser";
  const scene = chapter?.steps.slice(0, stepIndex + 1).reverse().find((s) => s.scene)?.scene ?? "start";
  const browser = useBrowser(scene, chapterIndex);
  // What has been typed into whichever field the browser has the caret in.
  // The document and the address bar are both "what the learner wrote", so one
  // name covers them and every expectation below reads the same either way.
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(""), [chapterIndex, stepIndex]);
  // Whatever field the learner is writing in. A dialog takes that over while
  // it is open, the way the address bar does in the browser course.
  const draft = isBrowser || (isApp && stage.state.dialog) ? typed : written;

  // What the title bar calls the document. A name the learner gave it wins:
  // saving a file from the list under a new one has to rename it, or the title
  // would go on showing the name it was opened under.
  const windowName =
    shown === "closed"
      ? t("app.closed")
      : stage.state.name ||
        (shown.startsWith("file") ? t(`app.${shown}.name`) : t("app.untitled"));

  // Selecting is the familiar movement with Shift held, so the step says so
  // rather than the table carrying a second copy of every entry.
  const comboOf = (action: ActionId): Combo => {
    const base = comboFor(action, currentPlatform);
    return step.withShift ? { ...base, shift: true } : base;
  };

  const wrote = (needle: string) =>
    stage.state.dialog
      ? draft.toLowerCase().includes(needle.toLowerCase())
      : draft.includes(needle);

  const needed = step.expect ? (step.repeat ?? 1) : 0;
  // The listener has to know how far the drill has got without being rebuilt
  // on every press: a step that borrows Enter must hand it back the moment its
  // count is full. Writing the ref during the render is deliberate — it mirrors
  // a value the render already has, and is only ever read from an event, which
  // runs after the commit.
  const doneRef = useRef(0);
  doneRef.current = done;
  // "Gone" is only meaningful once the text that should go is actually there:
  // a document still being typed out contains nothing at all.
  const textDone =
    // Case counts in the document, where the learner is repairing real prose,
    // and not in a dialog, where they are naming a file: someone asked for
    // "Report" who typed "report" has done the exercise.
    (step.expectText ? wrote(t(step.expectText)) : true) &&
    (step.expectGone ? docReady && !draft.includes(t(step.expectGone)) : true) &&
    (step.expectEmpty ? docReady && draft.length === 0 : true) &&
    (step.expectCaretAfter ? draft.slice(0, caret).trimEnd().endsWith(t(step.expectCaretAfter)) : true) &&
    (step.expectSaved
      ? stage.state.saved && stage.state.name.toLowerCase() === t(step.expectSaved).toLowerCase()
      : true) &&
    (step.expectShown ? stage.state.shown === step.expectShown : true);
  const satisfied = done >= needed && textDone;
  const asked =
    needed > 0 ||
    Boolean(step.expectText) ||
    Boolean(step.expectGone) ||
    Boolean(step.expectEmpty) ||
    Boolean(step.expectCaretAfter) ||
    Boolean(step.expectSaved) ||
    Boolean(step.expectShown);
  // Lit only while the step is waiting: a key shown a step early gets pressed
  // early, and then the learner is asked to press it again.
  const nextCombo = comboFor("nextStep", currentPlatform);
  const lessonKeys =
    step.keys && asked && !satisfied
      ? [...keysOf(comboOf(step.keys)), ...(step.keysAlt ? keysOf(comboOf(step.keysAlt)) : [])]
      : [];
  // Whatever the learner is meant to press is lit on the keyboard itself: the
  // step's own shortcut while it is still waiting, Enter once it is not. The
  // way on is a keypress, so it is taught on the keys rather than on a button.
  // Off the lesson screens the same rule lights whatever drives the screen.
  const hintedKeys = course
    ? finished
      ? new Set(keysOf(nextCombo))
      : lessonKeys.length
        ? new Set(lessonKeys)
        : satisfied
          ? new Set(keysOf(nextCombo))
          : undefined
    : new Set([
        ...keysOf(comboFor("moveUp", currentPlatform)),
        ...keysOf(comboFor("moveDown", currentPlatform)),
        ...keysOf(nextCombo),
      ]);


  // Leaving drops the course back to the top of its current chapter. The step
  // number could be kept, but the practice document could not: it is retyped
  // from the chapter's own text, so any step that expects an edited document —
  // a word cut, something on the clipboard — would be unreachable.
  const toList = () => {
    if (finished) setChapterIndex(0);
    setStepIndex(0);
    setListOpen(true);
    setDone(0);
  };

  // Only a different course starts from the beginning; the one just left
  // resumes at the top of the chapter it was left in.
  const openCourse = (index: number) => {
    if (index !== courseIndex) {
      setChapterIndex(0);
      setStepIndex(0);
    }
    setPickedCourse(index);
    setCourseIndex(index);
    setListOpen(false);
    setDone(0);
  };

  // Stepping past either end of a chapter moves to the next or previous one,
  // and past either end of the course, out of it.
  const goTo = (index: number) => {
    if (!course || !chapter) return;
    setDone(0);
    if (index < 0) {
      if (chapterIndex === 0) {
        toList();
        return;
      }
      setChapterIndex(chapterIndex - 1);
      setStepIndex(course.chapters[chapterIndex - 1].steps.length - 1);
      return;
    }
    if (index >= chapter.steps.length) {
      setChapterIndex(chapterIndex + 1);
      setStepIndex(0);
      return;
    }
    setStepIndex(index);
  };

  // Back, from the closing screen: into the last step of the last chapter,
  // because that is what "the step before this screen" means.
  const toLastStep = () => {
    if (!course) return;
    const last = course.chapters.length - 1;
    setChapterIndex(last);
    setStepIndex(course.chapters[last].steps.length - 1);
    setDone(0);
  };

  // The caret only blinks while the document has focus, and a lesson about the
  // caret cannot afford to lose it. Chrome buttons therefore decline the focus
  // a mouse click would hand them; keyboard users still reach them with Tab.
  const keepFocus = (event: React.MouseEvent) => event.preventDefault();

  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      setPressedKeys((current) => {
        if (current.has(event.code)) return current;
        const next = new Set(current);
        next.add(event.code);
        return next;
      });

      // Enter goes deeper and Escape comes back out, everywhere: into a course
      // and on to the next step, back a step and out of the course. One rule,
      // so the app can be driven before any of it has been explained.
      const goes = matches(event, nextCombo);
      const backs = matches(event, comboFor("prevStep", currentPlatform));

      // The list is the course's own first lesson: the keys that pick a course
      // are the arrows the course itself starts by teaching.
      if (!course) {
        if (matches(event, comboFor("moveUp", currentPlatform))) {
          event.preventDefault();
          setPickedCourse((index) => Math.max(0, index - 1));
        } else if (matches(event, comboFor("moveDown", currentPlatform))) {
          event.preventDefault();
          setPickedCourse((index) => Math.min(courses.length - 1, index + 1));
        } else if (goes) {
          event.preventDefault();
          openCourse(pickedCourse);
        }
        return;
      }

      // The closing screen keeps the same two meanings as everywhere else:
      // Enter goes on — here, out to the shelf — and Escape goes back, which
      // from the last screen of a course means back into its last step.
      if (finished) {
        if (goes) {
          event.preventDefault();
          toList();
        } else if (backs) {
          event.preventDefault();
          toLastStep();
        }
        return;
      }

      // Credit is given for performing the shortcut, not for the caret landing
      // somewhere: the point of the lesson is the technique. A step naming
      // several accepts any of them: a round trip counts either way.
      const wanted = step.expect ? [step.expect].flat() : [];
      // A step may ask for the very keys the app is driven by — the find bar
      // moves on Enter and closes on Escape. While such a step is still
      // counting, the key belongs to it; once the count is full the key goes
      // back to meaning "on" and "back", so the way out is the way in.
      const claimed = doneRef.current < needed && wanted.some((action) => matches(event, comboOf(action)));

      // The drawn browser answers its own shortcuts whatever the step is
      // asking for: a learner who tries Command+T out of turn should still see
      // a tab open. Only these keys are held back from the page — Command+Q is
      // not among them, and must always go on quitting the app.
      if (isBrowser) {
        const typing = document.activeElement instanceof HTMLInputElement;
        // Every digit jumps to its tab, not only the two the chapter stops to
        // name: a learner who tries the five in between should see it work. The
        // modifier is borrowed from the table rather than restated here.
        const digit = comboFor("thirdTab", currentPlatform);
        if (/^Digit[1-9]$/.test(event.code) && matches(event, { ...digit, code: event.code })) {
          event.preventDefault();
          browser.jump(Number(event.code.slice(5)));
        } else {
          const acted = browserKeys.find(
            (action) =>
              // Space is a space while a field has the caret, not a page down.
              !(typing && (action === "pageDown" || action === "pageUp")) &&
              // Enter and Escape are the app's own. The browser gets them only
              // while a step is asking for them: once the find drill is done,
              // Enter goes back to meaning "next step" and stops quietly walking
              // the page on to another match behind the lesson's back.
              !((goes || backs) && !claimed) &&
              matches(event, comboFor(action, currentPlatform)),
          );
          if (acted) {
            event.preventDefault();
            browser.handle(acted);
          }
        }
      }

      // The drawn application answers its own shortcuts for the same reason the
      // browser does. The stage itself decides what is its business: a Space
      // with the caret in the name field, or a Tab with no dialog open, is not,
      // and falls straight through to the document underneath.
      if (isApp) {
        const acted = appKeys.find(
          (action) =>
            // Enter is the app's own way on. A dialog gets it only while a step
            // is asking for it — otherwise a learner reading the two steps that
            // explain the open dialog would accept it instead of moving on, and
            // the explanation would never be seen. Escape is the opposite case:
            // an open dialog always answers it, because a dialog that could not
            // be dismissed is a trap, and dismissing one is what this course
            // teaches Escape for.
            !(goes && !claimed) &&
            matches(event, comboFor(action, currentPlatform)),
        );
        if (acted && stage.handle(acted)) {
          event.preventDefault();
          // A keystroke the stage took is not also a lesson keystroke — unless
          // the step asked for it, in which case the common path below counts
          // it. Escape closing a dialog must not also step backwards.
          if (!claimed) return;
        }
      }

      // Quitting is the one shortcut this application must normally let through,
      // and the one the third course would rather the learner tried than took
      // on trust. Both are true if it is held back on exactly one step: the one
      // that asks for it. Everywhere else Command+Q still quits.
      if (claimed && matches(event, comboFor("quit", currentPlatform))) event.preventDefault();

      // Nothing else is prevented here: the keystroke still has to do its own work.
      // An arrow that was counted must also move the caret, and Enter in the
      // find bar has already been held back above. The return is what keeps the
      // lesson from also treating it as "next step".
      if (claimed) {
        setDone((count) => Math.min(count + 1, step.repeat ?? 1));
        return;
      }

      // Enter would otherwise break the line in the practice document.
      if (goes) {
        event.preventDefault();
        goTo(stepIndex + 1);
        return;
      }

      if (backs) {
        event.preventDefault();
        goTo(stepIndex - 1);
        return;
      }

      if (wanted.some((action) => matches(event, comboOf(action)))) {
        setDone((count) => Math.min(count + 1, step.repeat ?? 1));
      }
    };
    const release = (event: KeyboardEvent) => {
      setPressedKeys((current) => {
        if (!current.has(event.code)) return current;
        const next = new Set(current);
        next.delete(event.code);
        return next;
      });
    };
    const releaseAll = () => setPressedKeys(new Set());

    // Coming back to the window should recover a lost caret, not move one that
    // is still where the learner left it — in the address bar, or in the find
    // field, or on a chrome button they tabbed to on purpose.
    const refocus = () => {
      if (document.activeElement && document.activeElement !== document.body) return;
      (course ? (isBrowser ? browser.pageRef.current : editorRef.current) : cardRef.current)?.focus();
    };

    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", releaseAll);
    window.addEventListener("focus", refocus);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", releaseAll);
      window.removeEventListener("focus", refocus);
    };
  }, [browser.handle, browser.jump, browser.pageRef, chapterIndex, course, currentPlatform, finished, isApp, isBrowser, needed, pickedCourse, stage.handle, step, stepIndex]);

  // A small helper, not a cage: a step that asks for a keystroke takes the
  // focus back, but the learner is free to click away at any time.
  // A dialog outranks it: while one is open the caret belongs to whatever
  // control the dialog put it in, and it comes back here when the dialog goes.
  useEffect(() => {
    if (asked && !stage.state.dialog) editorRef.current?.focus();
  }, [asked, chapterIndex, stepIndex, stage.state.dialog]);

  // The picked card carries the focus, so the arrows and Tab agree with each
  // other and a screen reader is told what the arrows just did.
  useEffect(() => {
    if (!course) cardRef.current?.focus();
  }, [course, pickedCourse]);

  // The very first screen already carries a document, a narrator and a
  // keyboard; the mechanic waits until the learner has read the rest.
  useEffect(() => {
    if (!course || finished || stepIndex !== 0) {
      setShowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, [course, finished, stepIndex]);


  // Finishing a drill has to read as an answer, not as the same sentence with
  // its counter quietly removed.
  const succeeded = asked && satisfied && Boolean(step.done);
  const line = succeeded ? step.done! : step.say;

  return (
    <div className="app-shell">
      <header className="app-header">
        {/* A window's header says where you are, not what you launched — the
            application's own name is already in the dock and the menu bar. The
            wrapper stays even when empty so the tabs keep their column. */}
        <div className="app-header__lead">
          {course && (
            <button
              aria-label={t("courses.back")}
              className="back"
              onClick={toList}
              type="button"
            >
              {backArrow}
              {t("courses.title")}
            </button>
          )}
        </div>

        <div className="platform-tabs" role="radiogroup" aria-label={t("platform.label")}>
          {platforms.map(({ id, label }) => (
            <button
              aria-checked={currentPlatform === id}
              className="platform-tabs__tab"
              key={id}
              onClick={() => setCurrentPlatform(id)}
              onMouseDown={keepFocus}
              role="radio"
              type="button"
            >
              {label}
              {initialPlatform === id && (
                <span className="platform-tabs__current" title={t("platform.currentDevice")} />
              )}
            </button>
          ))}
        </div>

        <div className="language-switch" aria-label={t("language.label")} role="group">
          {(["en", "ru"] as const).map((language) => (
            <button
              aria-label={t(language === "en" ? "language.english" : "language.russian")}
              aria-pressed={currentLanguage === language}
              className="language-switch__button"
              key={language}
              onClick={() => void changeLanguage(language)}
              onMouseDown={keepFocus}
              type="button"
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="workspace">
        <section className="editor-panel" aria-label={t("editor.ariaLabel")}>
          <div className="editor-panel__bar">
            <div aria-hidden="true" className="window-controls">
              {isMac && <><span /><span /><span /></>}
            </div>
            {isBrowser && chapter ? (
              <BrowserTabs browser={browser} />
            ) : (
              <span className="editor-panel__title">
                {/* An application names the file in its title bar, and marks it
                    with a dot until the file on disk matches what is on screen.
                    The whole first chapter is taught off that dot. */}
                {isApp && chapter ? (
                  <>
                    {windowName}
                    {shown !== "closed" && !stage.state.saved && (
                      <span aria-label={t("app.unsaved")} className="editor-panel__dot" role="img" />
                    )}
                  </>
                ) : chapter ? (
                  t("documentTitle", { current: chapterIndex + 1, title: t(chapter.title) })
                ) : (
                  t(finished ? "finish.title" : "courses.title")
                )}
              </span>
            )}
            <div aria-hidden="true" className="window-controls window-controls--pc">
              {!isMac && pcWindowControls.map((glyph, index) => <span key={index}>{glyph}</span>)}
            </div>

          </div>
          <div
            className="document-canvas"
            data-stage={isBrowser && chapter ? "browser" : "paper"}
            style={isApp ? ({ "--zoom": zoomOf(stage.state.zoom) } as React.CSSProperties) : undefined}
          >
            {/* One bar for the whole course, drawn along the top edge of the page
                itself and clipped by its corners, the way a browser draws its
                own loading. A segment per chapter, a tick per step: two separate
                paginations cost a band of height each and made you read your
                position in two places. */}
            {course && chapter && (
              <div
                aria-label={t("progress", { current: chapterIndex + 1, total: course.chapters.length })}
                className="course-progress"
                role="group"
              >
                {course.chapters.map((item, index) => (
                  <div className="course-progress__chapter" key={item.title}>
                    {item.steps.map((_, at) => (
                      <button
                        aria-current={index === chapterIndex && at === stepIndex}
                        aria-label={`${t("documentTitle", { current: index + 1, title: t(item.title) })} — ${t("step.stepOf", { current: at + 1, total: item.steps.length })}`}
                        className="course-progress__step"
                        data-state={
                          index < chapterIndex || (index === chapterIndex && at < stepIndex)
                            ? "done"
                            : index === chapterIndex && at === stepIndex
                              ? "current"
                              : "todo"
                        }
                        key={at}
                        onClick={() => {
                          setChapterIndex(index);
                          setStepIndex(at);
                          setDone(0);
                        }}
                        onMouseDown={keepFocus}
                        title={t(item.title)}
                        type="button"
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
            {!finished && !isBrowser && (
              <div className="document-canvas__label">
                {chapter ? t("editor.section") : t("courses.label")}
              </div>
            )}

            {chapter && isBrowser && <Browser browser={browser} onType={setTyped} />}

            {chapter && !isBrowser && shown !== "closed" && (
              <textarea
                aria-label={t("editor.cursor")}
                autoCorrect="off"
                key={`${currentLanguage}-${documentKey}`}
                onInput={(event) => {
                  follow(event);
                  // Typing is what puts the dot back. Nothing else can report
                  // it, and the programmatic typing that lays a chapter's text
                  // out sets the value directly, so it never fires this.
                  if (isApp) stage.touch();
                }}
                onKeyUp={follow}
                onSelect={follow}
                ref={editorRef}
                spellCheck={false}
              />
            )}

            {/* A window with nothing in it. Closing the document is the last
                thing the second chapter asks for, and an application that
                carried on showing the text would have taught nothing. */}
            {chapter && isApp && shown === "closed" && (
              <p className="document-canvas__empty">{t("app.closedBody")}</p>
            )}

            {chapter && isApp && (
              <Dialog
                currentPlatform={currentPlatform}
                name={windowName}
                onType={setTyped}
                stage={stage}
                text={written}
              />
            )}

            {!course && (
              <CourseList
                cardRef={cardRef}
                onOpen={openCourse}
                onPick={setPickedCourse}
                picked={pickedCourse}
              />
            )}

            {finished && course && <Summary course={course} currentPlatform={currentPlatform} />}
          </div>
        </section>

        {/* The two buttons are what Enter and Escape look like. They show
            wherever those keys do something, which is every screen inside a
            course — the closing sheet included, where they mean "back into the
            last step" and "out to the shelf". On the list neither applies. */}
        <div className={course ? "narration" : "narration narration--no-nav"}>
          {course && (
            <button
              aria-label={t("step.back")}
              className="narration__nav"
              onClick={finished ? toLastStep : () => goTo(stepIndex - 1)}
              onMouseDown={keepFocus}
              type="button"
            >
              ←
              <kbd>{comboShort(comboFor("prevStep", currentPlatform), currentPlatform)}</kbd>
            </button>
          )}

          <div className="narration__body" data-state={succeeded || finished ? "done" : "asking"}>
            <p aria-live="polite">
              {succeeded && <span aria-hidden="true" className="narration__tick">✓</span>}
              <Trans
                components={{
                  keys: step.keys ? (
                    <KeyCombo combo={comboOf(step.keys)} currentPlatform={currentPlatform} />
                  ) : (
                    <span />
                  ),
                  keysAlt: step.keysAlt ? (
                    <KeyCombo combo={comboOf(step.keysAlt)} currentPlatform={currentPlatform} />
                  ) : (
                    <span />
                  ),
                  up: <KeyCombo combo={comboFor("moveUp", currentPlatform)} currentPlatform={currentPlatform} />,
                  down: <KeyCombo combo={comboFor("moveDown", currentPlatform)} currentPlatform={currentPlatform} />,
                  enter: <KeyCombo combo={nextCombo} currentPlatform={currentPlatform} />,
                }}
                i18nKey={chapter ? line : finished ? "finish.say" : "courses.say"}
              />
            </p>
            {needed > 0 && !satisfied && (
              <span className="narration__count">{done} / {needed}</span>
            )}
          </div>

          {course && (
            <button
              aria-label={t(finished ? "courses.back" : "step.next")}
              className="narration__nav narration__nav--next"
              onClick={finished ? toList : () => goTo(stepIndex + 1)}
              onMouseDown={keepFocus}
              type="button"
            >
              →
              <kbd>{comboShort(nextCombo, currentPlatform)}</kbd>
              {showHint && (
                <span className="narration__hint">
                  <Trans
                    components={{ keys: <KeyCombo combo={nextCombo} currentPlatform={currentPlatform} /> }}
                    i18nKey="step.continueHint"
                  />
                </span>
              )}
            </button>
          )}
        </div>

      </main>

      <footer className="keyboard-dock">
        <div className="keyboard-dock__inner">
          <Keyboard
            currentPlatform={currentPlatform}
            hintedKeys={hintedKeys}
            pressedKeys={pressedKeys}
          />
        </div>
      </footer>
    </div>
  );
}

export default App;
