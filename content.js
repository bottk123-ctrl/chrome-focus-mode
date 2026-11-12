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
const { formatRemaining } = globalThis.FocusModeFormat;

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
let endTime = 0;
let tickId = null;

function mountOverlay(overlay) {
  if (document.body) {
    document.body.appendChild(overlay);
    return;
  }
  overlayPending = true;
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (!overlayPending) return;
      overlayPending = false;
      if (document.body) document.body.appendChild(overlay);
      renderTimer();
    },
    { once: true }
  );
}

function renderTimer() {
  const el = document.getElementById("focus-mode-timer");
  if (!el) return;
  el.textContent = endTime ? `Осталось: ${formatRemaining(endTime - Date.now())}` : "";
}

function showBlockScreen(end) {
  endTime = end;
  if (document.getElementById("focus-mode-block")) {
    renderTimer();
    return;
  }
  if (overlayPending) return;

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
  renderTimer();
  startTicking();
}

function startTicking() {
  if (tickId) return;
  tickId = setInterval(tick, 1000);
}

function stopTicking() {
  if (!tickId) return;
  clearInterval(tickId);
  tickId = null;
}

// The countdown is computed from the stored end time, so it no longer needs to
// read chrome.storage every second. Storage is only read on session changes.
function tick() {
  if (!endTime || Date.now() >= endTime) {
    unblock(true);
    return;
  }
  renderTimer();
}

function blockIfActive() {
  const host = location.hostname;
  if (!host) return;

  chrome.storage.local.get(["isActive", "endTime", "mode", "sites", "allowSites"], (data) => {
    const active = data.isActive && Date.now() < (Number(data.endTime) || 0);
    if (active && isBlocked(host, data)) {
      showBlockScreen(Number(data.endTime) || 0);
    } else {
      unblock(false);
    }
  });
}

function unblock(expired) {
  overlayPending = false;
  stopTicking();
  endTime = 0;
  const overlay = document.getElementById("focus-mode-block");
  if (overlay) overlay.remove();
  if (document.documentElement) {
    document.documentElement.classList.remove("focus-mode-active");
  }
  if (expired) {
    chrome.storage.local.get(["isActive"], (data) => {
      if (data.isActive) chrome.storage.local.set({ isActive: false, endTime: 0 });
    });
  }
}

blockIfActive();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.isActive || changes.endTime || changes.mode || changes.sites || changes.allowSites) {
    blockIfActive();
  }
});
