# ExamLens

**ExamLens is an exam-proctoring assistant that reviews recorded exam footage for you.**
Instead of scrubbing through hours of CCTV, an invigilator uploads a recording and
ExamLens does the watching — it tracks each person in frame, flags behavior that
looks suspicious (laptop/phone use, prolonged stillness, excessive movement), cuts a
short evidence clip around each flagged moment, renders a motion heatmap of the room,
and produces a ranked investigation report. It doesn't accuse anyone; it surfaces the
moments worth a human's attention so limited review time goes where it matters most.

The system is a **React single-page app** (the dashboard) talking to a **FastAPI REST
service** (the ML pipeline + data), backed by **MongoDB** and on-disk storage. It runs
entirely on your own machine — footage, clips, and reports never leave it, and no
internet connection is needed to process a recording.

---

## Contents

1. [Requirements](#requirements)
2. [Architecture](#architecture)
3. [Frontend — what it's built with](#frontend--what-its-built-with)
4. [Backend — what it's built with](#backend--what-its-built-with)
5. [Setup & run](#setup--run)
6. [Configuration](#configuration)
7. [The processing pipeline](#the-processing-pipeline)
8. [API reference](#api-reference)

---

## Requirements

You run the two halves locally (no Docker required):

| Requirement | Version / notes |
|-------------|-----------------|
| **Python** | 3.11+ — for the backend API and ML pipeline |
| **Node.js + npm** | Node 18+ (npm 9+) — for the frontend dev server / build |
| **MongoDB** | MongoDB Community running locally at `mongodb://localhost:27017` (or an Atlas URI) |
| **YOLO weights** | `backend/yolo11n.pt` (already included — ~5.6 MB, so nothing is downloaded at runtime) |
| **ffmpeg** | *Optional.* A bundled `imageio-ffmpeg` binary is used as a fallback; without either, clips are written via OpenCV |
| **OS** | Developed and run on Windows 11. macOS / Linux work too (only the activate/copy commands differ) |

**Ports:** the API runs on **8000**, the frontend dev server on **5173** (already in the
API's CORS allowlist).

> **Offline:** after the one-time `npm install` / `pip install`, everything runs offline.
> The only network traffic is the browser talking to the local API.

---

## Architecture

ExamLens is three cooperating processes: the **browser SPA**, the **API**, and a
**background worker** that runs the ML pipeline. MongoDB holds metadata and results;
large binaries (the uploaded video, evidence clips, the heatmap PNG) live on disk and
MongoDB stores only their paths.

```
                                              ┌──────────────────────────────┐
   Browser (React SPA, :5173)                 │        FastAPI API (:8000)   │
   ┌───────────────────────────┐              │                              │
   │  Login / Upload / Dashboard│  JWT + JSON  │  routers → services          │
   │  Reports / Event review    │ ───────────▶ │  (async Motor driver)        │
   │  Heatmap + clip (blob auth)│ ◀─────────── │                              │
   └───────────────────────────┘              │        │ enqueue upload       │
                                              │        ▼                      │
                                              │  background worker            │
                                              │  (thread pool / Celery-ready) │
                                              │        │                      │
                                              │        ▼  ml.pipeline          │
                                              │  track → detect events →      │
                                              │  cut clips → heatmap → report │
                                              └────┬───────────────┬──────────┘
                                                   │ paths+summary │ files
                                          (PyMongo)▼               ▼
                                              ┌─────────┐   ┌──────────────┐
                                              │ MongoDB │   │ storage/ disk │
                                              │ :27017  │   │ video/clips/  │
                                              └─────────┘   │ heatmap       │
                                                            └──────────────┘
```

**Key design points**

- **Two Mongo drivers on purpose.** The API uses async **Motor**; the worker runs in
  background threads (no event loop) and uses sync **PyMongo**.
- **The ML pipeline is storage-agnostic.** `ml/` reports progress via a callback and
  returns a results dict; the `worker/` layer is what persists it. This keeps the ML
  code reusable (there's also a standalone CLI, `scripts/run_pipeline.py`).
- **Binary endpoints need auth.** `GET .../heatmap` (PNG) and `GET .../clip` (mp4)
  require the `Authorization` header, so the SPA can't use them as a plain `<img>` /
  `<video>` `src`. The frontend fetches them as blobs through the authed Axios client
  and wraps them with `URL.createObjectURL` (see `src/lib/useAuthedBlob.js`).
- **Polling, not sockets.** After upload, the dashboard polls `GET /api/exams/{id}`
  every 3 s and advances a stepper until the status is terminal (`done` / `failed`).

### Repository layout

```
ExamLens/
├── README.md               ← you are here (the only README)
├── docker-compose.yml      ← optional containerized run (Mongo + API)
├── backend/                ← FastAPI service + ML pipeline
│   ├── app/                ← API: main, routers/, services/, schemas/, deps, security, db, config
│   ├── ml/                 ← pipeline: config, detector, tracker, event_engine, clips, heatmap, pipeline
│   ├── worker/             ← background job runner (thread pool + Celery-ready)
│   ├── scripts/            ← run_pipeline.py (standalone, no DB)
│   ├── tests/              ← pytest
│   ├── storage/            ← uploaded videos, clips, heatmaps (created at runtime)
│   ├── yolo11n.pt          ← YOLO11n weights (bundled)
│   └── requirements.txt
└── frontend/               ← React + Vite dashboard
    └── src/
        ├── lib/            ← api (axios), auth, queryClient, constants, format, useAuthedBlob
        ├── components/     ← Layout, Navbar, Badge, charts, EventsTable, HeatmapImage, ClipPlayer, …
        └── pages/          ← Home, About, Upload, ExamsList (Uploads), Reports, ExamDashboard, EventDetail, Report, Login, Register
```

**The ML core** is refactored from the original research notebooks:
**Phase 1B** (MOG2 motion ROIs + YOLO11n detection + ByteTrack tracking) and
**Phase 2** (a rule-based event engine with a per-exam-type detection profile).

---

## Frontend — what it's built with

A JavaScript (JSX) single-page app with a light, professional theme.

| Tool | Role |
|------|------|
| **React 18** | UI library |
| **Vite 6** | Dev server + build tooling |
| **Tailwind CSS v4** | Styling — via `@tailwindcss/vite`, configured in `src/index.css` (no `tailwind.config.js`) |
| **React Router v7** | Client-side routing |
| **TanStack Query v5** | Server-state fetching, caching, and the 3 s status polling |
| **Recharts** | Severity / event-type charts |
| **Axios** | HTTP client with JWT request/response interceptors |
| **lucide-react** | Icons |

**Pages:** Home, Uploads (exam list), Upload, Reports, About, plus the per-exam
Dashboard, Event detail (with clip player + review controls), and the printable
Investigation Report. Auth state lives in an `AuthContext`; the JWT is kept in
`localStorage` and attached to every request, and a `401` clears it and routes to login.

---

## Backend — what it's built with

An async FastAPI service that owns the data model, auth, and the ML pipeline.

| Tool | Role |
|------|------|
| **FastAPI** + **Uvicorn** | Async web framework + ASGI server |
| **Motor** (async) / **PyMongo** (sync) | MongoDB drivers — async for the API, sync for the worker threads |
| **Pydantic v2** + **pydantic-settings** | Request/response models and environment-based config |
| **PyJWT** + **bcrypt** | JWT bearer auth and password hashing |
| **ThreadPoolExecutor worker** | In-process background processing (Celery-ready — set `USE_CELERY=true`) |
| **Ultralytics YOLO11n** | Person detection |
| **OpenCV** (MOG2) | Motion ROIs + video I/O |
| **supervision** (ByteTrack) | Multi-object tracking across frames |
| **matplotlib** | Motion-heatmap rendering |
| **imageio-ffmpeg** | Evidence-clip extraction (OpenCV fallback) |

Data lives in MongoDB (`examlens` database); videos, clips, and heatmaps are written
under `backend/storage/`.

---

## Setup & run

Start MongoDB first, then the backend, then the frontend. Commands below are for
**Windows PowerShell**; macOS/Linux notes follow each block.

### 1. Backend (API + pipeline)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env              # macOS/Linux: cp .env.example .env  — then set MONGODB_URI / JWT_SECRET
python -m uvicorn app.main:app --reload
```

The API boots even if MongoDB is down (the connection is lazy); `GET /health` reports
live DB connectivity, and interactive docs are at <http://localhost:8000/docs>.

> **Fast first run:** set `MAX_FRAMES=300` in `backend/.env` before starting the API so
> a test video finishes processing in seconds instead of minutes.

### 2. Frontend (dashboard)

In a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env              # sets VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:5173>. The Axios client appends `/api` to the base URL.

```powershell
npm run build      # production build -> dist/
npm run preview    # serve the production build on :5173
```

### 3. First use

1. **Register** the first account — it automatically becomes the administrator and logs you in.
2. **New upload** → drop a short exam video, choose the exam type, submit. You're redirected to that exam's dashboard.
3. Watch the **stepper** advance through the pipeline (polling every 3 s) to `done`.
4. Review the **summary cards, charts, motion heatmap, and events table**.
5. Open an **event** to play its evidence clip and mark it confirmed / false-positive with notes.
6. Open the **investigation report** and use **Print / Save as PDF**.

### Optional: Docker

A `docker-compose.yml` (Mongo + API) is included if you prefer containers:

```bash
docker compose up --build
```

The frontend is not containerized — run it with `npm run dev` as above.

---

## Configuration

Backend settings are environment variables (see `backend/.env.example`). The important ones:

| Var | Default | Notes |
|-----|---------|-------|
| `MONGODB_URI` | `mongodb://localhost:27017` | Local, Docker (`mongodb://mongo:27017`), or Atlas |
| `JWT_SECRET` | dev placeholder | **Change in production** |
| `ALLOW_OPEN_REGISTRATION` | `true` | Set `false` after bootstrapping the first admin |
| `STORAGE_DIR` | `backend/storage` | Where videos / clips / heatmaps are written |
| `YOLO_WEIGHTS` | `yolo11n.pt` | Model weights |
| `WORKER_THREADS` | `1` | Background thread-pool size |
| `TOP_CLIPS` | `10` | Max evidence clips per exam |
| `MAX_FRAMES` | *unset* | Cap frames per job (useful for demos) |
| `USE_CELERY` | `false` | Dispatch to Celery instead of the in-process thread |

The frontend reads a single variable from `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

---

## The processing pipeline

Each uploaded exam moves through these statuses (the dashboard polls until it reaches a
terminal one):

```
uploaded → tracking → detecting_events → generating_clips → generating_heatmap → done
                                                                              (or failed + error)
```

**What it detects**, and how the exam type tunes it:

| Event | Meaning |
|-------|---------|
| **Laptop interaction** | Use of a laptop / phone / screen |
| **Suspicious stillness** | A person unusually motionless for a long stretch |
| **Excessive movement** | Repeated turning, reaching, or leaving position |

`examType` ∈ `CBT`, `PAPER_PEN`, `PHYSICAL`, `HYBRID` — each applies a different
detection profile. For example, laptop detection is off for **CBT** (screens are
expected) and escalated for **PAPER_PEN**, while movement detection is relaxed for
**PHYSICAL** exams. Every flagged event is ranked **HIGH / MEDIUM / LOW**.

### Standalone pipeline (no DB)

The ML core can run without the API or MongoDB:

```bash
python -m scripts.run_pipeline /path/to/video.mp4 --exam-type PHYSICAL --output out/ --max-frames 300
```

It writes `events.json`, `report.json`, `metadata.json`, the clips, and a heatmap to
the output directory.

---

## API reference

All `/api` routes except register/login require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account (**first account becomes admin**) |
| POST | `/api/auth/login` | Get a JWT |
| GET  | `/api/auth/me` | Current user |
| POST | `/api/exams` | Upload video (multipart: `examName`, `examType`, `video`) → enqueues processing |
| GET  | `/api/exams` | List exams (`?page&page_size&status`) |
| GET  | `/api/exams/{id}` | Exam detail + status + summary |
| GET  | `/api/exams/{id}/events` | Events (`?page&page_size&severity&eventType&personId&reviewed`) |
| GET  | `/api/exams/{id}/report` | Investigation report JSON |
| GET  | `/api/exams/{id}/heatmap` | Motion heatmap PNG *(needs auth header)* |
| GET  | `/api/events/{id}` | Event detail |
| PATCH| `/api/events/{id}` | Review an event (`reviewed`, `reviewStatus`, `reviewerNotes`) |
| GET  | `/api/events/{id}/clip` | Evidence clip, mp4 with HTTP Range / seeking *(needs auth header)* |

### Tests

```bash
cd backend
pytest
```

- `test_event_engine.py` runs the Phase 2 engine against recorded Phase 1B output plus
  unit tests for the pure helpers (recorded-data tests skip automatically if that data
  folder is absent).
- `test_api_smoke.py` boots the app and checks routing / auth wiring — no MongoDB required.
