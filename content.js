const QUOTES = [
  "Дисциплина — это выбор между тем, чего ты хочешь сейчас, и тем, чего хочешь больше всего.",
  "Успех — это сумма маленьких усилий, повторяемых изо дня в день.",
  "Не жди подходящего момента. Возьми момент и сделай его подходящим.",
  "Ты всегда можешь вернуться к работе. Начни с одной минуты.",
  "Сфокусируйся на цели, а не на отвлечениях.",
  "Тот, кто владеет своим временем, владеет своей жизнью.",
  "Сделай сегодня то, что приблизит тебя к мечте.",
  "Терпение и труд всё перетрут."
];

function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

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

function mountOverlay(overlay) {
  if (document.body) {
    document.body.innerHTML = "";
    document.body.appendChild(overlay);
    return;
  }
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (!document.body) return;
      document.body.innerHTML = "";
      document.body.appendChild(overlay);
    },
    { once: true }
  );
}

function showBlockScreen() {
  if (document.getElementById("focus-mode-block")) return;

  document.documentElement.classList.add("focus-mode-active");

  const overlay = document.createElement("div");
  overlay.id = "focus-mode-block";
  overlay.setAttribute("role", "alert");
  overlay.innerHTML = `
    <div class="focus-mode-content">
      <h1>Вернись к работе!</h1>
      <p class="focus-mode-quote">«${randomQuote()}»</p>
      <p class="focus-mode-timer" id="focus-mode-timer"></p>
    </div>
  `;
  mountOverlay(overlay);
  updateBlockTimer();
  startPolling();
}

function updateBlockTimer() {
  const el = document.getElementById("focus-mode-timer");
  if (!el) return;
  chrome.storage.local.get(["endTime"], (data) => {
    const endTime = Number(data.endTime) || 0;
    if (!endTime) {
      el.textContent = "";
      return;
    }
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 60000));
    el.textContent = `Осталось: ${remaining} мин`;
  });
}

function blockIfActive() {
  const host = location.hostname;
  if (!host) return;

  chrome.storage.local.get(["isActive", "endTime", "mode", "sites", "allowSites"], (data) => {
    const active = data.isActive && Date.now() < (Number(data.endTime) || 0);
    if (active && isBlocked(host, data)) {
      showBlockScreen();
    } else if (document.getElementById("focus-mode-block")) {
      unblock();
    }
  });
}

let pollId = null;

function startPolling() {
  if (pollId) return;
  pollId = setInterval(() => {
    chrome.storage.local.get(["isActive", "endTime"], (data) => {
      const active = data.isActive && Date.now() < (Number(data.endTime) || 0);
      if (!active) {
        if (data.isActive) chrome.storage.local.set({ isActive: false, endTime: 0 });
        unblock();
        return;
      }
      updateBlockTimer();
    });
  }, 1000);
}

function stopPolling() {
  if (!pollId) return;
  clearInterval(pollId);
  pollId = null;
}

function unblock() {
  stopPolling();
  if (document.getElementById("focus-mode-block")) location.reload();
}

blockIfActive();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.isActive || changes.endTime || changes.mode || changes.sites || changes.allowSites) {
    blockIfActive();
  }
});
