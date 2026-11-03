(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FocusModeMatching = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalizeEntry(entry) {
    return String(entry || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
  }

  function hostMatches(host, entry) {
    const e = normalizeEntry(entry);
    if (!e) return false;
    const h = String(host || "").toLowerCase();
    return h === e || h.endsWith("." + e);
  }

  function isBlocked(host, data) {
    const mode = data.mode === "list" ? "list" : "all";
    const sites = Array.isArray(data.sites) ? data.sites : [];
    const allowSites = Array.isArray(data.allowSites) ? data.allowSites : [];

    if (mode === "list") {
      return sites.some((e) => hostMatches(host, e));
    }
    return !allowSites.some((e) => hostMatches(host, e));
  }

  return { normalizeEntry, hostMatches, isBlocked };
});
