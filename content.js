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

const { isBlocked } = globalThis.FocusModeMatching;

function markActive() {
  const root = document.documentElement;
  if (root) {
    root.classList.add("focus-mode-active");
    return;
  }
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (document.documentElement) {
        document.documentElement.classList.add("focus-mode-active");
      }
    },
    { once: true }
  );
}

let overlayPending = false;

function mountOverlay(overlay) {
  if (document.body) {
    document.body.appendChild(overlay);
    return;
  }
  overlayPending = true;
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (!overlayPending || !document.body) return;
      overlayPending = false;
      document.body.appendChild(overlay);
    },
    { once: true }
  );
}

function showBlockScreen() {
  if (overlayPending || document.getElementById("focus-mode-block")) return;

  markActive();

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

function formatRemaining(ms) {
  if (ms >= 60000) {
    return `${Math.ceil(ms / 60000)} мин`;
  }
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
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
    el.textContent = `Осталось: ${formatRemaining(endTime - Date.now())}`;
  });
}

function blockIfActive() {
  const host = location.hostname;
  if (!host) return;

  chrome.storage.local.get(["isActive", "endTime", "mode", "sites", "allowSites"], (data) => {
    const active = data.isActive && Date.now() < (Number(data.endTime) || 0);
    if (active && isBlocked(host, data)) {
      showBlockScreen();
    } else if (overlayPending || document.getElementById("focus-mode-block")) {
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
  overlayPending = false;
  stopPolling();
  const overlay = document.getElementById("focus-mode-block");
  if (overlay) overlay.remove();
  if (document.documentElement) {
    document.documentElement.classList.remove("focus-mode-active");
  }
}

blockIfActive();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.isActive || changes.endTime || changes.mode || changes.sites || changes.allowSites) {
    blockIfActive();
  }
});
