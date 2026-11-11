(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FocusModeFormat = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function formatRemaining(ms) {
    if (!(ms > 0)) return "";
    if (ms >= 60000) {
      return `${Math.ceil(ms / 60000)} мин`;
    }
    const total = Math.ceil(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function formatBadge(ms) {
    if (!(ms > 0)) return "";
    const seconds = Math.ceil(ms / 1000);
    if (seconds >= 60) return `${Math.ceil(seconds / 60)}м`;
    return `${seconds}с`;
  }

  return { formatRemaining, formatBadge };
});
