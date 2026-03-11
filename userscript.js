// ==UserScript==
// @name        Pixiv Redirector
// @namespace   Violentmonkey Scripts
// @match       *://www.pixiv.net/*
// @grant       none
// @version     1.0
// @author      ara-hwang
// @description 2026. 3. 11. 오후 9:38:31
// @run-at      document-start
// ==/UserScript==

(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("url");

    if (!target) return;

    const decodedUrl = decodeURIComponent(target);

    window.location.replace(decodedUrl);
  } catch (error) {
    console.error("Failed Pixiv Jump Redirect:", error);
  }
})();
