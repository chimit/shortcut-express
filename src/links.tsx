import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

export const githubUrl = "https://github.com/chimit/shortcut-express";
export const kofiUrl = "https://ko-fi.com/chimit";

// Two errands the application itself cannot run: the source and the tip jar
// both live in a browser, and the webview refuses to become one.
export const openExternal = (url: string) => {
  if (isTauri()) {
    // A webview that cannot hand the URL on has nowhere to report it either.
    openUrl(url).catch(() => {});
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export const githubMark = (
  <svg aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 16 16" width="15">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

// Ko-fi's own mark is a cup, and a cup is what the button has room for.
export const kofiMark = (
  <svg
    aria-hidden="true"
    fill="none"
    height="15"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.4"
    viewBox="1.8 1.3 12.4 12.4"
    width="15"
  >
    <path d="M2.5 5.5h9v4a3.5 3.5 0 0 1-3.5 3.5H6a3.5 3.5 0 0 1-3.5-3.5v-4Z" />
    <path d="M11.5 6.5h1a2 2 0 1 1 0 4h-1" />
    <path d="M5.5 2v1.5M8.5 2v1.5" />
  </svg>
);

// The support button says what it does in words; the mark beside it only has
// to read as warmth, which a cup cannot do away from Ko-fi's own name.
export const heartMark = (
  <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
    <path d="M8 14.25S1.5 10.5 1.5 6.06A3.56 3.56 0 0 1 8 4.06a3.56 3.56 0 0 1 6.5 2c0 4.44-6.5 8.19-6.5 8.19Z" />
  </svg>
);
