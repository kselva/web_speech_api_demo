import { isPunctuation } from "./words.js";
import { LANG_OPTIONS, TOOLBAR_ITEMS } from "./constants.js";

/**
 * Renders word chips into the content area.
 * @param {HTMLElement} container
 * @param {string[]} words
 * @param {{ onDelete: (i:number)=>void, onEdit: (i:number, val:string)=>void, onMove: (from:number, to:number)=>void }} handlers
 */
export function renderWords(container, words, { onDelete, onEdit, onMove }) {
  container.innerHTML = "";

  if (words.length === 0) {
    const p = document.createElement("p");
    p.className = "content-placeholder";
    p.textContent = "Your dictated text will appear here...";
    container.appendChild(p);
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "words-wrap";

  let dragSrcIndex = null;

  words.forEach((word, index) => {
    const isNewline = word === "\n";
    const isPunct   = !isNewline && isPunctuation(word);

    const chip = document.createElement(isNewline ? "div" : "span");
    chip.className = "word-chip pop-in" + (isNewline ? " newline" : isPunct ? " punct" : "");
    chip.draggable = true;
    chip.dataset.index = index;

    // drag events
    chip.addEventListener("dragstart", (e) => {
      dragSrcIndex = index;
      chip.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    chip.addEventListener("dragend", () => {
      chip.classList.remove("dragging");
      wrap.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
    });
    chip.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      wrap.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
      chip.classList.add("drag-over");
    });
    chip.addEventListener("dragleave", () => chip.classList.remove("drag-over"));
    chip.addEventListener("drop", (e) => {
      e.preventDefault();
      chip.classList.remove("drag-over");
      if (dragSrcIndex !== null && dragSrcIndex !== index) {
        onMove(dragSrcIndex, index);
      }
      dragSrcIndex = null;
    });

    if (isNewline) {
      chip.innerHTML = `<span class="word-text">↵ new line</span>`;
    } else if (isPunct) {
      chip.innerHTML = `<span class="word-text">${escHtml(word)}</span>`;
    } else {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word-text";
      wordSpan.textContent = word;
      wordSpan.title = "Click to edit";
      wordSpan.addEventListener("click", () => startInlineEdit(chip, index, word, onEdit, onDelete));
      chip.appendChild(wordSpan);
    }

    const del = makeDeleteBtn(() => onDelete(index));
    chip.appendChild(del);
    wrap.appendChild(chip);
  });

  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function makeDeleteBtn(onClick) {
  const btn = document.createElement("button");
  btn.className = "word-delete";
  btn.title = "Remove word";
  btn.textContent = "✕";
  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

function startInlineEdit(chip, index, currentValue, onEdit, onDelete) {
  const input = document.createElement("input");
  input.className = "word-edit-input pop-in";
  input.value = currentValue;
  chip.innerHTML = "";
  chip.appendChild(input);
  input.focus();
  input.select();

  function confirm() {
    const val = input.value.trim();
    onEdit(index, val);
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") confirm();
    if (e.key === "Escape") onEdit(index, currentValue);
  });
  input.addEventListener("blur", confirm);
}

/**
 * Builds the language popup options.
 * @param {HTMLElement} popup
 * @param {string} selectedCode
 * @param {(code:string) => void} onSelect
 */
export function renderLangOptions(popup, selectedCode, onSelect) {
  popup.innerHTML = "";
  LANG_OPTIONS.forEach(({ code, label }) => {
    const btn = document.createElement("button");
    btn.className = "lang-option" + (code === selectedCode ? " selected" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => onSelect(code));
    popup.appendChild(btn);
  });
}

/**
 * Builds the punctuation toolbar buttons.
 * @param {HTMLElement} container
 * @param {(token:string) => void} onInsert
 */
export function renderToolbar(container, onInsert) {
  TOOLBAR_ITEMS.forEach(({ label, title, display }) => {
    const btn = document.createElement("button");
    btn.className = "punct-btn";
    btn.title = title;
    btn.textContent = display ?? label;
    btn.addEventListener("click", () => onInsert(label));
    container.appendChild(btn);
  });
}

/**
 * Updates mic icon and ripple rings based on listening state.
 */
export function updateMicUI(micIcon, rings, isListening) {
  micIcon.classList.toggle("listening", isListening);
  rings.forEach(r => r.classList.toggle("hidden", !isListening));
}

/**
 * Updates interim transcript display.
 */
export function updateInterim(el, text, state) {
  if (text) {
    el.textContent = text;
    el.classList.add("active");
  } else {
    el.classList.remove("active");
    el.textContent =
      state === "listening" ? "Listening... please speak" :
      state === "error"     ? "" :
      "Tap play to start";
  }
}

/**
 * Updates word count label.
 */
export function updateWordCount(el, count) {
  el.textContent = `${count} ${count === 1 ? "word" : "words"}`;
}

/**
 * Shows/hides clear+copy buttons based on word count.
 */
export function updateToolbarActions(clearBtn, copyBtn, divider, count) {
  const show = count > 0;
  clearBtn.style.display = show ? "" : "none";
  copyBtn.style.display  = show ? "" : "none";
  divider.style.display  = show ? "" : "none";
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
