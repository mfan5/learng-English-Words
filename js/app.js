import { scenes, words } from "./data.js";
import {
  getLearnedIdsForDate,
  getLocalDateKey,
  getSceneProgress,
  normalizeRecords,
  toggleLearned,
} from "./learning.js";

const STORAGE_KEY = "everyday-english-learned-v1";
const ASSET_VERSION = "20260612b";
const app = document.querySelector("#app");
const todayCounter = document.querySelector("#today-counter");
const todayCount = document.querySelector("#today-count");
const toast = document.querySelector("#toast");
const speakerIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M4 10v4h4l5 4V6L8 10H4Z" fill="currentColor"/>
    <path d="M16 9c1.2 1.2 1.2 4.8 0 6M18.5 6.5c3 3 3 8 0 11"
      stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;

let records = readRecords();
let toastTimer;

function readRecords() {
  try {
    return normalizeRecords(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return {};
  }
}

function writeRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getTodayIds() {
  return getLearnedIdsForDate(records, getLocalDateKey());
}

function updateHeaderCount() {
  todayCount.textContent = String(getTodayIds().length);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function safeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function assetUrl(path) {
  return `${path}?v=${ASSET_VERSION}`;
}

function renderTabs(current) {
  return `
    <nav class="view-tabs" aria-label="学习视图">
      <a class="view-tab" href="#home" ${current === "home" ? 'aria-current="page"' : ""}>全部场景</a>
      <a class="view-tab" href="#today" ${current === "today" ? 'aria-current="page"' : ""}>今日学过</a>
    </nav>`;
}

function renderHome() {
  const learned = new Set(getTodayIds());
  app.innerHTML = `
    <section class="hero">
      <div>
        <h1>从身边的东西开始，<br>把英语<em>说出来</em>。</h1>
        <p>选择一个生活场景，看真实图片、听自然发音，学习你每天真正会用到的英文名词。</p>
      </div>
      ${renderTabs("home")}
    </section>
    <section class="scene-grid" aria-label="生活场景">
      ${scenes
        .map((scene) => {
          const progress = getSceneProgress(words, [...learned], scene.id);
          return `
            <button class="scene-card" data-scene="${scene.id}" type="button">
              <img src="${assetUrl(scene.image)}" alt="" loading="lazy">
              <span class="scene-card-content">
                <span class="scene-card-title">${scene.chinese}<span>${scene.english}</span></span>
                <span class="scene-card-meta">
                  <span>${scene.preview}</span>
                  <span>${progress.learned} / ${progress.total}</span>
                </span>
              </span>
            </button>`;
        })
        .join("")}
    </section>`;
}

function renderWordCard(word, learnedIds) {
  const isLearned = learnedIds.has(word.id);
  return `
    <article class="word-card" data-word-id="${word.id}">
      <div class="word-image-wrap">
        <img class="word-image" src="${assetUrl(word.image)}" alt="${safeText(word.chinese)}，${safeText(word.english)}" loading="lazy">
        <div class="word-image-fallback" aria-hidden="true">
          <span><strong>${safeText(word.english)}</strong>${safeText(word.chinese)}</span>
        </div>
      </div>
      <div class="word-card-body">
        <div class="word-heading">
          <div>
            <h2>${safeText(word.english)}</h2>
            <div class="phonetic">${safeText(word.phonetic)}</div>
          </div>
          <button class="sound-button" data-speak="${safeText(word.english)}" type="button"
            aria-label="播放 ${safeText(word.english)} 的发音">${speakerIcon}</button>
        </div>
        <div class="chinese">${safeText(word.chinese)}</div>
        <p class="phrase">${safeText(word.phrase)}</p>
        <p class="example">
          <button class="example-button" data-speak="${safeText(word.example)}" type="button"
            aria-label="播放例句">${safeText(word.example)}</button>
        </p>
        <button class="learned-button ${isLearned ? "is-learned" : ""}" data-learn="${word.id}" type="button"
          aria-pressed="${isLearned}">
          ${isLearned ? "✓ 今日已学" : "学会了"}
        </button>
      </div>
    </article>`;
}

function renderScene(sceneId) {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) {
    location.hash = "#home";
    return;
  }

  const sceneWords = words.filter((word) => word.scene === scene.id);
  const learnedIds = new Set(getTodayIds());
  const progress = getSceneProgress(words, [...learnedIds], scene.id);
  const percentage = progress.total ? (progress.learned / progress.total) * 100 : 0;

  app.innerHTML = `
    <button class="back-link" data-home type="button">← 返回全部场景</button>
    <header class="page-header">
      <div>
        <h1 class="page-title"><small>${scene.english}</small>${scene.chinese}</h1>
        <p class="page-intro">${scene.description}<br>点单词或例句可以听发音，确认记住后再点“学会了”。</p>
      </div>
      <div>
        <div class="progress-copy">
          <span>本场景今日已学</span>
          <strong>${progress.learned} / ${progress.total}</strong>
        </div>
        <div class="progress-track" aria-label="场景学习进度">
          <span class="progress-fill" style="width:${percentage}%"></span>
        </div>
      </div>
    </header>
    <section class="word-grid" aria-label="${scene.chinese}词卡">
      ${sceneWords.map((word) => renderWordCard(word, learnedIds)).join("")}
    </section>`;
}

function renderToday() {
  const learnedIds = new Set(getTodayIds());
  const learnedWords = words.filter((word) => learnedIds.has(word.id));

  app.innerHTML = `
    <section class="hero">
      <div>
        <h1>今天学过的词，<br>再看一眼。</h1>
        <p>这里汇总你今天主动标记“学会了”的卡片。再次点击可以取消标记。</p>
      </div>
      ${renderTabs("today")}
    </section>
    ${
      learnedWords.length
        ? `<section class="word-grid" aria-label="今日学过的词卡">
            ${learnedWords.map((word) => renderWordCard(word, learnedIds)).join("")}
          </section>`
        : `<section class="empty-state">
            <div class="empty-state-mark">Aa</div>
            <h2>今天还没有学习记录</h2>
            <p>选一个熟悉的场景开始。只有你主动点击“学会了”的卡片才会出现在这里。</p>
            <a class="primary-button" href="#home">选择生活场景</a>
          </section>`
    }`;
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器暂不支持语音播放");
    return;
  }

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => voice.lang === "en-US") ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null;
  utterance.lang = utterance.voice?.lang ?? "en-US";
  utterance.rate = text.includes(" ") ? 0.88 : 0.82;
  speechSynthesis.speak(utterance);
}

function toggleWord(wordId) {
  const dateKey = getLocalDateKey();
  const wasLearned = getTodayIds().includes(wordId);
  records = toggleLearned(records, dateKey, wordId);
  writeRecords();
  updateHeaderCount();
  renderRoute();
  showToast(wasLearned ? "已取消今日学习记录" : "已加入今日学习记录");
}

function renderRoute() {
  const route = location.hash.replace(/^#/, "") || "home";
  if (route === "today") {
    renderToday();
  } else if (route.startsWith("scene/")) {
    renderScene(route.slice("scene/".length));
  } else {
    renderHome();
  }
  updateHeaderCount();
  window.scrollTo({ top: 0, behavior: "instant" });
}

app.addEventListener("click", (event) => {
  const sceneButton = event.target.closest("[data-scene]");
  const homeButton = event.target.closest("[data-home]");
  const speakButton = event.target.closest("[data-speak]");
  const learnButton = event.target.closest("[data-learn]");

  if (sceneButton) location.hash = `#scene/${sceneButton.dataset.scene}`;
  if (homeButton) location.hash = "#home";
  if (speakButton) speak(speakButton.dataset.speak);
  if (learnButton) toggleWord(learnButton.dataset.learn);
});

app.addEventListener(
  "error",
  (event) => {
    if (event.target.matches(".word-image")) {
      event.target.closest(".word-image-wrap")?.classList.add("is-fallback");
    }
  },
  true,
);

todayCounter.addEventListener("click", () => {
  location.hash = "#today";
});

window.addEventListener("hashchange", renderRoute);
renderRoute();
