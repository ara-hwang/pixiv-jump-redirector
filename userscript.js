// ==UserScript==
// @name        Pixiv Redirector
// @namespace   Violentmonkey Scripts
// @match       *://www.pixiv.net/*
// @match       *://www.pixiv.net/jump.php*
// @grant       none
// @inject-into content
// @version     1.2
// @author      ara-hwang
// @description Skip pixiv jump.php and open the destination URL
// @run-at      document-start
// ==/UserScript==

(() => {
  const JUMP_PATH = /\/jump\.php$/i;

  /** @param {string} value */
  function decodeOnce(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  /** @param {string | null | undefined} value */
  function asHttpUrl(value) {
    if (!value) return null;
    const decoded = decodeOnce(value);
    if (!/^https?:\/\//i.test(decoded)) return null;
    return decoded;
  }

  /**
   * jump.php?url=https%3A%2F%2F... 와 jump.php?https%3A%2F%2F... 모두 처리
   * @param {string} href
   */
  function extractJumpTarget(href) {
    try {
      const url = new URL(href, location.origin);
      if (!JUMP_PATH.test(url.pathname)) return null;

      const fromParam = asHttpUrl(url.searchParams.get("url"));
      if (fromParam) return fromParam;

      const raw = url.search.slice(1);
      if (!raw) return null;
      const first = raw.split("&")[0];
      if (first && /^https?(%3A|:\/\/)/i.test(first)) {
        return asHttpUrl(first);
      }
      return null;
    } catch {
      return null;
    }
  }

  function redirectJumpPage() {
    const target = extractJumpTarget(location.href);
    if (!target) return false;
    location.replace(target);
    return true;
  }

  function followConfirmationLink() {
    if (redirectJumpPage()) return;
    const anchor = document.querySelector('a[href^="http"]');
    if (
      anchor instanceof HTMLAnchorElement &&
      !/(^|\.)pixiv\.net$/i.test(anchor.hostname)
    ) {
      location.replace(anchor.href);
    }
  }

  if (JUMP_PATH.test(location.pathname)) {
    if (redirectJumpPage()) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", followConfirmationLink, {
        once: true,
      });
    } else {
      followConfirmationLink();
    }
    return;
  }

  /** @param {ParentNode | Element} root */
  function rewriteJumpLinks(root) {
    /** @type {Iterable<Element>} */
    const nodes =
      root instanceof Element && root.matches?.("a[href*='jump.php']")
        ? [root]
        : (root.querySelectorAll?.("a[href*='jump.php']") ?? []);
    for (const node of nodes) {
      if (!(node instanceof HTMLAnchorElement)) continue;
      const target = extractJumpTarget(node.href);
      if (!target || node.href === target) continue;
      node.href = target;
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const clicked = event.target;
      if (!(clicked instanceof Element)) return;
      const anchor = clicked.closest("a[href*='jump.php']");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = extractJumpTarget(anchor.href);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (
        anchor.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        window.open(target, "_blank", "noopener,noreferrer");
      } else {
        location.assign(target);
      }
    },
    true
  );

  const startObserving = () => {
    rewriteJumpLinks(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            rewriteJumpLinks(/** @type {Element} */ (node));
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  if (document.documentElement) startObserving();
  else document.addEventListener("DOMContentLoaded", startObserving, { once: true });
})();
