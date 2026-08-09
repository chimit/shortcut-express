import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { changeLanguage, type Language } from "./i18n";
import { initialPlatform, platforms, type LessonPlatform } from "./platform";
import { comboFor, comboParts, comboShort, keysOf, matches, type ActionId, type Combo } from "./actions";
import { chapters } from "./chapters";
import Keyboard from "./Keyboard";
import "./App.css";

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
  const [chapterIndex, setChapterIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [docReady, setDocReady] = useState(false);
  const [caret, setCaret] = useState(0);
  const [done, setDone] = useState(0);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const currentLanguage: Language = i18n.resolvedLanguage === "ru" ? "ru" : "en";

  const isMac = currentPlatform === "macos";
  const [showHint, setShowHint] = useState(false);
  const chapter = chapters[chapterIndex];
  const step = chapter.steps[stepIndex];

  // Selecting is the familiar movement with Shift held, so the step says so
  // rather than the table carrying a second copy of every entry.
  const comboOf = (action: ActionId): Combo => {
    const base = comboFor(action, currentPlatform);
    return step.withShift ? { ...base, shift: true } : base;
  };

  const expected = step.expect ? [step.expect].flat() : [];
  const needed = expected.length ? (step.repeat ?? 1) : 0;
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
  const hintedKeys =
    step.keys && asked && !satisfied
      ? new Set([
          ...keysOf(comboOf(step.keys)),
          ...(step.keysAlt ? keysOf(comboOf(step.keysAlt)) : []),
        ])
      : undefined;

  // The document only changes on the steps that say so; the rest inherit it.
  const documentKey = chapter.steps.slice(0, stepIndex + 1).reverse().find((s) => s.document)?.document;
  const documentText = documentKey ? t(documentKey) : "";

  // Stepping past either end of a chapter moves to the next or previous one.
  const goTo = (index: number) => {
    setDone(0);
    if (index < 0) {
      if (chapterIndex === 0) return;
      setChapterIndex(chapterIndex - 1);
      setStepIndex(chapters[chapterIndex - 1].steps.length - 1);
      return;
    }
    if (index >= chapter.steps.length) {
      if (chapterIndex === chapters.length - 1) return;
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

      // Enter would otherwise break the line in the practice document.
      if (matches(event, comboFor("nextStep", currentPlatform))) {
        event.preventDefault();
        goTo(stepIndex + 1);
        return;
      }

      if (matches(event, comboFor("prevStep", currentPlatform))) {
        event.preventDefault();
        goTo(stepIndex - 1);
        return;
      }

      // Credit is given for performing the shortcut, not for the caret landing
      // somewhere: the point of the lesson is the technique.
      if (expected.some((action) => matches(event, comboOf(action)))) {
        setDone((count) => Math.min(count + 1, needed));
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

    const refocus = () => editorRef.current?.focus();

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
  }, [chapterIndex, currentPlatform, expected, needed, step, stepIndex]);

  // A small helper, not a cage: a step that asks for a keystroke takes the
  // focus back, but the learner is free to click away at any time.
  useEffect(() => {
    if (asked) editorRef.current?.focus();
  }, [asked, chapterIndex, stepIndex]);

  // The very first screen already carries a document, a narrator and a
  // keyboard; the mechanic waits until the learner has read the rest.
  useEffect(() => {
    if (stepIndex !== 0) {
      setShowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  // A new chapter types its document out rather than swapping it silently, so
  // the change of exercise is impossible to miss.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const land = (text: string) => {
      editor.value = text;
      editor.focus();
      editor.setSelectionRange(text.length, text.length);
      setDraft(text);
      setCaret(text.length);
      setDocReady(true);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      land(documentText);
      return;
    }

    let shown = 0;
    land("");
    setDocReady(false);
    const timer = setInterval(() => {
      shown = Math.min(shown + 1, documentText.length);
      editor.value = documentText.slice(0, shown);
      editor.setSelectionRange(shown, shown);
      if (shown === documentText.length) {
        clearInterval(timer);
        setDraft(documentText);
        setDocReady(true);
      }
    }, 14);
    return () => clearInterval(timer);
  }, [currentLanguage, documentText]);

  const nextCombo = comboFor("nextStep", currentPlatform);
  // Finishing a drill has to read as an answer, not as the same sentence with
  // its counter quietly removed.
  const succeeded = asked && satisfied && Boolean(step.done);
  const line = succeeded ? step.done! : step.say;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">C</span>
          <span>Coldkey</span>
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
        <div
          aria-label={t("progress", { current: chapterIndex + 1, total: chapters.length })}
          className="course-progress"
          role="group"
        >
          {chapters.map((item, index) => (
            <button
              aria-current={index === chapterIndex}
              aria-label={t("documentTitle", { current: index + 1, title: t(item.title) })}
              className="course-progress__chapter"
              data-state={index === chapterIndex ? "current" : index < chapterIndex ? "done" : "todo"}
              key={item.title}
              onClick={() => {
                setChapterIndex(index);
                setStepIndex(0);
                setDone(0);
              }}
              onMouseDown={keepFocus}
              title={t(item.title)}
              type="button"
            />
          ))}
        </div>

        <section className="editor-panel" aria-label={t("editor.ariaLabel")}>
          <div className="editor-panel__bar">
            <div aria-hidden="true" className="window-controls">
              {isMac && <><span /><span /><span /></>}
            </div>
            <span>
              {t("documentTitle", { current: chapterIndex + 1, title: t(chapter.title) })}
            </span>
            <div aria-hidden="true" className="window-controls window-controls--pc">
              {!isMac && pcWindowControls.map((glyph, index) => <span key={index}>{glyph}</span>)}
            </div>
          </div>
          <div className="document-canvas">
            <div className="document-canvas__label">{t("editor.section")}</div>
            <textarea
              aria-label={t("editor.cursor")}
              autoCorrect="off"
              key={`${currentLanguage}-${documentKey}`}
              onInput={(event) => {
                setDraft(event.currentTarget.value);
                setCaret(event.currentTarget.selectionStart);
              }}
              onKeyUp={(event) => setCaret(event.currentTarget.selectionStart)}
              onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
              ref={editorRef}
              spellCheck={false}
            />
          </div>
        </section>

        <div className="narration">
          <button
            aria-label={t("step.back")}
            className="narration__step"
            disabled={chapterIndex === 0 && stepIndex === 0}
            onClick={() => goTo(stepIndex - 1)}
            onMouseDown={keepFocus}
            type="button"
          >
            ←
            <kbd>{comboShort(comboFor("prevStep", currentPlatform), currentPlatform)}</kbd>
          </button>

          <div className="narration__body" data-state={succeeded ? "done" : "asking"}>
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
                }}
                i18nKey={line}
              />
            </p>
            {needed > 0 && !satisfied && (
              <span className="narration__count">{done} / {needed}</span>
            )}
          </div>

          <button
            aria-label={t("step.next")}
            className="narration__step narration__step--next"
            data-ready={satisfied}
            disabled={chapterIndex === chapters.length - 1 && stepIndex === chapter.steps.length - 1}
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
        </div>

        <div aria-label={t("step.list")} className="steps" role="group">
          {chapter.steps.map((_, index) => (
            <button
              aria-current={index === stepIndex}
              aria-label={t("step.stepOf", { current: index + 1, total: chapter.steps.length })}
              className="steps__dot"
              data-state={index === stepIndex ? "current" : index < stepIndex ? "done" : "todo"}
              key={index}
              onClick={() => goTo(index)}
              onMouseDown={keepFocus}
              type="button"
            />
          ))}
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
