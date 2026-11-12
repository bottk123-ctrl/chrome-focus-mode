(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FocusModeMatching = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalizeEntry(entry) {
    const raw = String(entry == null ? "" : entry).trim().toLowerCase();
    if (!raw) return "";
    return raw
      .replace(/^[a-z][a-z0-9+.-]*:\/\//, "") // scheme (http, https, ftp, ...)
      .replace(/^[^/?#]*@/, "") // userinfo (user:pass@)
      .replace(/^www\./, "")
      .split(/[/?#]/, 1)[0] // path, query and fragment
      .replace(/:\d+$/, "") // port
      .replace(/\.+$/, ""); // trailing dots (FQDN form)
  }

  function parseList(text) {
    const entries = String(text == null ? "" : text)
      .split(/[\n,]/)
      .map(normalizeEntry)
      .filter(Boolean);
    return [...new Set(entries)];
  }

  function hostMatches(host, entry) {
    const e = normalizeEntry(entry);
    if (!e) return false;
    const h = normalizeEntry(host);
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

  return { normalizeEntry, parseList, hostMatches, isBlocked };
});
