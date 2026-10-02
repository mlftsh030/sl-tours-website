import { useEffect } from "react";

const MOUNT_ID = "google_translate_element";
const INCLUDED_LANGUAGES = "en,fr,de,es,it,pt,nl,zh-CN,ja,ko,ru,ar,hi,af,zu";

interface GoogleTranslateWindow extends Window {
  googleTranslateElementInit?: () => void;
  google?: {
    translate?: {
      TranslateElement: {
        new (options: Record<string, unknown>, elementId: string): unknown;
        InlineLayout: { SIMPLE: number };
      };
    };
  };
}

let scriptRequested = false;

/**
 * Google Translate wraps translated text nodes in <font> elements behind React's back. When React later
 * removes or inserts next to one of those nodes it throws NotFoundError and the page goes blank. Treat a
 * node that is no longer a child as already removed, and insert without a stale reference node.
 */
function guardReactAgainstTranslateMutations() {
  const proto = Node.prototype;
  const originalRemoveChild = proto.removeChild;
  const originalInsertBefore = proto.insertBefore;

  proto.removeChild = function removeChild<T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  proto.insertBefore = function insertBefore<T extends Node>(this: Node, node: T, reference: Node | null): T {
    if (reference && reference.parentNode !== this) {
      return originalInsertBefore.call(this, node, null) as T;
    }
    return originalInsertBefore.call(this, node, reference) as T;
  };
}

function loadGoogleTranslate() {
  if (scriptRequested) {
    return;
  }
  scriptRequested = true;
  guardReactAgainstTranslateMutations();

  const win = window as GoogleTranslateWindow;
  win.googleTranslateElementInit = () => {
    const TranslateElement = win.google?.translate?.TranslateElement;
    if (!TranslateElement || !document.getElementById(MOUNT_ID)) {
      return;
    }
    new TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: INCLUDED_LANGUAGES,
        layout: TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      },
      MOUNT_ID
    );
  };

  const script = document.createElement("script");
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export function LanguageSelector() {
  useEffect(loadGoogleTranslate, []);
  return <div id={MOUNT_ID} className="language-selector" aria-label="Select language" />;
}
