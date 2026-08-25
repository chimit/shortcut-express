import { useTranslation } from "react-i18next";
import { comboFor, comboShort } from "./actions";
import type { LessonPlatform } from "./platform";
import { files, type useAppStage } from "./useAppStage";
import "./Dialog.css";

type StageHandle = ReturnType<typeof useAppStage>;

// A tick drawn rather than typed, for the same reason the window controls are:
// ✓ sits on the text baseline and will not centre inside a box.
const check = (
  <svg aria-hidden="true" fill="none" height="12" stroke="currentColor" strokeLinecap="round"
       strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 14 14" width="12">
    <path d="M2.5 7.4 5.6 10.5 11.5 3.9" />
  </svg>
);

// The two keys every dialog ends with, printed on the buttons they belong to
// and read off the same table the lessons are written from — a button that
// promised a key the step does not accept would be worse than no button.
//
// They do not answer a click: this course is about the keys, and a dialog that
// could also be dismissed with the mouse would teach that instead.
function Buttons({ accept, currentPlatform }: { accept: string; currentPlatform: LessonPlatform }) {
  const { t } = useTranslation();
  const key = (action: "acceptDialog" | "cancelDialog") =>
    comboShort(comboFor(action, currentPlatform), currentPlatform);

  return (
    <div className="dialog__buttons">
      <span className="dialog__button">
        {t("app.cancel")}
        <kbd className="dialog__key">{key("cancelDialog")}</kbd>
      </span>
      <span className="dialog__button dialog__button--default">
        {t(accept)}
        <kbd className="dialog__key">{key("acceptDialog")}</kbd>
      </span>
    </div>
  );
}

function Dialog({
  stage,
  name,
  text,
  onType,
  currentPlatform,
}: {
  stage: StageHandle;
  name: string;
  text: string;
  onType: (value: string) => void;
  currentPlatform: LessonPlatform;
}) {
  const { t } = useTranslation();
  const { state, nameRef, checkRef, panelRef } = stage;
  if (!state.dialog) return null;

  return (
    <div className="dialog__over">
      {/* Named by its own heading rather than by a copy of it: only one dialog
          is ever open, so the id can be a constant. */}
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <p className="dialog__title" id="dialog-title">{t(`app.${state.dialog}.title`)}</p>

        {state.dialog === "save" && (
          <>
            <label className="dialog__field" data-on={state.field === 0}>
              <span className="dialog__label">{t("app.save.name")}</span>
              <input
                className="dialog__input"
                // Whatever the title bar is calling it, so saving a file
                // opened from the list offers its name rather than "Untitled".
                defaultValue={name}
                key={state.nonce}
                onInput={(event) => onType(event.currentTarget.value)}
                ref={nameRef}
                spellCheck={false}
              />
            </label>
            {/* A real checkbox, so Space lands on something that was already
                focusable and a screen reader is told what it is. What it does
                is ours, because the lesson is the keystroke. */}
            <label className="dialog__check" data-on={state.field === 1}>
              <input
                checked={state.copy}
                className="dialog__box"
                readOnly
                ref={checkRef}
                type="checkbox"
              />
              <span aria-hidden="true" className="dialog__tick">{state.copy && check}</span>
              <span>{t("app.save.copy")}</span>
            </label>
            <Buttons accept="app.save.accept" currentPlatform={currentPlatform} />
          </>
        )}

        {state.dialog === "open" && (
          <>
            {/* The arrows the first course opened with, doing the job they do
                in every list on every system. */}
            <ul className="dialog__list" aria-label={t("app.open.title")}>
              {files.map((file, index) => (
                <li
                  aria-current={index === state.pick}
                  className="dialog__file"
                  data-on={index === state.pick}
                  key={file}
                >
                  <span aria-hidden="true" className="dialog__paper" />
                  {t(`app.${file}.name`)}
                </li>
              ))}
            </ul>
            <Buttons accept="app.open.accept" currentPlatform={currentPlatform} />
          </>
        )}

        {state.dialog === "print" && (
          <>
            <div aria-hidden="true" className="dialog__sheet">
              <p className="dialog__sheet-text">{text}</p>
            </div>
            <p className="dialog__note">{t("app.print.note")}</p>
            <Buttons accept="app.print.accept" currentPlatform={currentPlatform} />
          </>
        )}
      </div>
    </div>
  );
}

export default Dialog;
