const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeEntry, parseList, hostMatches, isBlocked } = require("../lib/matching.js");

test("normalizeEntry strips protocol, www and path", () => {
  assert.equal(normalizeEntry("https://www.YouTube.com/watch?v=1"), "youtube.com");
  assert.equal(normalizeEntry("  Example.com  "), "example.com");
  assert.equal(normalizeEntry(""), "");
  assert.equal(normalizeEntry(undefined), "");
});

test("normalizeEntry handles ports, trailing dots, userinfo and fragments", () => {
  assert.equal(normalizeEntry("example.com:8080"), "example.com");
  assert.equal(normalizeEntry("example.com."), "example.com");
  assert.equal(normalizeEntry("sub.example.com."), "sub.example.com");
  assert.equal(normalizeEntry("user:pass@example.com"), "example.com");
  assert.equal(normalizeEntry("http://user:pass@example.com:8080/x"), "example.com");
  assert.equal(normalizeEntry("example.com#frag"), "example.com");
  assert.equal(normalizeEntry("example.com?q=1"), "example.com");
  assert.equal(normalizeEntry("ftp://files.example.com/dir"), "files.example.com");
});

test("hostMatches normalizes the host as well as the entry", () => {
  assert.equal(hostMatches("WWW.Example.com.", "example.com"), true);
  assert.equal(hostMatches("sub.example.com:443", "example.com"), true);
});

test("parseList splits on newlines and commas, normalizes and dedupes", () => {
  assert.deepEqual(parseList("youtube.com, https://www.YouTube.com\n  m.facebook.com  "), [
    "youtube.com",
    "m.facebook.com",
  ]);
  assert.deepEqual(parseList(""), []);
  assert.deepEqual(parseList(null), []);
  assert.deepEqual(parseList("a.com\n\nb.com,"), ["a.com", "b.com"]);
});

test("hostMatches matches exact host and subdomains", () => {
  assert.equal(hostMatches("youtube.com", "youtube.com"), true);
  assert.equal(hostMatches("m.youtube.com", "youtube.com"), true);
  assert.equal(hostMatches("www.youtube.com", "https://youtube.com"), true);
  assert.equal(hostMatches("notyoutube.com", "youtube.com"), false);
  assert.equal(hostMatches("youtube.com", ""), false);
});

test("isBlocked in list mode blocks only listed hosts", () => {
  const data = { mode: "list", sites: ["youtube.com"], allowSites: [] };
  assert.equal(isBlocked("m.youtube.com", data), true);
  assert.equal(isBlocked("example.com", data), false);
});

test("isBlocked in all mode blocks everything except the allowlist", () => {
  const data = { mode: "all", sites: [], allowSites: ["docs.google.com"] };
  assert.equal(isBlocked("youtube.com", data), true);
  assert.equal(isBlocked("docs.google.com", data), false);
  assert.equal(isBlocked("mail.google.com", data), true);
});

test("isBlocked defaults to all mode and tolerates missing lists", () => {
  assert.equal(isBlocked("example.com", {}), true);
  assert.equal(isBlocked("example.com", { mode: "list" }), false);
});

test("hostMatches does not match a domain that merely ends with the entry", () => {
  assert.equal(hostMatches("notyoutube.com", "youtube.com"), false);
  assert.equal(hostMatches("youtube.com.evil.com", "youtube.com"), false);
  assert.equal(hostMatches("sub.youtube.com", "youtube.com"), true);
});

test("isBlocked ignores empty entries and is case-insensitive", () => {
  const data = { mode: "list", sites: ["", "  ", "YouTube.com"] };
  assert.equal(isBlocked("m.youtube.com", data), true);
  assert.equal(isBlocked("example.com", data), false);
});
