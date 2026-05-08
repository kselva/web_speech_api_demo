import { PUNCTUATION_COMMANDS, PUNCTUATION_TOKENS } from "./constants.js";

const MAX_RESTARTS = 20;
const NO_SPEECH_THRESHOLD = 5;

export function getSpeechConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSupported() {
  return !!getSpeechConstructor();
}

export function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

/**
 * Resolve spoken text into tokens, intercepting English punctuation commands.
 * @param {string} text
 * @param {boolean} isEnglish
 * @returns {string[]}
 */
export function resolveTokens(text, isEnglish) {
  if (!isEnglish) return text.trim().split(/\s+/).filter(Boolean);
  const lower = text.trim().toLowerCase();
  if (PUNCTUATION_COMMANDS[lower]) return [PUNCTUATION_COMMANDS[lower]];
  return text.trim().split(/\s+/).filter(Boolean).map(
    (w) => PUNCTUATION_COMMANDS[w.toLowerCase()] ?? w
  );
}

/**
 * Creates a speech recognition controller.
 * @param {{
 *   lang: string,
 *   onTokens: (tokens: string[]) => void,
 *   onInterim: (text: string) => void,
 *   onStateChange: (state: 'listening'|'paused'|'error', detail?: string) => void,
 * }} options
 */
export function createSpeechController({ lang, onTokens, onInterim, onStateChange }) {
  let recognition = null;
  let shouldRestart = false;
  let restartCount = 0;
  let noSpeechCount = 0;
  let currentLang = lang;

  function spawn() {
    const Constructor = getSpeechConstructor();
    if (!Constructor) return;

    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try { recognition.abort(); } catch (_) {}
    }

    recognition = new Constructor();
    recognition.continuous = !isAndroid();
    recognition.interimResults = true;
    recognition.lang = currentLang;

    recognition.onresult = (event) => {
      restartCount = 0;
      noSpeechCount = 0;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const isEnglish = currentLang.startsWith("en");
          const tokens = resolveTokens(text, isEnglish);
          if (tokens.length) onTokens(tokens);
        } else {
          interim = text;
        }
      }
      onInterim(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech") {
        noSpeechCount++;
        if (noSpeechCount >= NO_SPEECH_THRESHOLD) {
          onStateChange("error", "No speech detected. Please speak closer to the microphone.");
        }
        return;
      }
      const messages = {
        "not-allowed":       "Microphone access denied. Please allow microphone permission.",
        "audio-capture":     "No microphone found. Please connect a microphone.",
        "network":           "Network error. Speech recognition requires internet connection.",
        "service-not-allowed": "Speech recognition service unavailable. Try again later.",
      };
      onStateChange("error", messages[event.error] ?? `Error: ${event.error}`);
      shouldRestart = false;
    };

    recognition.onend = () => {
      onInterim("");
      if (!shouldRestart) {
        onStateChange("paused");
        return;
      }
      restartCount++;
      if (restartCount > MAX_RESTARTS) {
        onStateChange("error", "Speech recognition stopped. Please click Resume.");
        shouldRestart = false;
        return;
      }
      setTimeout(() => { if (shouldRestart) spawn(); }, 100);
    };

    try {
      recognition.start();
      onStateChange("listening");
    } catch (_) {
      onStateChange("error", "Failed to start speech recognition.");
    }
  }

  return {
    start(newLang) {
      currentLang = newLang ?? currentLang;
      shouldRestart = true;
      restartCount = 0;
      noSpeechCount = 0;
      spawn();
    },
    pause() {
      shouldRestart = false;
      if (recognition) {
        recognition.onend = null;
        try { recognition.abort(); } catch (_) {}
        recognition = null;
      }
      onStateChange("paused");
    },
    resume() {
      shouldRestart = true;
      restartCount = 0;
      noSpeechCount = 0;
      spawn();
    },
    setLang(newLang) {
      currentLang = newLang;
    },
    destroy() {
      shouldRestart = false;
      if (recognition) {
        recognition.onend = null;
        try { recognition.abort(); } catch (_) {}
        recognition = null;
      }
    },
  };
}
