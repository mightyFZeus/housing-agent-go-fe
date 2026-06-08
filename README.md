# Housing-Agent Frontend

Simple web UI for asking questions about Lagos State tenancy law and getting:
- A model-generated answer
- A quoted excerpt from the official document used to generate the answer

This frontend is designed to run locally against the existing Go (Chi) backend.

## Features
- Single-page search UI (textarea + Search)
- Client-side validation (trim, 2–500 chars)
- Streaming `/search` support (answer appears progressively)
- “Official document excerpt” panel (collapsible) + copy buttons
- Formatting helpers to turn run-on/streamed text into readable sections and bullets
- Auto-scroll while streaming (stops auto-scrolling if the user scrolls up)

## Backend API
- `GET /health` → `{ "status": "ok", "env": "development" }`
- `GET /search?query=...` → streamed response that eventually yields `{ data: { answer, context } }`

## Local Development
### 1) Start the backend
Run the Go server (default `:8080`). Make sure required backend env vars are set (do not commit real API keys).

### 2) Start the frontend
```bash
npm install
npm run dev
```

Open the dev server URL shown in the terminal.

## Proxy / CORS
The backend does not add CORS headers, so the frontend dev server proxies requests:
- `/health` → `http://127.0.0.1:8080/health`
- `/search` → `http://127.0.0.1:8080/search`

Config: [vite.config.ts](file:///Users/mightyzeus/Desktop/housing-agent-fe/vite.config.ts)

## How Streaming Works
The `/search` handler is treated as streaming.
- Supports SSE (`text/event-stream`) and NDJSON (line-delimited JSON), and still works with non-stream JSON.
- The UI shows a “Generating…” state and updates the answer as chunks arrive.

Key files:
- Streaming parser: [api.ts](file:///Users/mightyzeus/Desktop/housing-agent-fe/src/utils/api.ts)
- State management: [useLawSearch.ts](file:///Users/mightyzeus/Desktop/housing-agent-fe/src/hooks/useLawSearch.ts)
- Answer rendering: [AnswerCard.tsx](file:///Users/mightyzeus/Desktop/housing-agent-fe/src/components/AnswerCard.tsx)

## Text Formatting
To keep streamed text readable (not jumbled), the frontend normalizes:
- headings like “Short answer:”, “Why…:”, “Practical advice…:”
- bullet markers (`- ...`)
- common spacing issues and broken words from chunk boundaries
- “Section …” references: moved onto their own line (with spacing) and rendered bolder

Key files:
- Formatting rules: [formatting.ts](file:///Users/mightyzeus/Desktop/housing-agent-fe/src/utils/formatting.ts)
- Markdown renderer (safe subset): [Markdown.tsx](file:///Users/mightyzeus/Desktop/housing-agent-fe/src/components/Markdown.tsx)

## Scripts
```bash
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview production build
npm run check     # typecheck
npm run lint      # eslint
npm run test:run  # run unit tests
```
# housing-agent-go-fe
