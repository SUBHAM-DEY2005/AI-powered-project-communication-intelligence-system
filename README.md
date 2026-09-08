# ProjectPulse AI — Intelligent Project Communication Layer

Turns unstructured project communication (messages, notes, meeting recaps) into
structured, searchable project information: summaries, tasks, responsible
people, deadlines, decisions, and approvals.

```
Communication → AI Analysis → Summary + Tasks + Responsibility + Deadlines + Decisions → MongoDB → Searchable Project Memory
```

This repo contains the **MVP scope**: create projects, paste communication,
analyze it with an LLM, see extracted tasks/decisions on a dashboard, manage
task status, and search project memory. PDF upload, meeting transcripts, and
notifications are deliberately left for a follow-up phase (the architecture
already has room for them — see [Extending](#extending)).

## Stack

| Layer     | Tech                                            |
|-----------|--------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend   | FastAPI, Pydantic, Motor (async MongoDB driver)   |
| Database  | MongoDB                                           |
| AI        | Google Gemini API (`google-genai` Python SDK), swappable |

## Project structure

```
projectpulse-ai/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── config.py                # Settings loaded from .env
│   ├── database.py              # Motor client, collections, indexes
│   ├── seed_data.py             # Demo data script
│   ├── models/                  # Pydantic schemas
│   ├── routes/                  # projects, communications, tasks, decisions, search
│   ├── services/ai_service.py   # LLM prompt + structured JSON extraction
│   ├── utils/json_utils.py      # Safe JSON parsing of AI output
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Sidebar, Badge, Cards, loading/empty/error states
│   │   ├── pages/                # Projects, Dashboard, Communication, Tasks, Decisions, Search
│   │   ├── services/api.js       # Axios client + all API calls
│   │   ├── hooks/useToast.jsx    # Toast notification system
│   │   └── App.jsx               # Routes + layout
│   └── package.json
│
└── README.md
```

## Local setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A running MongoDB instance (local install, Docker, or MongoDB Atlas)
- A free Gemini API key (get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set MONGODB_URI and GEMINI_API_KEY

uvicorn main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

Optional — seed demo data so the dashboard isn't empty on first run:

```bash
python seed_data.py
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # defaults to http://localhost:8000, adjust if needed
npm run dev
```

Open `http://localhost:5173`.

### 3. MongoDB (if you don't already have one running)

Quickest option with Docker:

```bash
docker run -d -p 27017:27017 --name projectpulse-mongo mongo:7
```

## Using the app

1. **Projects → New Project** — create a project (name, client, description).
2. Open the project → **Communication** — paste a message like:
   > "Rahul, please update the electrical drawing by Friday. The client
   > approved the new lighting layout, but we still need approval for the
   > ceiling design."
3. Click **Analyze Communication**. The AI extracts a summary, one task
   (assigned to Rahul, due Friday), one approved decision (lighting layout),
   and one pending decision (ceiling design).
4. **Dashboard** shows live counts and recent activity. **Tasks** lets you
   click a status badge to cycle pending → in progress → completed.
   **Decisions** lists everything approved/rejected/pending. **Search** lets
   you ask things like "Who approved the lighting layout?" or "What tasks
   are assigned to Rahul?" across all stored communication.

## Example API requests

Create a project:

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Riverside Residence", "client": "Sharma Family"}'
```

Add and analyze a communication:

```bash
curl -X POST http://localhost:8000/api/projects/<project_id>/communications \
  -H "Content-Type: application/json" \
  -d '{"text": "Rahul, please update the electrical drawing by Friday..."}'

curl -X POST http://localhost:8000/api/communications/<communication_id>/analyze
```

Example `/analyze` response:

```json
{
  "summary": "Electrical drawing needs to be updated and lighting layout has been approved.",
  "tasks": [
    {
      "id": "66f...",
      "title": "Update electrical drawing",
      "responsible": "Rahul",
      "deadline": "Friday",
      "status": "pending"
    }
  ],
  "decisions": [
    { "id": "66f...", "description": "Lighting layout approved", "status": "approved" },
    { "id": "66f...", "description": "Ceiling design approval", "status": "pending" }
  ]
}
```

Search:

```bash
curl "http://localhost:8000/api/projects/<project_id>/search?q=lighting"
```

Update a task's status:

```bash
curl -X PATCH http://localhost:8000/api/tasks/<task_id> \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

## Error handling

- **AI failures** (missing key, network issue, malformed output): the
  `/analyze` endpoint returns `502` with a readable message rather than a
  raw stack trace. `ai_service.py` never lets malformed JSON crash the
  request — it either salvages what it can or raises a clear error.
- **MongoDB unavailable**: a global exception handler in `main.py` returns
  `503` instead of a 500.
- **Invalid IDs / empty input**: validated at the route level with `400`s.
- **Frontend**: every page has explicit loading, empty, and error states
  (see `components/States.jsx`); failures surface as toasts, not silent
  console errors.

## Security notes

- The Gemini API key lives only in `backend/.env`, never in frontend code.
- `.env` is gitignored in both `backend/` and `frontend/`.
- CORS is restricted to `FRONTEND_ORIGIN` from `.env` — update it for
  production domains.
- Input is validated with Pydantic on every write endpoint.

## Extending

The MVP is built so these are additive, not rewrites:

- **PDF upload**: add a route that extracts text (e.g. `pdfplumber`) and
  calls the same `create_communication` + `analyze_communication` flow with
  `source="pdf"`.
- **Meeting transcripts**: same pattern with `source="transcript"`, feeding
  in speech-to-text output.
- **Better search**: `routes/search.py` is isolated — swap the current
  Mongo text-index/regex approach for embeddings-based semantic search
  without touching the response shape the frontend expects.
- **Multiple AI providers**: everything LLM-specific lives in
  `services/ai_service.py` behind `analyze_communication()` — replace
  `_call_model` to use a different provider or SDK.

## Deployment

**Backend** (e.g. Render, Railway, Fly.io, or a VM):
1. Set `MONGODB_URI` (e.g. MongoDB Atlas connection string), `GEMINI_API_KEY`,
   and `FRONTEND_ORIGIN` as environment variables.
2. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

**Frontend** (e.g. Vercel, Netlify, Cloudflare Pages):
1. Build command: `npm run build`, output directory: `dist`.
2. Set `VITE_API_BASE_URL` to your deployed backend URL.

**MongoDB**: MongoDB Atlas free tier is the simplest managed option — create
a cluster, whitelist your backend's IP (or `0.0.0.0/0` for quick testing),
and use the provided connection string as `MONGODB_URI`.
