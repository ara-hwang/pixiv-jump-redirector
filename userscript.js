// ==UserScript==
// @name        Pixiv Redirector
// @namespace   Violentmonkey Scripts
// @match       *://www.pixiv.net/*
// @grant       none
// @version     1.1
// @author      ara-hwang
// @description 2026. 3. 11. 오후 9:38:31
// @run-at      document-start
// ==/UserScript==

(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    /** @type {string | null} */
    let target = params.get("url");

    // ?url= 없이 첫 토큰 전체가 인코딩된 절대 URL인 경우
    // 예: 게시물 링크 클릭시 jump.php?https%3A%2F%2Fexample.com%2F... 식으로 됨
    if (!target) {
      const raw = window.location.search.slice(1);
      if (!raw) return;
      const first = raw.split("&")[0];
      if (first && /^https(%3A|:\/\/)/i.test(first)) {
        target = first;
      }
    }

    if (!target) return;

    const decodedUrl = decodeURIComponent(target);

    window.location.replace(decodedUrl);
  } catch (error) {
    console.error("Failed Pixiv Jump Redirect:", error);
  }
})();
