const minutesInput = document.getElementById("minutes");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");

let intervalId = null;

function getRemainingMinutes(endTime) {
  return Math.ceil((endTime - Date.now()) / 60000);
}

function render(remaining) {
  statusEl.textContent = `Осталось: ${remaining} мин`;
  statusEl.classList.add("active");
  startBtn.textContent = `Включено (${remaining} мин)`;
}

function renderIdle() {
  statusEl.textContent = "";
  statusEl.classList.remove("active");
  startBtn.textContent = "Включить фокус";
}

function tick() {
  chrome.storage.local.get(["isActive", "endTime"], (data) => {
    if (!data.isActive) {
      clearInterval(intervalId);
      intervalId = null;
      renderIdle();
      return;
    }
    const remaining = getRemainingMinutes(data.endTime);
    if (remaining <= 0) {
      chrome.storage.local.set({ isActive: false, endTime: 0 });
      clearInterval(intervalId);
      intervalId = null;
      renderIdle();
      return;
    }
    render(remaining);
  });
}

function startTimer() {
  const minutes = parseInt(minutesInput.value, 10);
  if (!minutes || minutes <= 0) {
    statusEl.textContent = "Введите число минут";
    statusEl.classList.remove("active");
    return;
  }

  const endTime = Date.now() + minutes * 60000;
  chrome.storage.local.set({ isActive: true, endTime }, () => {
    render(getRemainingMinutes(endTime));
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

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);

chrome.storage.local.get(["isActive", "endTime"], (data) => {
  if (data.isActive && data.endTime > Date.now()) {
    render(getRemainingMinutes(data.endTime));
    intervalId = setInterval(tick, 1000);
  } else {
    renderIdle();
  }
});
