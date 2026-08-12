import { useEffect, useState, type RefObject } from "react";

// The practice document: what it holds, where the caret sits, and whether it
// has finished appearing. A chapter types its text out rather than swapping it
// silently, so the change of exercise is impossible to miss — and until the
// last character lands, a step that waits for text to be gone must not count
// an empty document as an answer.
export const useDocument = (editorRef: RefObject<HTMLTextAreaElement | null>, text: string) => {
  const [draft, setDraft] = useState("");
  const [caret, setCaret] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const land = (shown: string) => {
      editor.value = shown;
      editor.focus();
      editor.setSelectionRange(shown.length, shown.length);
      setDraft(shown);
      setCaret(shown.length);
      setReady(true);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      land(text);
      return;
    }

    let typed = 0;
    land("");
    setReady(false);
    const timer = setInterval(() => {
      typed = Math.min(typed + 1, text.length);
      editor.value = text.slice(0, typed);
      editor.setSelectionRange(typed, typed);
      if (typed === text.length) {
        clearInterval(timer);
        setDraft(text);
        setReady(true);
      }
    }, 14);
    return () => clearInterval(timer);
  }, [editorRef, text]);

  // Every route the caret can move by: typing, arrows, and selecting.
  const follow = (event: { currentTarget: HTMLTextAreaElement }) => {
    setDraft(event.currentTarget.value);
    setCaret(event.currentTarget.selectionStart);
  };

  return { draft, caret, ready, follow };
};
