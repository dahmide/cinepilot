# CinePilot

An AI script supervisor. Upload a screenplay PDF, and CinePilot extracts every character, prop, and location, builds a structured Story Bible, flags continuity errors (vanishing props, character/timeline contradictions, dropped plot threads), and lets you interrogate the script through a grounded chat agent.

Built for the **Agentic Cinema Hackathon** (Google Cloud + Devpost) — ClickHouse Partner Track.

---

## What it does

-   **Extraction** — a two-stage pipeline reads a screenplay PDF and builds a deduplicated registry of characters, props, and locations, then extracts every scene using only canonical entity IDs (never raw strings), preventing duplicate/inconsistent entity references.
-   **Story Bible** — a structured, browsable record of every character, prop, and location, with presence stats, appearance arcs, and cross-links to related entities and continuity issues.
-   **Continuity checking** — four detection types, each requiring an explicit "Scene A establishes X → Scene B contradicts X" pattern before flagging:
    -   **Prop** — deterministic disappearance detection
    -   **Character detail** — LLM-judged contradictions between free-text observations (conservative: costume changes, healing, etc. are not falsely flagged)
    -   **Timeline** — fully deterministic, compares explicit years
    -   **Plot thread** — LLM finds candidates, hard-gated in code (must have 2+ mentions, an explicit setup quote, stated stakes, and remain unresolved)
-   **Chat agent** — a natural-language interface, grounded in the actual extracted script data via ClickHouse, not a general-purpose chatbot. Every answer is backed by a real query against the structured data.

---

## Architecture

```
cinepilot/
├── backend/                  # Python / FastAPI
│   ├── main.py                # FastAPI app, all endpoints, SSE upload pipeline
│   ├── src/
│   │   ├── agents/            # entity_registry_agent, script_reader_agent, chat_agent
│   │   ├── formatters/        # narrative formatters (DB facts → editorial UI text)
│   │   ├── db/                # SQLite auth, ClickHouse load/transform
│   │   └── utils/              # auth, continuity_checker, PDF/OCR helpers
│   ├── venv/                   # main app dependencies
│   └── venv-mcp-clickhouse/    # isolated venv for the ClickHouse MCP tool
└── frontend/                  # Next.js (App Router) / TypeScript / Tailwind
```

### Why two Python virtual environments?

The chat agent calls ClickHouse through **`mcp-clickhouse`**, whose `fastmcp` dependency requires `mcp>=2.0`. The core agent framework, **Google ADK**, requires `mcp<2`. No single environment can satisfy both, so `mcp-clickhouse` runs in an isolated venv (`venv-mcp-clickhouse/`), invoked by the main app as a subprocess over stdio — not a separate network service.

---

## Google Cloud & Partner (ClickHouse) usage — real, runtime integrations

This project genuinely calls both services at runtime; neither is just named in this README.

**Google Cloud (Vertex AI / Gemini)**

-   `backend/src/agents/entity_registry_agent/` and `script_reader_agent/` — call Gemini via **Vertex AI** (Google ADK) to extract and deduplicate entities and scene-level observations from raw screenplay text.
-   `backend/src/agents/chat_agent/agent.py` — the chat agent itself is a Gemini-backed ADK `LlmAgent`.
-   Auth via `GOOGLE_GENAI_USE_VERTEXAI=TRUE`, project-scoped IAM (`roles/aiplatform.user` on the Cloud Run service account) — no API key required.

**ClickHouse (Partner Track)**

-   `backend/src/db/load_to_clickhouse.py` — `transform()`/`insert_all()` are the single source of truth mapping extracted entities into ClickHouse tables (`projects`, `characters`, `props`, `locations`, `scenes`, `scene_appearances`, `scene_observations`, `scene_props`, `continuity_issues`).
-   `backend/src/agents/chat_agent/agent.py` — the chat agent uses the **`mcp-clickhouse`** MCP server as a live tool (`run_query`), letting the LLM issue real SQL against the project's ClickHouse data to answer questions — not a static/cached response.
-   `backend/src/utils/security.py` — `enforce_project_filter()` programmatically rewrites every LLM-issued query to guarantee `WHERE project_id = '<id>'`, regardless of what the model wrote — real query-level enforcement, not just a prompt instruction.

---

## Running locally

### Prerequisites

-   Python 3.12+
-   Node.js + yarn
-   A ClickHouse Cloud instance
-   A Google Cloud project with Vertex AI enabled

### Backend

```bash
cd backend

# Main app environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Isolated MCP/ClickHouse environment
python -m venv venv-mcp-clickhouse
venv-mcp-clickhouse/bin/pip install -r requirements-mcp-clickhouse.txt
```

Create `backend/.env`:

```bash
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=<your-gcp-project-id>
GOOGLE_CLOUD_LOCATION=us-central1

CLICKHOUSE_HOST=<your-instance>.clickhouse.cloud
CLICKHOUSE_USER=default
CLICKHOUSE_DATABASE=default
CLICKHOUSE_PASSWORD=<your-password>
```

Run it:

```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8080
```

### Frontend

```bash
cd frontend
yarn install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

Run it:

```bash
yarn dev
```

Visit `http://localhost:3000`, sign up, and upload a screenplay PDF.

---

## Deployment

-   **Backend** — Google Cloud Run, containerized via `backend/Dockerfile` (builds both `venv` and `venv-mcp-clickhouse` into the image), secrets managed via Secret Manager.
-   **Frontend** — Vercel.

---

## Notes for judges

-   Continuity checks are intentionally conservative — every check type requires an explicit contradiction pattern in the text before flagging, to minimize false positives.
-   The chat agent is fully grounded: it must call `run_query` against real ClickHouse data before answering, and is instructed never to guess.
-   This is a solo hackathon build.
