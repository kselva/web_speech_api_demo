# Voice Dictate

A lightweight, browser-based voice dictation tool powered by the **Web Speech API**. No backend, no build step, no dependencies - just open and speak.

## Live Demo

> Deploy to GitHub Pages and add your URL here.

## Features

- Real-time voice recognition with interim transcript display
- 12 language support (English, Tamil, Hindi, Telugu, Kannada, Malayalam, French, German, Spanish, Chinese, Japanese, Arabic)
- Pause / Resume microphone anytime
- Word chips - click any word to inline edit, click X to delete
- Punctuation toolbar - insert `. , ? ! : ; ... ↵` with one tap
- Voice commands (English only) - say "comma", "full stop", "question mark", "new line" etc.
- Copy full text to clipboard
- Word count
- Works on desktop and mobile (Chrome/Edge)
- Fully offline after page load (no server calls except speech recognition)

## Voice Commands (English)

| Say | Inserts |
|-----|---------|
| period / full stop | `.` |
| comma | `,` |
| question mark | `?` |
| exclamation / exclamation mark | `!` |
| colon | `:` |
| semicolon | `;` |
| ellipsis / dot dot dot | `...` |
| new line / newline | line break |

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome (desktop) | Yes |
| Edge (desktop) | Yes |
| Chrome (Android) | Yes |
| Safari (iOS/macOS) | No |
| Firefox | No |

> Uses the [Web Speech API (SpeechRecognition)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API). Audio is processed by Google (Chrome) or Microsoft (Edge) servers. Internet connection required for speech recognition.

## Project Structure

```
speech_demo/
├── index.html          # Entry point
├── css/
│   └── style.css       # All styles and animations
└── js/
    ├── constants.js    # Language options, punctuation config
    ├── speech.js       # Web Speech API controller (start/pause/resume/auto-restart)
    ├── words.js        # Word store (add/delete/update/clear/toText)
    ├── ui.js           # DOM rendering (word chips, toolbar, lang popup)
    └── app.js          # Main entry - wires everything together
```

## Run Locally

ES modules require a local server - opening `index.html` directly via `file://` will not work.

```bash
# Option 1 - npx serve (no install needed)
npx serve .

# Option 2 - Python
python -m http.server 3000

# Option 3 - VS Code
# Install Live Server extension, right click index.html -> Open with Live Server
```

Then open `http://localhost:3000` in Chrome or Edge.

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push this folder contents to the `main` branch
3. Go to repository **Settings** → **Pages**
4. Set source to `main` branch, folder `/root`
5. Save - your site will be live at `https://yourusername.github.io/reponame`

> HTTPS is required for microphone access. GitHub Pages provides HTTPS automatically.

## Privacy

- No data is stored anywhere
- No backend server
- Speech audio is sent to Google/Microsoft servers for recognition (browser built-in)
- Nothing is logged or tracked

## License

MIT
