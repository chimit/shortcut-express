import { useTranslation } from "react-i18next";
import { comboFor, comboParts, keyName } from "./actions";
import { type Course } from "./courses";
import { type LessonPlatform } from "./platform";

// Movement keys come in opposite pairs. On the sheet a pair is one entry, not
// two nearly identical ones: a course that teaches "a word left" has taught
// "a word right" in the same breath.
const opposite: Record<string, string> = {
  ArrowLeft: "ArrowRight",
  ArrowRight: "ArrowLeft",
  ArrowUp: "ArrowDown",
  ArrowDown: "ArrowUp",
  Home: "End",
  End: "Home",
};

const axes = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

// The course's own summary, drawn in the legends of the platform on screen.
const rowsOf = (course: Course, currentPlatform: LessonPlatform) =>
  course.summary.map(({ keys, withShift }) => {
    const base = comboFor(keys, currentPlatform);
    const combo = withShift ? { ...base, shift: true } : base;
    const codes = opposite[combo.code] ? [combo.code, opposite[combo.code]] : [combo.code];
    return {
      label: `action.${keys}${withShift ? "Shift" : ""}`,
      mods: comboParts(combo, currentPlatform).slice(0, -1),
      codes: codes.sort((a, b) => axes.indexOf(a) - axes.indexOf(b)),
    };
  });

// What the learner takes away: two columns filled top to bottom, so the eye
// reads down one and then the other rather than hopping across.
function Summary({ course, currentPlatform }: { course: Course; currentPlatform: LessonPlatform }) {
  const { t } = useTranslation();
  const rows = rowsOf(course, currentPlatform);

  return (
    <div className="finish">
      <dl
        className="finish__sheet"
        style={{ gridTemplateRows: `repeat(${Math.ceil(rows.length / 2)}, auto)` }}
      >
        {rows.map(({ label, mods, codes }) => (
          <div className="finish__row" key={label}>
            <dt>{t(label)}</dt>
            <dd>
              <span className="key-combo">
                {[...mods, ...codes].map((part, index) => (
                  <span key={part}>
                    {/* Between the modifiers and the key, but not between the
                        two directions of one movement. */}
                    {index > 0 && index <= mods.length && (
                      <span className="key-combo__plus">+</span>
                    )}
                    <kbd className="key-cap">
                      {index < mods.length ? part : keyName(part)}
                    </kbd>
                  </span>
                ))}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default Summary;
