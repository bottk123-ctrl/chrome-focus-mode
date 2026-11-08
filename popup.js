const minutesInput = document.getElementById("minutes");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const modeSel = document.getElementById("mode");
const sitesEl = document.getElementById("sites");
const sitesLabel = document.getElementById("sitesLabel");
const sitesHint = document.getElementById("sitesHint");
const presetsEl = document.getElementById("presets");

const MIN_MINUTES = 1;
const MAX_MINUTES = 600;

let intervalId = null;
let currentMode = "all";
let saveTimer = null;

const { formatRemaining } = globalThis.FocusModeFormat;

function getRemainingMinutes(endTime) {
  return Math.ceil((endTime - Date.now()) / 60000);
}

function render(endTime) {
  statusEl.textContent = `Осталось: ${formatRemaining(endTime - Date.now())}`;
  statusEl.classList.add("active");
  startBtn.textContent = `Включено (${getRemainingMinutes(endTime)} мин)`;
  stopBtn.disabled = false;
}

function renderIdle() {
  statusEl.textContent = "";
  statusEl.classList.remove("active");
  startBtn.textContent = "Включить фокус";
  stopBtn.disabled = true;
}

function tick() {
  chrome.storage.local.get(["isActive", "endTime"], (data) => {
    if (!data.isActive) {
      clearInterval(intervalId);
      intervalId = null;
      renderIdle();
      return;
    }
    const remaining = getRemainingMinutes(Number(data.endTime) || 0);
    if (remaining <= 0) {
      chrome.storage.local.set({ isActive: false, endTime: 0 });
      clearInterval(intervalId);
      intervalId = null;
      renderIdle();
      return;
    }
    render(Number(data.endTime) || 0);
  });
}

function startTimer() {
  const minutes = clampMinutes(minutesInput.value);
  if (!minutes) {
    statusEl.textContent = `Введите число от ${MIN_MINUTES} до ${MAX_MINUTES}`;
    statusEl.classList.remove("active");
    return;
  }
  minutesInput.value = minutes;

  const endTime = Date.now() + minutes * 60000;
  chrome.storage.local.set({ isActive: true, endTime, lastMinutes: minutes }, () => {
    render(endTime);
    if (!intervalId) intervalId = setInterval(tick, 1000);
  });
}

function stopTimer() {
  chrome.storage.local.set({ isActive: false, endTime: 0 }, () => {
    clearInterval(intervalId);
    intervalId = null;
    renderIdle();
  });
}

function clampMinutes(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.max(n, MIN_MINUTES), MAX_MINUTES);
}

function listKey(mode) {
  return mode === "list" ? "sites" : "allowSites";
}

function parseList(text) {
  return text
    .split(/[\n,]/)
    .map((s) =>
      s
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
    )
    .filter(Boolean);
}

function updateLabels() {
  if (currentMode === "list") {
    sitesLabel.textContent = "Сайты для блокировки (по одному в строке)";
    sitesHint.textContent = "Блокируются только эти сайты и их поддомены.";
  } else {
    sitesLabel.textContent = "Исключения (по одному в строке)";
    sitesHint.textContent = "Блокируется всё, кроме этих сайтов. Оставьте пустым, чтобы блокировать все сайты.";
  }
}

function saveCurrentList() {
  const payload = {};
  payload[listKey(currentMode)] = parseList(sitesEl.value);
  chrome.storage.local.set(payload);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentList, 300);
}

function loadSettings() {
  chrome.storage.local.get(["mode", "sites", "allowSites", "lastMinutes"], (data) => {
    currentMode = data.mode === "list" ? "list" : "all";
    modeSel.value = currentMode;
    const list = currentMode === "list" ? data.sites : data.allowSites;
    sitesEl.value = Array.isArray(list) ? list.join("\n") : "";
    const last = clampMinutes(data.lastMinutes);
    if (last) minutesInput.value = last;
    updateLabels();
  });
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
sitesEl.addEventListener("input", scheduleSave);
minutesInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startTimer();
  }
});

presetsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-minutes]");
  if (!btn) return;
  minutesInput.value = btn.dataset.minutes;
  minutesInput.focus();
});

modeSel.addEventListener("change", () => {
  saveCurrentList();
  currentMode = modeSel.value === "list" ? "list" : "all";
  chrome.storage.local.set({ mode: currentMode }, () => {
    chrome.storage.local.get([listKey(currentMode)], (data) => {
      const list = data[listKey(currentMode)];
      sitesEl.value = Array.isArray(list) ? list.join("\n") : "";
      updateLabels();
    });
  });
});

chrome.storage.local.get(["isActive", "endTime"], (data) => {
  if (data.isActive && Number(data.endTime) > Date.now()) {
    render(Number(data.endTime));
    intervalId = setInterval(tick, 1000);
  } else {
    renderIdle();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (!changes.isActive && !changes.endTime) return;

  chrome.storage.local.get(["isActive", "endTime"], (data) => {
    const active = data.isActive && Number(data.endTime) > Date.now();
    if (active) {
      render(Number(data.endTime));
      if (!intervalId) intervalId = setInterval(tick, 1000);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      renderIdle();
    }
  });
});

loadSettings();
