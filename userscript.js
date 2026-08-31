// ==UserScript==
// @name        Pixiv Redirector
// @namespace   Violentmonkey Scripts
// @match       *://www.pixiv.net/*
// @match       *://www.pixiv.net/jump.php*
// @grant       none
// @inject-into content
// @version     1.3
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
      anchor &&
      anchor.tagName === "A" &&
      !/(^|\.)pixiv\.net$/i.test(/** @type {HTMLAnchorElement} */ (anchor).hostname)
    ) {
      location.replace(/** @type {HTMLAnchorElement} */ (anchor).href);
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

  /** @param {EventTarget | null} node */
  function asElement(node) {
    if (!node || /** @type {Node} */ (node).nodeType !== 1) return null;
    return /** @type {Element} */ (node);
  }

  /** @param {ParentNode | Element | null} root */
  function rewriteJumpLinks(root) {
    if (!root) return;
    const rootEl = asElement(/** @type {EventTarget} */ (root));
    /** @type {Element[]} */
    const nodes = [];
    if (rootEl?.matches?.("a[href*='jump.php']")) nodes.push(rootEl);
    if (root.querySelectorAll) {
      nodes.push(...root.querySelectorAll("a[href*='jump.php']"));
    }
    for (const node of nodes) {
      if (node.tagName !== "A") continue;
      const anchor = /** @type {HTMLAnchorElement} */ (node);
      const target = extractJumpTarget(anchor.href);
      if (!target || anchor.href === target) continue;
      // preventDefault + window.open 은 팝업 차단 시 클릭이 아무 것도 안 함
      // href만 바꿔 브라우저 기본 이동(target=_blank 포함)을 그대로 쓴다
      anchor.href = target;
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const clicked = asElement(event.target) || asElement(event.target && /** @type {Node} */ (event.target).parentElement);
      if (!clicked?.closest) return;
      const anchor = clicked.closest("a[href*='jump.php']");
      if (!anchor || anchor.tagName !== "A") return;
      const target = extractJumpTarget(/** @type {HTMLAnchorElement} */ (anchor).href);
      if (!target) return;
      /** @type {HTMLAnchorElement} */ (anchor).href = target;
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
