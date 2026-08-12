import { type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { courses } from "./courses";

// The contents page of a book rather than a row of web cards. Rows are real
// buttons, so Tab, Enter, the focus ring and a screen reader all work without
// being taught to; the arrows only move which one holds the focus.
function CourseList({
  cardRef,
  onOpen,
  onPick,
  picked,
}: {
  cardRef: RefObject<HTMLButtonElement | null>;
  onOpen: (index: number) => void;
  onPick: (index: number) => void;
  picked: number;
}) {
  const { t } = useTranslation();

  return (
    <ul className="course-list">
      {courses.map((item, index) => (
        <li key={item.title}>
          <button
            aria-current={index === picked}
            className="course-card"
            onClick={() => onOpen(index)}
            onFocus={() => onPick(index)}
            ref={index === picked ? cardRef : undefined}
            type="button"
          >
            <span aria-hidden="true" className="course-card__index">{index + 1}</span>
            <span className="course-card__title">{t(item.title)}</span>
            <span className="course-card__blurb">{t(item.blurb)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default CourseList;
