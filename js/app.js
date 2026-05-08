import { isSupported, createSpeechController } from "./speech.js";
import { createWordStore } from "./words.js";
import { renderWords, renderLangOptions, renderToolbar, updateMicUI, updateInterim, updateWordCount, updateToolbarActions } from "./ui.js";
import { LANG_OPTIONS } from "./constants.js";

// ── DOM refs ──
const notSupported   = document.getElementById("not-supported");
const appBody        = document.getElementById("app-body");
const micIcon        = document.getElementById("mic-icon");
const micRings       = [...document.querySelectorAll(".mic-ripple-ring")];
const interimEl      = document.getElementById("interim");
const langBadgeBtn   = document.getElementById("lang-badge");
const langPopup      = document.getElementById("lang-popup");
const pauseResumeBtn = document.getElementById("btn-pause-resume");
const contentArea    = document.getElementById("content-area");
const wordCountEl    = document.getElementById("word-count");
const clearBtn       = document.getElementById("btn-clear");
const copyBtn        = document.getElementById("btn-copy");
const toolbarDivider = document.getElementById("toolbar-divider");
const toolbarRight   = document.getElementById("toolbar-right");

// ── State ──
let currentLang = "en-US";
let dictState   = "paused"; // 'listening' | 'paused' | 'error'
let errorMsg    = "";

// ── Word store ──
const store = createWordStore((words) => {
  renderWords(contentArea, words, {
    onDelete: (i) => store.delete(i),
    onEdit:   (i, val) => store.update(i, val),
    onMove:   (from, to) => store.move(from, to),
  });
  updateWordCount(wordCountEl, words.length);
  updateToolbarActions(clearBtn, copyBtn, toolbarDivider, words.length);
});

// ── Speech controller ──
const speech = createSpeechController({
  lang: currentLang,
  onTokens: (tokens) => store.add(tokens),
  onInterim: (text)  => updateInterim(interimEl, text, dictState),
  onStateChange: (state, detail) => {
    dictState = state;
    errorMsg  = detail ?? "";
    syncUI();
  },
});

// ── Sync UI to state ──
function syncUI() {
  const isListening = dictState === "listening";
  updateMicUI(micIcon, micRings, isListening);
  updateInterim(interimEl, "", dictState);

  // pause/resume icon
  pauseResumeBtn.innerHTML = isListening
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
  pauseResumeBtn.title = isListening ? "Pause" : "Resume";

  // error display
  const errEl = document.getElementById("error-msg");
  if (dictState === "error" && errorMsg) {
    errEl.textContent = errorMsg;
    errEl.style.display = "";
  } else {
    errEl.style.display = "none";
  }
}

// ── Lang badge ──
function getLangLabel(code) {
  return LANG_OPTIONS.find(l => l.code === code)?.label ?? code;
}

function updateLangBadge() {
  langBadgeBtn.textContent = currentLang.slice(0, 2).toUpperCase();
  document.getElementById("voice-lang-label").textContent = getLangLabel(currentLang);
}

langBadgeBtn.addEventListener("click", () => {
  langPopup.classList.toggle("open");
});

document.addEventListener("mousedown", (e) => {
  if (!langBadgeBtn.contains(e.target) && !langPopup.contains(e.target)) {
    langPopup.classList.remove("open");
  }
});

renderLangOptions(langPopup, currentLang, (code) => {
  if (code === currentLang) { langPopup.classList.remove("open"); return; }
  currentLang = code;
  speech.setLang(code);
  updateLangBadge();
  langPopup.classList.remove("open");
  if (dictState === "listening") {
    speech.pause();
    setTimeout(() => speech.start(code), 150);
  }
});

// ── Pause / Resume ──
pauseResumeBtn.addEventListener("click", () => {
  if (dictState === "listening") speech.pause();
  else speech.start(currentLang);
});

// ── Clear ──
clearBtn.addEventListener("click", () => store.clear());

// ── Copy ──
copyBtn.addEventListener("click", async () => {
  const text = store.toText();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyBtn.classList.add("copied");
  copyBtn.title = "Copied!";
  setTimeout(() => {
    copyBtn.classList.remove("copied");
    copyBtn.title = "Copy to clipboard";
  }, 2000);
});

// ── Punctuation toolbar ──
renderToolbar(toolbarRight, (token) => store.add([token]));

// ── Init ──
if (!isSupported()) {
  notSupported.style.display = "flex";
  appBody.style.display = "none";
} else {
  notSupported.style.display = "none";
  appBody.style.display = "flex";
  updateLangBadge();
  updateToolbarActions(clearBtn, copyBtn, toolbarDivider, 0);
  syncUI();
  // start in paused state - user taps play to begin
}
