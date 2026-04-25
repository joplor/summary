# LectureAI — Real-Time AI Lecture Assistant

A production-ready, AI-powered lecture and voice assistant with live transcription, smart summaries, flashcards, quizzes, and premium UI/UX. Deployable as a **100% static site** on GitHub Pages.

![LectureAI](https://img.shields.io/badge/LectureAI-v1.0.0-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)

---

## Features

### 🎤 Live Speech Recognition
- Real-time transcription using the Web Speech API (Chrome / Edge)
- Interim text display while you speak (shows words forming in real time)
- Auto-pause/resume detection
- Multi-speaker heuristic detection (detects speaker changes based on pauses)

### 🤖 AI Features (requires API key)
| Feature | Description |
|---|---|
| **Smart Summarization** | Bullet points, key concepts, definitions, action items |
| **Auto-summarize** | Configurable interval (every 30–120 seconds) |
| **Flashcards** | Interactive flip-card study deck generated from your transcript |
| **Quiz** | Multiple-choice quiz with scoring and explanations |
| **Explain Simply** | Breaks down any transcript segment into plain English |

### 📝 Notes & Transcript
- Pin any transcript entry → automatically saved to Notes
- Extract key sentences with one click (client-side NLP, no API needed)
- Manual note-taking with the Notes tab
- Full-text search with live highlighting across the entire transcript

### 💾 Session Management
- Auto-saves to `localStorage` (up to 20 sessions)
- Resume any previous session from the History panel
- Rename sessions by clicking the name in the header

### 📤 Export
| Format | Contents |
|---|---|
| **PDF** | Beautifully formatted with header, summary sections, transcript |
| **Markdown** | Perfect for Notion, Obsidian, GitHub |
| **TXT** | Plain text for any use case |

### 🎨 UI / UX
- Clean, minimal design with glassmorphism cards
- Full dark mode toggle
- Smooth animations and micro-interactions throughout
- Responsive status bar (recording timer, word count, detected topics)
- Toast notifications for all actions

---

## Quick Start (Local)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) installed
- A modern browser (Chrome or Edge for speech recognition)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/lectureai.git
cd lectureai

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

### Build for Production

```bash
npm run build
# → output in dist/
```

---

## API Key Setup

LectureAI's AI features work with **OpenAI** (recommended — works directly in the browser) or **Anthropic** (requires a CORS proxy).

### Option 1 — OpenAI (Easiest)

1. Get an API key at [platform.openai.com](https://platform.openai.com)
2. Open the app → click the **⚙ Settings** icon
3. Set **AI Provider** to `OpenAI`
4. Paste your key (starts with `sk-...`)
5. Click **Save Settings**

> Uses `gpt-4o-mini` by default — extremely cheap (~$0.15 / 1M tokens). A 1-hour lecture costs less than $0.01.

### Option 2 — Anthropic (via Cloudflare Worker proxy)

Anthropic's API doesn't support direct browser calls (CORS). You need a tiny proxy:

**Deploy the proxy (free, ~2 minutes):**

1. Create a [Cloudflare Workers](https://workers.cloudflare.com/) account (free)
2. Create a new Worker and paste this code:

```js
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
        },
      })
    }

    const upstream = new Request('https://api.anthropic.com/v1/messages', {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })

    const response = await fetch(upstream)
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    return newResponse
  },
}
```

3. Deploy and copy your Worker URL (e.g. `https://my-proxy.your-name.workers.dev`)
4. In LectureAI Settings → set **AI Provider** to `Anthropic` → paste your Anthropic API key + the proxy URL

---

## Deploying to GitHub Pages

### Method 1 — GitHub Actions (Recommended)

1. Push your code to GitHub
2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. Go to your repo **Settings → Pages → Source → gh-pages branch**
4. Your app will be live at `https://YOUR_USERNAME.github.io/lectureai/`

> **Note:** If deploying to a subdirectory (e.g. `github.io/lectureai/`), the `base: './'` in `vite.config.js` ensures all asset paths work correctly.

### Method 2 — Manual Deploy

```bash
npm install
npm run build

# Copy dist/ contents to your GitHub Pages branch manually
# or use:
npx gh-pages -d dist
```

---

## Project Structure

```
lectureai/
├── src/
│   ├── App.jsx                  # Root component + all state
│   ├── index.css                # Tailwind + custom animations
│   ├── components/
│   │   ├── Header.jsx           # Top bar: controls, search, record
│   │   ├── TranscriptPanel.jsx  # Live scrolling transcript (left)
│   │   ├── RightPanel.jsx       # Summary/Notes/Flashcards/Quiz (right)
│   │   ├── SummaryCard.jsx      # AI summary with expandable sections
│   │   ├── NotesPanel.jsx       # Notes with pin/add/delete
│   │   ├── SettingsModal.jsx    # All settings + API key config
│   │   ├── SessionsModal.jsx    # Session history browser
│   │   ├── ExportMenu.jsx       # PDF / Markdown / TXT export
│   │   ├── StatusBar.jsx        # Bottom bar: timer, topics, word count
│   │   └── Toast.jsx            # Toast notification system
│   ├── hooks/
│   │   └── useSpeechRecognition.js  # Web Speech API hook
│   ├── services/
│   │   ├── aiService.js         # OpenAI + Anthropic API calls
│   │   ├── exportService.js     # PDF / Markdown / TXT generation
│   │   └── storageService.js    # localStorage persistence
│   └── utils/
│       └── nlp.js               # Client-side NLP (keywords, topics, etc.)
├── index.html
├── vite.config.js               # base: './' for GitHub Pages
├── tailwind.config.js
└── package.json
```

---

## Browser Support

| Browser | Speech Recognition | AI Features | Export |
|---|---|---|---|
| **Chrome 90+** | ✅ Full | ✅ | ✅ |
| **Edge 90+** | ✅ Full | ✅ | ✅ |
| **Firefox** | ❌ Not supported | ✅ | ✅ |
| **Safari** | ⚠️ Partial | ✅ | ✅ |

> Speech recognition requires Chrome or Edge. All other features work in any modern browser.

---

## Privacy & Security

- **Your API key never leaves your browser.** It is stored in `localStorage` only and sent directly to OpenAI/Anthropic from your machine.
- **No backend.** This is a fully static app — no server collects your data.
- **Transcript data stays local.** Everything is stored in your browser's `localStorage`.

---

## License

MIT — free to use, fork, and deploy.
