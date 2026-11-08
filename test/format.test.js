const test = require("node:test");
const assert = require("node:assert/strict");
const { formatRemaining } = require("../lib/format.js");

test("formatRemaining is empty for zero or negative input", () => {
  assert.equal(formatRemaining(0), "");
  assert.equal(formatRemaining(-1000), "");
  assert.equal(formatRemaining(NaN), "");
});

test("formatRemaining uses whole minutes at one minute and above", () => {
  assert.equal(formatRemaining(60000), "1 мин");
  assert.equal(formatRemaining(90000), "2 мин");
  assert.equal(formatRemaining(25 * 60000), "25 мин");
});

test("formatRemaining switches to mm:ss below one minute", () => {
  assert.equal(formatRemaining(45000), "0:45");
  assert.equal(formatRemaining(1000), "0:01");
  assert.equal(formatRemaining(999), "0:01");
});
