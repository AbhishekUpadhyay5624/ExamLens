# ExamLens — AI Exam Proctoring & Behavioral Analysis System

**ExamLens is an intelligent exam-proctoring assistant that automatically monitors recorded examination footage for academic integrity violations.**

Instead of manual scrubbing through hours of CCTV recordings, invigilators upload exam footage to ExamLens. The AI engine continuously tracks candidates in frame, detects suspicious behaviors (electronic device usage, unauthorized paper chits, prolonged stillness, excessive movement), extracts precise H.264 evidence clips with glowing bounding box overlays, generates motion heatmaps of the exam hall, and produces a 100% synchronized investigation report. 

ExamLens does not make blind accusations — it surfaces actionable, prioritized evidence so human reviewers can verify integrity in minutes rather than hours.

---

## Key Technical Highlights & Features

- **Dynamic Duration-Based Frame Skipping**: Automatically scales processing speed for long CCTV footage (1hr, 2hr+):
  - **< 10 mins**: Process 100% of frames (`frame_skip = 1`)
  - **10–15 mins**: Skip 3 frames (`frame_skip = 3`)
  - **15–20 mins**: Skip 7 frames (`frame_skip = 7`)
  - **20–30 mins**: Skip 10 frames (`frame_skip = 10`)
  - **30+ mins**: Skip 25 frames (`frame_skip = 25`)
  - *ByteTrack matching scaling*: ByteTrack scales `effective_fps` dynamically so candidate track IDs remain smooth and continuous without tracking loss across skipped frames.
- **Consolidated Proximity Merging & 25s Clip Cap**:
  - Automatically merges closely occurring candidate incidents (within 3.5s) into unified event clips.
  - Caps maximum evidence clip duration to **25 seconds** (`min(25.0, duration)`), eliminating redundant 2-second clip fragments.
- **100% Event Count & Summary Synchronization**:
  - Dynamically synchronizes event counts, severity breakdowns, and event types across the **Investigation Report**, **Dashboard KPI Cards**, **Recharts Bar Graphs**, and **Flagged Events Table**.
  - Automatically filters out clip-less orphaned rows so reviewers only see reviewable events with playable H.264 video clips.
- **Interactive Deletion & Upload Cancellation**:
  - **Trash Can Delete**: Purge exam recordings, MongoDB records, and extracted evidence files via `DELETE /api/exams/{id}`.
  - **Upload Cancellation**: Abort in-flight video uploads instantly via `AbortController`.
  - **Job Cancellation**: Cancel running analysis jobs directly from the processing dashboard.
- **Animated Landing Page & Adaptive Theme**:
  - Continuous scroll-triggered Framer Motion entrance animations.
  - Interactive AI Surveillance Radar with telemetry node sweeps.
  - Light/Dark mode context adaptation with clean date formatting (`Aug 23, 2026`).

---

## Contents

1. [Requirements](#requirements)
2. [Architecture](#architecture)
3. [Frontend Stack](#frontend-stack)
4. [Backend & ML Stack](#backend--ml-stack)
5. [Setup & Local Run](#setup--local-run)
6. [Dynamic Frame Skipping & Pipeline Configuration](#dynamic-frame-skipping--pipeline-configuration)
7. [API Reference](#api-reference)

---

## Requirements

The application runs locally without mandatory cloud dependencies:

| Requirement | Version / Notes |
|-------------|-----------------|
| **Python** | 3.11+ — FastAPI backend and PyTorch / YOLO ML pipeline |
| **Node.js + npm** | Node 18+ (npm 9+) — React Vite frontend |
| **MongoDB** | MongoDB Community running locally at `mongodb://localhost:27017` (or MongoDB Atlas URI) |
| **YOLO Weights** | `backend/yolo11m.pt` (or `yolo11n.pt`) included out-of-the-box |
| **ffmpeg** | *Optional.* Bundled `imageio-ffmpeg` used as fallback; OpenCV used if missing |
| **OS** | Windows 10/11, macOS, or Linux |

**Default Ports:** API runs on **`8000`**, Frontend runs on **`5173`**.

---

## Architecture

ExamLens consists of three main decoupled services: the **React Single Page App**, the **FastAPI REST API**, and the **Asynchronous Background Worker**.

```
                                              ┌──────────────────────────────┐
   Browser (React SPA, :5173)                 │        FastAPI API (:8000)   │
   ┌───────────────────────────┐              │                              │
   │  Landing / Upload Library │  JWT + JSON  │  routers → services          │
   │  Dashboard / Event Review │ ───────────▶ │  (async Motor driver)        │
   │  Report / Heatmap & Clips │ ◀─────────── │                              │
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

### Repository Layout

```
ExamLens/
├── README.md               ← Documentation
├── docker-compose.yml      ← Containerized environment (Mongo + API)
├── backend/                ← FastAPI service & ML pipeline
│   ├── app/                ← REST API: main, routers/, services/, schemas/, deps
│   ├── ml/                 ← ML pipeline: config, detector, tracker, event_engine, clips, heatmap, pipeline
│   ├── worker/             ← Background processing runner & persistence
│   ├── scripts/            ← Standalone CLI pipeline runner
│   ├── tests/              ← pytest suite
│   ├── storage/            ← Uploaded videos, clips, and heatmaps
│   └── requirements.txt
└── frontend/               ← React + Vite Web Application
    └── src/
        ├── components/     ← AISurveillanceRadar, EventsTable, SummaryCards, SeverityCharts, UploadDropzone, …
        ├── pages/          ← Home, ExamsList (Uploads Library), Upload, ExamDashboard, EventDetail, Report, Login, Register
        └── lib/            ← api (axios), auth, queryClient, constants, format
```

---

## Frontend Stack

- **React 18**: Component-driven UI framework
- **Vite 6**: Fast dev server and build pipeline
- **Tailwind CSS v4**: Utility-first styling via `@tailwindcss/vite`
- **Framer Motion**: Smooth continuous scroll animations & modal overlays
- **TanStack Query v5**: Server-state management and real-time polling
- **Recharts**: Responsive severity and event-type bar charts
- **Lucide React**: Modern icon set

---

## Backend & ML Stack

- **FastAPI + Uvicorn**: Async Python web backend
- **Motor (async) & PyMongo (sync)**: Dual MongoDB access strategy for API routes and worker threads
- **Ultralytics YOLOv11**: Real-time object detection (Person #0, Laptop #63, Cell Phone #67, Book/Paper #73)
- **Supervision (ByteTrack)**: Multi-object temporal tracking across frames
- **OpenCV (MOG2)**: Motion region-of-interest detection & H.264 video bounding box overlay rendering
- **Matplotlib**: Motion heatmap generator

---

## Setup & Local Run

### 1. Backend Server

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Interactive API documentation available at: `http://localhost:8000/docs`

### 2. Frontend Development Server

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open your browser at: `http://localhost:5173`

---

## Dynamic Frame Skipping & Pipeline Configuration

Pipeline parameters can be customized in `backend/ml/config.py` or `.env`:

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `MIN_EVENT_CONFIDENCE` | `0.55` | Confidence cutoff for event detection |
| `EVENT_MERGE_GAP_GLOBAL` | `5.0s` | Maximum gap between consecutive same-person events |
| `CONTEXT_SECONDS` | `2.5s` | Time padding added before/after evidence clips |
| `MAX_CLIP_DURATION` | `25.0s` | Strict upper limit for extracted clip duration |
| `TEACHER_TRAVEL_THRESHOLD_PX` | `500.0` | Travel distance to distinguish invigilators from seated students |

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/auth/register` | Register new account (first user becomes Admin) |
| **POST** | `/api/auth/login` | Authenticate user and issue JWT |
| **GET** | `/api/auth/me` | Fetch current user credentials |
| **POST** | `/api/exams` | Upload CCTV footage & enqueue analysis job |
| **GET** | `/api/exams` | List uploaded exam sessions with pagination |
| **GET** | `/api/exams/{id}` | Fetch exam metadata, status, & synchronized summary |
| **DELETE** | `/api/exams/{id}` | Delete exam recording, DB records, and evidence files |
| **GET** | `/api/exams/{id}/events` | Fetch flagged evidence events |
| **GET** | `/api/exams/{id}/report` | Retrieve investigation report JSON |
| **GET** | `/api/exams/{id}/heatmap` | Fetch generated motion heatmap PNG |
| **GET** | `/api/events/{id}` | Fetch specific event detail |
| **PATCH** | `/api/events/{id}` | Review event (`confirmed` / `false_positive` + notes) |
| **GET** | `/api/events/{id}/clip` | Stream H.264 evidence video clip |

### Automated Testing

```bash
cd backend
pytest
```
