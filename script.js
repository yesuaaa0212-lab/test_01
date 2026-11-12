const wheel = document.querySelector("#wheel");
const wheelLabels = document.querySelector("#wheel-labels");
const wheelHint = document.querySelector("#wheel-hint");
const spinButton = document.querySelector("#spin-button");
const resultElement = document.querySelector("#result");
const addForm = document.querySelector("#add-form");
const itemInput = document.querySelector("#item-input");
const itemList = document.querySelector("#item-list");
const itemCount = document.querySelector("#item-count");
const emptyState = document.querySelector("#empty-state");
const addButton = addForm.querySelector("button");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeLabel = document.querySelector("#theme-label");
const themeColor = document.querySelector("#theme-color");

const colors = ["#7765d1", "#f28a78", "#39a99a", "#f1b94e", "#5591d1", "#d56e9c", "#85af62", "#e78649"];
const items = ["치킨", "피자", "초밥", "떡볶이"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const THEME_STORAGE_KEY = "roulette-theme";

let isSpinning = false;
let currentRotation = 0;
let finishTimer = null;
let selectedItem = "";

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", isDark ? "화이트 모드로 전환" : "다크 모드로 전환");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeLabel.textContent = isDark ? "화이트 모드" : "다크 모드";
  themeColor.content = isDark ? "#171927" : "#f5f6fb";
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("테마 설정을 불러오지 못했습니다.", error);
    return "light";
  }
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.error("테마 설정을 저장하지 못했습니다.", error);
  }
}

function render() {
  const count = items.length;
  const segmentSize = count ? 360 / count : 360;
  const gradientStops = [];
  const labels = [];
  const listItems = [];

  items.forEach((item, index) => {
    const start = index * segmentSize;
    const end = (index + 1) * segmentSize;
    const color = colors[index % colors.length];
    const middle = start + segmentSize / 2;

    gradientStops.push(`${color} ${start}deg ${end}deg`);

    const label = document.createElement("span");
    label.className = "wheel-label";
    label.textContent = item;
    label.style.setProperty("--label-angle", `${middle}deg`);
    label.style.setProperty("--reverse-angle", `${-middle}deg`);
    labels.push(label);

    const row = document.createElement("li");
    row.className = "item-row";
    const dot = document.createElement("span");
    dot.className = "item-dot";
    dot.style.backgroundColor = color;
    dot.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item;
    const removeButton = document.createElement("button");
    removeButton.className = "delete-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `${item} 삭제`);
    removeButton.disabled = isSpinning;
    removeButton.addEventListener("click", () => removeItem(index));
    row.append(dot, name, removeButton);
    listItems.push(row);
  });

  wheel.style.background = count
    ? `conic-gradient(from 0deg, ${gradientStops.join(", ")})`
    : "#f0eff5";
  wheel.setAttribute(
    "aria-label",
    count ? `룰렛 항목 ${count}개: ${items.join(", ")}` : "항목을 추가해 룰렛을 만들어 보세요"
  );
  wheelLabels.replaceChildren(...labels);
  itemList.replaceChildren(...listItems);
  itemCount.textContent = `${count}개`;
  emptyState.hidden = count > 0;
  spinButton.disabled = count < 2 || isSpinning;
  addButton.disabled = isSpinning;
  itemInput.disabled = isSpinning;
  wheelHint.textContent = count < 2
    ? "항목을 2개 이상 추가하면 돌릴 수 있어요."
    : isSpinning ? "룰렛이 돌아가고 있어요!" : "가운데 버튼을 눌러 룰렛을 돌려 보세요.";

  updateLabelRadius();
}

function updateLabelRadius() {
  const radius = wheel.clientWidth * 0.32;
  wheelLabels.querySelectorAll(".wheel-label").forEach((label) => {
    label.style.setProperty("--label-radius", `${radius}px`);
  });
}

function resetResult() {
  selectedItem = "";
  resultElement.textContent = "룰렛을 돌려 보세요!";
}

function addItem(value) {
  const item = value.trim();
  if (!item || isSpinning) return;
  items.push(item);
  resetResult();
  render();
}

function removeItem(index) {
  if (isSpinning || index < 0 || index >= items.length) return;
  items.splice(index, 1);
  resetResult();
  render();
}

function finishSpin() {
  if (!isSpinning) return;
  isSpinning = false;
  window.clearTimeout(finishTimer);
  finishTimer = null;
  resultElement.textContent = selectedItem;
  render();
}

function spin() {
  if (isSpinning || items.length < 2) return;

  isSpinning = true;
  const winnerIndex = Math.floor(Math.random() * items.length);
  selectedItem = items[winnerIndex];
  const segmentSize = 360 / items.length;
  const segmentCenter = winnerIndex * segmentSize + segmentSize / 2;
  const targetRotation = (360 - segmentCenter + 360) % 360;
  const currentNormalized = ((currentRotation % 360) + 360) % 360;
  const alignment = (targetRotation - currentNormalized + 360) % 360;
  const fullTurns = (5 + Math.floor(Math.random() * 3)) * 360;
  const duration = reducedMotion.matches ? 10 : 5200;

  render();
  resultElement.textContent = "두근두근...";
  wheel.style.transitionDuration = `${duration}ms`;
  currentRotation += fullTurns + alignment;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
  finishTimer = window.setTimeout(finishSpin, duration + 100);
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addItem(itemInput.value);
  itemInput.value = "";
  itemInput.focus();
});

spinButton.addEventListener("click", spin);
themeToggle.addEventListener("click", toggleTheme);
wheel.addEventListener("transitionend", (event) => {
  if (event.propertyName === "transform") finishSpin();
});
window.addEventListener("resize", updateLabelRadius);
reducedMotion.addEventListener?.("change", () => {
  if (!isSpinning) wheel.style.transitionDuration = "";
});

applyTheme(loadTheme());
render();
