# Coldkey

Coldkey is a desktop course that teaches useful keyboard shortcuts to people who still do most things with a mouse. It is not a shortcut reference and does not begin with a quiz. It is an interactive textbook: explain a familiar problem, demonstrate a faster action, guide the learner through it, and only then ask them to practise without help.

The first release focuses on text navigation and editing because these skills are useful in almost every application and provide the largest benefit with the smallest number of shortcuts.

## Who it is for

The primary learner may know `Cmd/Ctrl+C` and `Cmd/Ctrl+V`, but little else. Coldkey must therefore:

- use everyday language instead of technical documentation language;
- show where keys are on a realistic keyboard, not only name them;
- explain why a shortcut is useful before asking the learner to remember it;
- introduce a small, practical set of shortcuts instead of an exhaustive catalogue;
- make mistakes safe and let the learner retry immediately.

## Teaching model

Each lesson follows the same short loop:

1. Put the learner in a recognisable situation, such as correcting a typo in a document.
2. Acknowledge the mouse-based or repeated-key method they probably use today.
3. Show the faster shortcut in context and highlight the physical keys.
4. Let the learner repeat the action with visual guidance.
5. Remove the guidance and offer a few varied practice attempts.
6. Finish the chapter with one practical task that combines the new skills.

This is guided learning first and recall practice second. A learner should never be dropped into an unexplained quiz.

## Product experience

The main screen is deliberately visual and fits inside the default application window without scrolling:

- a dark application shell keeps the learning document and keyboard visually prominent;
- a large, styled document shows text, a clearly visible caret, and selections;
- a realistic keyboard shows the learner where keys are and highlights presses and suggested combinations;
- OS tabs switch between macOS, Windows, and Linux conventions at any time;
- the current OS is detected automatically but never prevents inspecting another platform;
- the interface supports English and Russian, with English as the fallback language;
- motion must respect the operating system's reduced-motion preference.

Shortcuts, modifier names, keyboard legends, and eventually lesson wording can differ by platform. The same learning objective should feel native on each supported OS rather than mechanically replacing `Cmd` with `Ctrl`.

## Why a desktop application

Browsers are useful for developing the interface, but they cannot reliably own every shortcut Coldkey needs to teach. Some combinations are handled by the browser or operating system first—for example, `Cmd+W` closes a browser tab—so a website cannot provide a consistent training environment for the whole curriculum.

Tauri also gives the project normal desktop distribution paths: the macOS App Store, Microsoft Store, Homebrew, downloadable installers from the project website, and Linux packages. Exact packaging and signing work has not started yet.

## MVP course: text without a mouse

The MVP is one five-chapter foundation course, and all five chapters are
written. It teaches a compact set of actions that work across text editors,
browsers, office applications, and design tools.

Every chapter opens by naming itself and types its practice document out so
the change of exercise is visible. A new shortcut is never demonstrated once
and dropped: it is drilled until the hand has it, and a step keeps its keys lit
only while it is waiting for them.

A step names an intention — "jump a word left", "select all" — and
`src/actions.ts` states once, per platform, what that intention costs in keys.
Lesson text is therefore written a single time and reads natively on macOS,
Windows and Linux, including where the technique genuinely differs rather than
swapping a modifier.

### Chapter 1 — The cursor without a mouse

- recognise the caret and understand where typed text will appear;
- move one character at a time, and jump whole lines with the up and down arrows;
- jump word by word in both directions with `Option+Arrow` on macOS, `Ctrl+Arrow` on Windows and Linux;
- close the chapter by reaching a typo in the first word and correcting it.

### Chapter 2 — Edges of the line and the document

- move to the beginning and end of a line, and drill both;
- move to the beginning and end of the whole document, and drill both;
- meet the first genuinely different technique rather than a swapped modifier: a combination on macOS, a dedicated `Home`/`End` key on Windows and Linux.

### Chapter 3 — Selecting text

- learn the one rule — Shift turns any movement already known into a selection;
- select by character, by word, and out to either end of the line;
- erase a selection with one key;
- select the whole document at once, and clear it in the same two moves.

### Chapter 4 — Editing and undoing

- swap two words that sit in the wrong order: select, copy, cut, tidy the space left behind, move, paste;
- meet copying before cutting, since cutting is copying that also removes;
- undo and redo, including the one place the platforms genuinely disagree — `Shift+Cmd+Z` against `Ctrl+Y`;
- erase whole words without selecting them first.

### Chapter 5 — The workshop

- three faults in one short note and no keys lit up: the learner recalls rather than follows;
- fix a typo, put two words back in order, delete a line that does not belong;
- every task is judged by what the document became, not by which key was pressed.

## Later courses

After the text course is useful on its own, the curriculum can expand in this order:

1. **Windows and applications** — close a window, quit an app, switch apps/windows, and understand the difference between closing and quitting.
2. **Screenshots** — full screen, area, window, clipboard, and the especially fragmented macOS screenshot workflow.
3. **Browser essentials** — focus the address bar, open/close/reopen tabs, switch tabs, find on page, and reload.
4. **Application packs** — small, high-value courses for tools such as Figma, contributed and maintained by their users.

Rare, hard-to-remember shortcuts should not be added merely for completeness. A shortcut belongs in the core curriculum only when it is broadly useful and clearly saves effort.

## Technology

- [Tauri 2](https://tauri.app/) provides the small cross-platform desktop shell and native distribution targets.
- React 19 and TypeScript implement the interactive lesson UI.
- Vite 7 provides the development and build pipeline.
- Plain CSS with custom properties; the keyboard and the document need precise visual treatment that a utility framework only got in the way of.
- `i18next` and `react-i18next` provide UI localization.
- Tauri's OS plugin detects the platform and system locale.

All application and lesson code is intended to remain TypeScript unless native functionality genuinely requires a small Rust command.

## Localization

English is the source and fallback language. Russian is supported from the beginning so localization remains an architectural constraint instead of a later rewrite.

Translation files live in `src/locales/en.json` and `src/locales/ru.json`. Visible interface copy should use translation keys rather than be embedded in React components. On startup, Coldkey uses:

1. the learner's saved language choice;
2. the OS locale reported by Tauri (or the browser locale during web development);
3. English as the fallback.

The language can be changed at runtime from the header. Adding a language means adding its JSON resource and registering it in `src/i18n.ts`; lesson-content localization will follow the same language-code convention.

## Extensibility

Application-specific shortcut packs should eventually be data, not compiled UI code. The planned contribution format is a versioned JSON schema with one pack per application or operating system, for example:

```text
content/
  macos.json
  windows.json
  safari.json
  figma.json
```

A pack will describe metadata, supported platforms, lessons, steps, expected key combinations, and localized text. The schema and loader do not exist yet; they should be designed from the working text course instead of guessed in advance.

Contributed packs should:

- teach a small set of high-value shortcuts;
- include verified mappings for every claimed platform;
- explain actions in beginner-friendly language;
- avoid overriding operating-system-reserved combinations;
- include all required English strings and may add other locales.

## Development

Prerequisites are Node.js, npm, Rust, and the platform dependencies required by Tauri.

```bash
npm install
npm run tauri dev
```

Useful checks:

```bash
npm run build
cd src-tauri && cargo check --locked
```

The Vite-only interface can be opened with `npm run dev`, but native platform and locale behaviour must also be verified through `npm run tauri dev`.

## Current status

Coldkey is a working prototype of the whole MVP course. The application shell,
platform-specific keyboard, responsive no-scroll layout, English/Russian
localization, native text editing, caret and selection feedback, physical-key
highlighting, the lesson engine, and all five chapters exist.

A step is judged either by the shortcut performed or by what the document
became — corrected text, deleted text, an empty document, or the caret arriving
somewhere — never by both at once.

Still to be built: progress storage, content-pack loading, packaging and
signing, and automated checks. The lesson data model now has five real chapters
behind it, which is the evidence a content-pack schema should be designed
from.

## Open-source status

The project is intended to be open source and accept community shortcut packs. A license has not yet been selected; one must be added before public distribution or external contributions are accepted.
