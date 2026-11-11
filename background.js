importScripts("lib/format.js");

const { formatBadge } = globalThis.FocusModeFormat;

const BADGE_COLOR = "#3d6cff";
const BADGE_ALARM = "focus-mode-badge";
const END_ALARM = "focus-mode-end";

function refreshBadge() {
  chrome.storage.local.get(["isActive", "endTime"], (data) => {
    const endTime = Number(data.endTime) || 0;
    const active = !!data.isActive && Date.now() < endTime;
    if (!active) {
      chrome.action.setBadgeText({ text: "" });
      chrome.alarms.clear(END_ALARM);
      return;
    }
    chrome.action.setBadgeText({ text: formatBadge(endTime - Date.now()) });
    chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    chrome.alarms.create(END_ALARM, { when: endTime });
  });
}

function ensureAlarm() {
  chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 1 });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  refreshBadge();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
  refreshBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BADGE_ALARM || alarm.name === END_ALARM) refreshBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.isActive || changes.endTime) refreshBadge();
});
