import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { changeLanguage, type Language } from "./i18n";
import { initialPlatform, platforms, type LessonPlatform } from "./platform";
import { comboFor, comboParts, comboShort, keysOf, matches, type ActionId, type Combo } from "./actions";
import { courses, type Step } from "./courses";
import CourseList from "./CourseList";
import Keyboard from "./Keyboard";
import Summary from "./Summary";
import { useDocument } from "./useDocument";
import iconUrl from "../design/icon.svg";
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

  // The document only changes on the steps that say so; the rest inherit it.
  const documentKey = chapter?.steps.slice(0, stepIndex + 1).reverse().find((s) => s.document)?.document;
  const { draft, caret, ready: docReady, follow } = useDocument(editorRef, documentKey ? t(documentKey) : "");

  // Selecting is the familiar movement with Shift held, so the step says so
  // rather than the table carrying a second copy of every entry.
  const comboOf = (action: ActionId): Combo => {
    const base = comboFor(action, currentPlatform);
    return step.withShift ? { ...base, shift: true } : base;
  };

  const needed = step.expect ? (step.repeat ?? 1) : 0;
  // "Gone" is only meaningful once the text that should go is actually there:
  // a document still being typed out contains nothing at all.
  const textDone =
    (step.expectText ? draft.includes(t(step.expectText)) : true) &&
    (step.expectGone ? docReady && !draft.includes(t(step.expectGone)) : true) &&
    (step.expectEmpty ? docReady && draft.length === 0 : true) &&
    (step.expectCaretAfter ? draft.slice(0, caret).trimEnd().endsWith(t(step.expectCaretAfter)) : true);
  const satisfied = done >= needed && textDone;
  const asked =
    needed > 0 ||
    Boolean(step.expectText) ||
    Boolean(step.expectGone) ||
    Boolean(step.expectEmpty) ||
    Boolean(step.expectCaretAfter);
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

      if (finished) {
        if (goes || backs) {
          event.preventDefault();
          toList();
        }
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

      // Credit is given for performing the shortcut, not for the caret landing
      // somewhere: the point of the lesson is the technique. A step naming
      // several accepts any of them: a round trip counts either way.
      const wanted = step.expect ? [step.expect].flat() : [];
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

    const refocus = () => (course ? editorRef.current : cardRef.current)?.focus();

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
  }, [chapterIndex, course, currentPlatform, finished, pickedCourse, step, stepIndex]);

  // A small helper, not a cage: a step that asks for a keystroke takes the
  // focus back, but the learner is free to click away at any time.
  useEffect(() => {
    if (asked) editorRef.current?.focus();
  }, [asked, chapterIndex, stepIndex]);

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
        <button
          aria-label={t("courses.back")}
          className="brand"
          disabled={!course}
          onClick={toList}
          type="button"
        >
          {/* The application icon itself, at header size. */}
          <img alt="" className="brand__mark" src={iconUrl} />
          <span>Coldkey</span>
        </button>

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
            <span>
              {chapter
                ? t("documentTitle", { current: chapterIndex + 1, title: t(chapter.title) })
                : t(finished ? "finish.title" : "courses.title")}
            </span>
            <div aria-hidden="true" className="window-controls window-controls--pc">
              {!isMac && pcWindowControls.map((glyph, index) => <span key={index}>{glyph}</span>)}
            </div>

          </div>
          <div className="document-canvas">
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
            {!finished && (
              <div className="document-canvas__label">
                {chapter ? t("editor.section") : t("courses.label")}
              </div>
            )}

            {chapter && (
              <textarea
                aria-label={t("editor.cursor")}
                autoCorrect="off"
                key={`${currentLanguage}-${documentKey}`}
                onInput={follow}
                onKeyUp={follow}
                onSelect={follow}
                ref={editorRef}
                spellCheck={false}
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

        <div className={chapter ? "narration" : "narration narration--no-nav"}>
          {chapter && (
            <button
              aria-label={t("step.back")}
              className="narration__nav"
              onClick={() => goTo(stepIndex - 1)}
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

          {chapter && (
            <button
              aria-label={t("step.next")}
              className="narration__nav narration__nav--next"
              onClick={() => goTo(stepIndex + 1)}
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
