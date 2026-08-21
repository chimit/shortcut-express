import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { useBrowser } from "./useBrowser";
import "./Browser.css";

type BrowserHandle = ReturnType<typeof useBrowser>;

// An empty tab has no page behind it, so it borrows the words a real browser
// puts there while it waits for an address.
const pageOf = (page: number) => (page < 0 ? "browser.blank" : `browser.page${page}`);

// The tab strip sits where the window's title would be, because in a browser
// that is exactly where it sits. The chapter number is not repeated there: the
// narrator announces the chapter, and the bar along the top of the page counts
// the steps.
//
// A list rather than a tablist: these tabs cannot be clicked or tabbed to, and
// the tab role would promise a screen reader an interaction that is not there.
// What they honestly are is a list of what is open, with one of them current.
export function BrowserTabs({ browser }: { browser: BrowserHandle }) {
  const { t } = useTranslation();
  const { tabs, active } = browser.state;

  return (
    <ul className="browser-tabs" aria-label={t("browser.tabsLabel")}>
      {tabs.map((page, index) => (
        <li
          aria-current={index === active}
          className="browser-tabs__tab"
          data-active={index === active}
          key={`${index}-${page}`}
        >
          <span className="browser-tabs__dot" aria-hidden="true" />
          <span className="browser-tabs__title">{t(`${pageOf(page)}.title`)}</span>
        </li>
      ))}
    </ul>
  );
}

// Drawn rather than typed, for the same reason the window controls are: a
// glyph's ink sits wherever the font puts it in its box, and ⟳ in particular
// spins about a point that is not its own centre. An SVG turns about the
// middle of its viewBox.
const icon = (path: string, head?: string) => (
  <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round"
       strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 16 16" width="15">
    <path d={path} />
    {head && <path d={head} fill="currentColor" stroke="none" />}
  </svg>
);

const backIcon = icon("M9.8 3.6 5.4 8l4.4 4.4");
const forwardIcon = icon("M6.2 3.6 10.6 8l-4.4 4.4");
// An almost-closed ring with the arrowhead sitting in its gap.
const reloadIcon = icon("M10.4 3.84A4.8 4.8 0 1 1 5.6 3.84", "M8.2 2.34 6.45 5.31 4.75 2.37Z");

// Cuts the page into runs of plain text and runs that matched, numbering the
// matches as it goes so the find bar can call one of them the current one.
const mark = (text: string, term: string) => {
  if (!term) return [{ text, at: -1 }];
  const parts: { text: string; at: number }[] = [];
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  let from = 0;
  let at = 0;
  for (let found = lower.indexOf(needle); found !== -1; found = lower.indexOf(needle, from)) {
    if (found > from) parts.push({ text: text.slice(from, found), at: -1 });
    parts.push({ text: text.slice(found, found + needle.length), at: at++ });
    from = found + needle.length;
  }
  parts.push({ text: text.slice(from), at: -1 });
  return parts;
};

function Browser({ browser, onType }: { browser: BrowserHandle; onType: (value: string) => void }) {
  const { t } = useTranslation();
  const { state, pageRef, addressRef, findRef, matchesRef, navigate, found } = browser;
  const [term, setTerm] = useState("");
  const page = state.tabs[state.active];
  const key = pageOf(page);
  const body = page < 0 ? "" : t(`${key}.body`);
  const url = page < 0 ? "" : t(`${key}.url`);
  const parts = mark(body, term);
  const matches = parts.filter((part) => part.at >= 0).length;
  matchesRef.current = matches;

  // Closing the find bar unmarks the page and forgets what was typed: a browser
  // that left the page yellow after you dismissed the search, or reopened it
  // with an empty field over old marks, would be one nobody would put up with.
  useEffect(() => {
    if (!state.findOpen) setTerm("");
  }, [state.findOpen]);

  // A find that lands off screen has not found anything the reader can see.
  useEffect(() => {
    pageRef.current?.querySelector("[data-current='true']")?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [pageRef, state.hit]);

  return (
    <div className="browser">
      <div className="browser__toolbar">
        <div className="browser__history" aria-hidden="true">
          <span className="browser__arrow" data-on={state.at > 0}>{backIcon}</span>
          <span className="browser__arrow" data-on={state.at < state.history.length - 1}>{forwardIcon}</span>
          <span className="browser__arrow browser__arrow--reload" data-spin={state.reloading}>{reloadIcon}</span>
        </div>
        <input
          aria-label={t("browser.addressLabel")}
          className="browser__address"
          defaultValue={url}
          key={`${state.active}-${page}-${state.history.length}`}
          onInput={(event) => onType(event.currentTarget.value)}
          onKeyDown={(event) => {
            // Enter goes to the page, but only if the address was actually
            // written over. Enter is also how the lesson moves on, and a step
            // that put the caret here without asking for a new address must be
            // able to end without the page changing underfoot.
            const written = event.currentTarget.value.trim();
            if (event.code === "Enter" && written && written !== url) navigate();
          }}
          placeholder={t("browser.addressPlaceholder")}
          ref={addressRef}
          spellCheck={false}
        />
      </div>

      {state.findOpen && (
        <div className="browser__find">
          <input
            aria-label={t("browser.findLabel")}
            className="browser__find-field"
            onInput={(event) => {
              const value = event.currentTarget.value;
              onType(value);
              setTerm(value);
              found(mark(body, value).filter((part) => part.at >= 0).length);
            }}
            placeholder={t("browser.findPlaceholder")}
            ref={findRef}
            spellCheck={false}
          />
          <span className="browser__find-count">
            {matches ? t("browser.hitOf", { current: state.hit + 1, total: matches }) : t("browser.noHits")}
          </span>
        </div>
      )}

      <div className="browser__page" ref={pageRef} tabIndex={-1} data-loading={state.reloading}>
        {page < 0 ? (
          <p className="browser__empty">{t("browser.blank.body")}</p>
        ) : (
          <>
            <h1>{t(`${key}.title`)}</h1>
            {/* The prose keeps its own line breaks rather than being cut into
                elements: a match can then be numbered straight through the
                page, paragraphs and all. */}
            <div className="browser__body">
              {parts.map((part, index) =>
                part.at < 0 ? (
                  part.text
                ) : (
                  <mark
                    className="browser__hit"
                    data-current={part.at === state.hit}
                    key={index}
                  >
                    {part.text}
                  </mark>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Browser;
