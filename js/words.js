import { PUNCTUATION_TOKENS } from "./constants.js";

export function isPunctuation(word) {
  return PUNCTUATION_TOKENS.includes(word);
}

export function wordsToText(words) {
  return words.reduce((acc, word, i) => {
    if (i === 0) return word === "\n" ? "" : word;
    if (word === "\n") return acc + "\n";
    if (isPunctuation(word)) return acc + word;
    return acc + " " + word;
  }, "");
}

/**
 * Creates a reactive word store.
 * @param {(words: string[]) => void} onChange
 */
export function createWordStore(onChange) {
  let words = [];

  function notify() { onChange([...words]); }

  return {
    add(tokens) {
      words.push(...tokens);
      notify();
    },
    delete(index) {
      words.splice(index, 1);
      notify();
    },
    update(index, value) {
      if (value.trim()) {
        words[index] = value.trim();
      } else {
        words.splice(index, 1);
      }
      notify();
    },
    move(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      const [item] = words.splice(fromIndex, 1);
      words.splice(toIndex, 0, item);
      notify();
    },
    clear() {
      words = [];
      notify();
    },
    getAll() { return [...words]; },
    toText() { return wordsToText(words); },
    get length() { return words.length; },
  };
}
