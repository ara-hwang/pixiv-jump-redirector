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
