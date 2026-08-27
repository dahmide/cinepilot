"""
FastAPI backend for CinePilot.
"""

import asyncio
import json
import os
import tempfile
import uuid
from datetime import datetime, timezone

import clickhouse_connect
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google.adk.runners import InMemoryRunner
from google.genai import types
from pydantic import BaseModel
from pypdf import PdfReader

from entity_registry_agent.agent import root_agent as entity_registry_agent
from script_reader_agent.agent import root_agent as script_reader_agent
from chat_agent.agent import make_chat_agent
import load_to_clickhouse
import continuity_checker
import issue_narrative_formatters
import story_narrative_formatters
from auth import (
    COOKIE_NAME,
    TOKEN_EXPIRE_DAYS,
    create_token,
    get_current_user,
    hash_password,
    verify_password,
)
from database import create_user, get_user_by_username, init_db

load_dotenv("script_reader_agent/.env")

init_db()

app = FastAPI(title="CinePilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_ch_client():
    return clickhouse_connect.get_client(
        host=os.environ["CLICKHOUSE_HOST"],
        user=os.environ["CLICKHOUSE_USER"],
        password=os.environ["CLICKHOUSE_PASSWORD"],
        secure=True,
    )


def read_pdf_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)

    if len(text.strip()) < 100:
        from pdf2image import convert_from_path
        import pytesseract
        images = convert_from_path(pdf_path)
        ocr_text = ""
        for image in images:
            ocr_text += pytesseract.image_to_string(image) + "\n"
        return ocr_text

    return text


async def run_entity_registry(script_text: str) -> dict:
    runner = InMemoryRunner(
        agent=entity_registry_agent,
        app_name="continuity_copilot"
    )
    session = await runner.session_service.create_session(
        app_name="continuity_copilot", user_id="api_user"
    )
    final_text = ""
    async for event in runner.run_async(
        user_id="api_user",
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[types.Part(text=script_text)]
        ),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text
    return json.loads(final_text)


async def run_scene_extraction(script_text: str, registry: dict) -> dict:
    runner = InMemoryRunner(
        agent=script_reader_agent,
        app_name="continuity_copilot"
    )
    session = await runner.session_service.create_session(
        app_name="continuity_copilot", user_id="api_user"
    )
    message = f"""ENTITY REGISTRY:
{json.dumps(registry, indent=2)}

SCREENPLAY TEXT:
{script_text}"""

    final_text = ""
    async for event in runner.run_async(
        user_id="api_user",
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[types.Part(text=message)]
        ),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text
    return json.loads(final_text)


async def run_chat_agent(question: str, project_id: str, user_id: str) -> str:
    agent = make_chat_agent(project_id)

    runner = InMemoryRunner(
        agent=agent,
        app_name="continuity_copilot_chat"
    )
    session = await runner.session_service.create_session(
        app_name="continuity_copilot_chat", user_id=user_id
    )
    final_text = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[types.Part(text=question)]
        ),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text
    return final_text


def make_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


# ── Pipeline steps ─────────────────────────────────────────────────────────────

def load_data_to_clickhouse(
    project_id, user_id, title, genre, page_count, registry, extraction,
):
    """Inserts the projects row, then delegates entity/scene loading to
    load_to_clickhouse.transform() + insert_all() — the single source of
    truth for how extraction output maps onto ClickHouse tables, shared
    with the standalone load_to_clickhouse.py script."""
    client = get_ch_client()
    analyzed_at = datetime.utcnow()

    client.insert("projects", [[
        project_id, user_id, title, genre, page_count, analyzed_at, "ready"
    ]], column_names=[
        "project_id", "user_id", "title", "genre",
        "page_count", "analyzed_at", "status"
    ])

    rows = load_to_clickhouse.transform(registry, extraction, project_id)
    load_to_clickhouse.insert_all(client, *rows)


def run_continuity_checks(project_id):
    client = get_ch_client()
    all_issues = continuity_checker.run_all_checks(client, project_id)

    if all_issues:
        rows = []
        for i, issue in enumerate(all_issues, start=1):
            rows.append((
                project_id, i,
                issue.get("character_id", ""),
                issue.get("characters", []),
                issue.get("prop_id", ""),
                issue["introduced_scene"],
                issue["missing_by_scene"],
                issue["title"],
                issue["description"],
                issue["type"],
                issue.get("setup_quote"),
                issue.get("stakes"),          
            ))
        client.insert("continuity_issues", rows, column_names=[
            "project_id", "issue_id", "character_id", "characters",
            "prop_id", "introduced_scene", "missing_by_scene",
            "title", "description", "issue_type", "setup_quote", "stakes",
            #                                                    
        ])

    return len(all_issues)




# ── Upload pipeline (SSE) ──────────────────────────────────────────────────────

async def process_pipeline(file_bytes, user_id, title, genre, page_count):
    tmp_path = None
    project_id = str(uuid.uuid4())

    try:
        # Stage 1: Uploading
        yield make_event("stage", {"stage": "uploading", "message": "File received"})
        await asyncio.sleep(0.3)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        # Stage 2: Reading script
        yield make_event("stage", {"stage": "reading_script", "message": "Extracting text from PDF..."})

        try:
            script_text = await asyncio.to_thread(read_pdf_text, tmp_path)

            yield make_event("stage", {"stage": "reading_script", "message": "Building entity registry..."})

            registry_task = asyncio.create_task(run_entity_registry(script_text))
            while not registry_task.done():
                await asyncio.sleep(15)
                yield ": heartbeat\n\n"
            registry = await registry_task

            yield make_event("stage", {"stage": "reading_script", "message": "Extracting scenes..."})

            extraction_task = asyncio.create_task(run_scene_extraction(script_text, registry))
            while not extraction_task.done():
                await asyncio.sleep(15)
                yield ": heartbeat\n\n"
            extraction = await extraction_task

        except Exception as e:
            yield make_event("error", {"message": f"Script reading failed: {str(e)}"})
            return

        # Stage 3: Building memory
        yield make_event("stage", {"stage": "building_memory", "message": "Building Story Bible..."})

        try:
            await asyncio.to_thread(
                load_data_to_clickhouse,
                project_id, user_id, title, genre, page_count,
                registry, extraction,
            )
        except Exception as e:
            yield make_event("error", {"message": f"Story Bible build failed: {str(e)}"})
            return

        # Stage 4: Checking issues
        yield make_event("stage", {"stage": "checking_issues", "message": "Detecting continuity issues..."})

        try:
            await asyncio.to_thread(run_continuity_checks, project_id)
        except Exception as e:
            yield make_event("error", {"message": f"Continuity check failed: {str(e)}"})
            return

        yield make_event("complete", {"status": "success", "projectId": project_id})

    except Exception as e:
        yield make_event("error", {"message": f"Unexpected error: {str(e)}"})

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ── Auth endpoints ─────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    username: str
    password: str


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="strict",
        max_age=TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )


@app.post("/auth/signup")
def signup(body: AuthRequest, response: Response):
    from fastapi import HTTPException
    if get_user_by_username(body.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    password_hash = hash_password(body.password)

    create_user(user_id, body.username, password_hash, created_at)

    token = create_token(user_id)
    set_auth_cookie(response, token)

    return {"userId": user_id, "username": body.username}


@app.post("/auth/login")
def login(body: AuthRequest, response: Response):
    from fastapi import HTTPException
    user = get_user_by_username(body.username)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_token(user["user_id"])
    set_auth_cookie(response, token)

    return {"userId": user["user_id"], "username": user["username"]}


@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME)
    return {"status": "logged out"}


@app.get("/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    return {
        "userId": current_user["user_id"],
        "username": current_user["username"],
    }


# ── Upload endpoints ───────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_screenplay(
    file: UploadFile = File(...),
    title: str = Form(...),
    genre: str = Form(...),
    page_count: int = Form(...),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    return StreamingResponse(
        process_pipeline(
            file_bytes,
            current_user["user_id"],
            title,
            genre,
            page_count,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/upload/demo")
async def upload_demo(current_user: dict = Depends(get_current_user)):
    demo_path = os.path.join(os.path.dirname(__file__), "demo", "sample.pdf")

    if not os.path.exists(demo_path):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Demo screenplay not found"
        )

    with open(demo_path, "rb") as f:
        file_bytes = f.read()

    return StreamingResponse(
        process_pipeline(
            file_bytes,
            current_user["user_id"],
            "Sample Screenplay",
            "Unknown",
            0,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Project endpoints ──────────────────────────────────────────────────────────

@app.get("/projects")
def get_projects(current_user: dict = Depends(get_current_user)):
    client = get_ch_client()
    rows = client.query("""
        SELECT project_id, title, genre, page_count, analyzed_at, status
        FROM projects
        WHERE user_id = {uid:String}
        ORDER BY analyzed_at DESC
    """, parameters={"uid": current_user["user_id"]}).result_set

    return [
        {
            "projectId": r[0],
            "title": r[1],
            "genre": r[2],
            "pageCount": r[3],
            "analyzedAt": str(r[4]).split(" ")[0],
            "status": r[5],
        }
        for r in rows
    ]


@app.get("/projects/{project_id}")
def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    client = get_ch_client()
    rows = client.query("""
        SELECT project_id, user_id, title, genre, page_count, analyzed_at, status
        FROM projects
        WHERE project_id = {pid:String} AND user_id = {uid:String}
    """, parameters={
        "pid": project_id,
        "uid": current_user["user_id"],
    }).result_set

    if not rows:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")

    r = rows[0]
    return {
        "projectId": r[0],
        "userId": r[1],
        "title": r[2],
        "genre": r[3],
        "pageCount": r[4],
        "analyzedAt": str(r[5]).split(" ")[0],
        "status": r[6],
    }


@app.get("/projects/{project_id}/dashboard")
def get_dashboard(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    client = get_ch_client()

    scenes = client.query(
        "SELECT count(*) FROM scenes WHERE project_id = {pid:String}",
        parameters={"pid": project_id}
    ).result_set[0][0]

    characters = client.query(
        "SELECT count(*) FROM characters WHERE project_id = {pid:String}",
        parameters={"pid": project_id}
    ).result_set[0][0]

    props = client.query(
        "SELECT count(*) FROM props WHERE project_id = {pid:String}",
        parameters={"pid": project_id}
    ).result_set[0][0]

    flags = client.query(
        "SELECT count(*) FROM continuity_issues WHERE project_id = {pid:String}",
        parameters={"pid": project_id}
    ).result_set[0][0]

    return {
        "scenes": scenes,
        "characters": characters,
        "props": props,
        "flags": flags,
    }


@app.get("/projects/{project_id}/issues")
def get_issues(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    client = get_ch_client()
    rows = client.query("""
        SELECT issue_id, characters, prop_id, introduced_scene,
               missing_by_scene, title, description, issue_type
        FROM continuity_issues
        WHERE project_id = {pid:String}
        ORDER BY issue_id
    """, parameters={"pid": project_id}).result_set

    return [
        {
            "issueId": r[0],
            "characters": r[1],
            "propId": r[2],
            "introducedScene": r[3],
            "missingByScene": r[4],
            "title": r[5],
            "description": r[6],
            "issueType": r[7],
        }
        for r in rows
    ]


@app.get("/projects/{project_id}/issues/{issue_id}")
def get_issue_detail(
    project_id: str,
    issue_id: int,
    current_user: dict = Depends(get_current_user),
):
    client = get_ch_client()
    rows = client.query("""
        SELECT issue_id, character_id, characters, prop_id, introduced_scene,
               missing_by_scene, title, description, issue_type, setup_quote, stakes
        FROM continuity_issues
        WHERE project_id = {pid:String} AND issue_id = {iid:UInt32}
    """, parameters={"pid": project_id, "iid": issue_id}).result_set

    if not rows:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Issue not found")

    r = rows[0]
    issue = {
        "issue_id": r[0],
        "character_id": r[1],
        "characters": list(r[2]),
        "prop_id": r[3],
        "introduced_scene": r[4],
        "missing_by_scene": r[5],
        "title": r[6],
        "description": r[7],
        "issue_type": r[8],
        "setup_quote": r[9],
        "stakes": r[10],
    }

    established, contradicted = _build_findings(client, project_id, issue)
    labels = issue_narrative_formatters.FINDINGS_LABELS.get(
        issue["issue_type"], ("Where it's established", "Where it's contradicted")
    )

    prop_name = None
    if issue["prop_id"]:
        prop_rows = client.query("""
            SELECT prop_name FROM props
            WHERE project_id = {pid:String} AND prop_id = {prop_id:String}
            LIMIT 1
        """, parameters={"pid": project_id, "prop_id": issue["prop_id"]}).result_set
        prop_name = prop_rows[0][0] if prop_rows else None

    character_ids = [issue["character_id"]] if issue["character_id"] else []

    involved_characters = [
        {"id": character_ids[i], "name": name}
        for i, name in enumerate(issue["characters"])
        if i < len(character_ids)
    ]

    involved_props = []
    if issue["prop_id"] and prop_name:
        involved_props.append({"id": issue["prop_id"], "name": prop_name})

    involved_locations = _resolve_locations(
        client, project_id, [issue["introduced_scene"], issue["missing_by_scene"]]
    )

    return {
        "issueId": issue["issue_id"],
        "issueType": issue["issue_type"],
        "title": issue["title"],
        "description": issue["description"],
        "introducedScene": issue["introduced_scene"],
        "missingByScene": issue["missing_by_scene"],
        "findings": {
            "established": established,
            "contradicted": contradicted,
            "stakes": issue["stakes"] if issue["issue_type"] == "plot_thread" else None,
        },
        "involved": {
            "characters": involved_characters,
            "props": involved_props,
            "locations": involved_locations,
            "scenes": [issue["introduced_scene"], issue["missing_by_scene"]],
        },
    }


def _resolve_locations(client, project_id: str, scene_numbers: list[int]) -> list[dict]:
    """Resolves a list of scene numbers to their distinct locations, deduped
    by location_id, preserving first-seen order."""
    rows = client.query("""
        SELECT DISTINCT s.location_id, l.location_name
        FROM scenes s
        JOIN locations l
            ON s.location_id = l.location_id AND s.project_id = l.project_id
        WHERE s.project_id = {pid:String}
            AND s.scene_number IN ({scenes:Array(UInt32)})
    """, parameters={"pid": project_id, "scenes": scene_numbers}).result_set

    return [{"id": r[0], "name": r[1]} for r in rows]

def _build_findings(client, project_id: str, issue: dict) -> tuple[str, str]:
    """Dispatches to the right issue_narrative_formatters function, re-deriving
    whatever extra per-type inputs that formatter needs via a single-row
    point lookup (indexed, cheap — see issue_narrative_formatters.py header)."""
    issue_type = issue["issue_type"]

    if issue_type == "prop":
        prop_rows = client.query("""
            SELECT prop_name FROM props
            WHERE project_id = {pid:String} AND prop_id = {prop_id:String}
            LIMIT 1
        """, parameters={"pid": project_id, "prop_id": issue["prop_id"]}).result_set
        issue_with_name = {**issue, "prop_name": prop_rows[0][0] if prop_rows else "the object"}
        return issue_narrative_formatters.format_prop_findings(issue_with_name)

    if issue_type == "character_detail":
        character_id = None
        if issue["characters"]:
            char_rows = client.query("""
                SELECT character_id FROM characters
                WHERE project_id = {pid:String} AND canonical_name = {name:String}
                LIMIT 1
            """, parameters={"pid": project_id, "name": issue["characters"][0]}).result_set
            character_id = char_rows[0][0] if char_rows else None

        value_a, value_b = "", ""
        if character_id:
            obs_rows = client.query("""
                SELECT scene_id, value FROM scene_observations
                WHERE project_id = {pid:String}
                    AND character_id = {cid:String}
                    AND scene_id IN ({a:UInt32}, {b:UInt32})
                ORDER BY scene_id
            """, parameters={
                "pid": project_id, "cid": character_id,
                "a": issue["introduced_scene"], "b": issue["missing_by_scene"],
            }).result_set
            values_by_scene = {row[0]: row[1] for row in obs_rows}
            value_a = values_by_scene.get(issue["introduced_scene"], "an unspecified state")
            value_b = values_by_scene.get(issue["missing_by_scene"], "an unspecified state")

        return issue_narrative_formatters.format_character_detail_findings(issue, value_a, value_b)

    if issue_type == "timeline":
        ref_rows = client.query("""
            SELECT scene_number, time_reference FROM scenes
            WHERE project_id = {pid:String}
                AND scene_number IN ({a:UInt32}, {b:UInt32})
            ORDER BY scene_number
        """, parameters={
            "pid": project_id,
            "a": issue["introduced_scene"], "b": issue["missing_by_scene"],
        }).result_set
        refs_by_scene = {row[0]: row[1] for row in ref_rows}
        ref_a = refs_by_scene.get(issue["introduced_scene"], "an unspecified time")
        ref_b = refs_by_scene.get(issue["missing_by_scene"], "an unspecified time")
        return issue_narrative_formatters.format_timeline_findings(issue, ref_a, ref_b)

    if issue_type == "plot_thread":
        quote = issue.get("setup_quote") or "this moment"
        return issue_narrative_formatters.format_plot_thread_findings(issue, quote)

    # Fallback for an unrecognized issue_type — should not happen given the
    # locked 4-type taxonomy, but avoids a hard crash if it ever does.
    return (
        f"Scene {issue['introduced_scene']}: established here.",
        f"Scene {issue['missing_by_scene']}: contradicted here.",
    )

@app.get("/projects/{project_id}/story")
def get_story(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    client = get_ch_client()

    # Resolve location_ids to names
    loc_name_rows = client.query("""
        SELECT location_id, location_name FROM locations
        WHERE project_id = {pid:String}
    """, parameters={"pid": project_id}).result_set
    loc_id_to_name = {r[0]: r[1] for r in loc_name_rows}

    # Resolve prop_ids to canonical names for display
    prop_name_rows = client.query("""
        SELECT prop_id, prop_name FROM props
        WHERE project_id = {pid:String}
    """, parameters={"pid": project_id}).result_set
    prop_id_to_name = {r[0]: r[1] for r in prop_name_rows}

    # Count continuity flags per character
    char_flag_rows = client.query("""
        SELECT character_id, count(*) as flag_count
        FROM continuity_issues
        WHERE project_id = {pid:String}
        GROUP BY character_id
    """, parameters={"pid": project_id}).result_set
    char_flag_count = {r[0]: r[1] for r in char_flag_rows}

    # Characters
    char_rows = client.query("""
        SELECT
            c.character_id,
            c.canonical_name,
            c.aliases,
            c.confidence,
            c.first_appearance_scene,
            count(sa.scene_id) AS appearance_count,
            groupArray(sa.scene_id) AS appears_in,
            groupArray(DISTINCT s.location_id) AS locations,
            arrayFlatten(groupArray(sa.props_carried)) AS props
        FROM characters c
        LEFT JOIN scene_appearances sa
            ON c.character_id = sa.character_id
            AND c.project_id = sa.project_id
        LEFT JOIN scenes s
            ON sa.scene_id = s.scene_id
            AND sa.project_id = s.project_id
        WHERE c.project_id = {pid:String}
        GROUP BY
            c.character_id, c.canonical_name, c.aliases,
            c.confidence, c.first_appearance_scene
        ORDER BY appearance_count DESC
    """, parameters={"pid": project_id}).result_set

    characters = [
        {
            "characterId": r[0],
            "characterName": r[1],
            "aliases": list(r[2]),
            "confidence": r[3],
            "firstScene": r[4],
            "appearsIn": sorted(list(set(r[6]))),
            "locations": [
                loc_id_to_name.get(loc, loc)
                for loc in set(r[7])
                if loc
            ],
            "props": list(set(
                prop_id_to_name.get(p, p)
                for p in r[8]
                if p
            )),
            "continuityFlags": char_flag_count.get(r[0], 0),
        }
        for r in char_rows
    ]

    for c in characters:
        c["intro"] = story_narrative_formatters.format_character(c)["intro"]

    # Count continuity flags per prop
    prop_flag_rows = client.query("""
        SELECT prop_id, count(*) as flag_count
        FROM continuity_issues
        WHERE project_id = {pid:String}
        GROUP BY prop_id
    """, parameters={"pid": project_id}).result_set
    prop_flag_count = {r[0]: r[1] for r in prop_flag_rows}

    # Associated characters per prop
    prop_char_rows = client.query("""
        SELECT sp.prop_id, groupArray(DISTINCT c.canonical_name) AS chars
        FROM scene_props sp
        JOIN scene_appearances sa
            ON sp.scene_id = sa.scene_id
            AND sp.project_id = sa.project_id
        JOIN characters c
            ON sa.character_id = c.character_id
            AND sa.project_id = c.project_id
        WHERE sp.project_id = {pid:String}
            AND has(sa.props_carried, sp.prop_id)
        GROUP BY sp.prop_id
    """, parameters={"pid": project_id}).result_set
    prop_chars = {r[0]: list(r[1]) for r in prop_char_rows}

    # Props
    prop_rows = client.query("""
        SELECT
            p.prop_id,
            p.prop_name,
            p.aliases,
            p.confidence,
            p.category,
            min(sp.scene_id) AS introduced_scene,
            max(sp.scene_id) AS last_seen_scene,
            groupArray(sp.scene_id) AS seen_in
        FROM props p
        LEFT JOIN scene_props sp
            ON p.prop_id = sp.prop_id
            AND p.project_id = sp.project_id
        WHERE p.project_id = {pid:String}
        GROUP BY p.prop_id, p.prop_name, p.aliases, p.confidence, p.category
        ORDER BY introduced_scene ASC
    """, parameters={"pid": project_id}).result_set

    props = [
        {
            "propId": r[0],
            "propName": r[1],
            "aliases": list(r[2]),
            "confidence": r[3],
            "category": r[4],
            "introducedScene": r[5],
            "lastSeenScene": r[6],
            "seenIn": sorted(list(set(r[7]))),
            "associatedCharacters": prop_chars.get(r[0], []),
            "continuityFlags": prop_flag_count.get(r[0], 0),
        }
        for r in prop_rows
    ]

    for p in props:
        p["intro"] = story_narrative_formatters.format_prop(p)["intro"]

    # Characters per location
    loc_char_rows = client.query("""
        SELECT s.location_id, groupArray(DISTINCT c.canonical_name) AS chars
        FROM scenes s
        JOIN scene_appearances sa
            ON s.scene_id = sa.scene_id
            AND s.project_id = sa.project_id
        JOIN characters c
            ON sa.character_id = c.character_id
            AND sa.project_id = c.project_id
        WHERE s.project_id = {pid:String}
        GROUP BY s.location_id
    """, parameters={"pid": project_id}).result_set
    loc_chars = {r[0]: list(r[1]) for r in loc_char_rows}

    # Props per location
    loc_prop_rows = client.query("""
        SELECT s.location_id, groupArray(DISTINCT p.prop_name) AS props
        FROM scenes s
        JOIN scene_props sp
            ON s.scene_id = sp.scene_id
            AND s.project_id = sp.project_id
        JOIN props p
            ON sp.prop_id = p.prop_id
            AND sp.project_id = p.project_id
        WHERE s.project_id = {pid:String}
        GROUP BY s.location_id
    """, parameters={"pid": project_id}).result_set
    loc_props = {r[0]: list(r[1]) for r in loc_prop_rows}

    # Locations
    loc_rows = client.query("""
        SELECT
            l.location_id,
            l.location_name,
            l.aliases,
            l.confidence,
            min(s.scene_number) AS first_scene,
            count(s.scene_id) AS scene_count,
            groupArray(s.scene_number) AS appears_in
        FROM locations l
        LEFT JOIN scenes s
            ON l.location_id = s.location_id
            AND l.project_id = s.project_id
        WHERE l.project_id = {pid:String}
        GROUP BY l.location_id, l.location_name, l.aliases, l.confidence
        ORDER BY first_scene ASC
    """, parameters={"pid": project_id}).result_set

    locations = [
        {
            "locationId": r[0],
            "locationName": r[1],
            "aliases": list(r[2]),
            "confidence": r[3],
            "firstScene": r[4],
            "appearsIn": sorted(list(set(r[6]))),
            "characters": loc_chars.get(r[0], []),
            "props": loc_props.get(r[0], []),
            "continuityFlags": 0,
        }
        for r in loc_rows
    ]

    for l in locations:
        l["intro"] = story_narrative_formatters.format_location(l)["intro"]

    return {
        "characters": characters,
        "props": props,
        "locations": locations,
    }


@app.get("/projects/{project_id}/story/{entity_type}/{entity_id}")
def get_story_entity_detail(
    project_id: str,
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user),
):
    from fastapi import HTTPException

    if entity_type not in ("character", "prop", "location"):
        raise HTTPException(status_code=404, detail="Unknown entity type")

    client = get_ch_client()

    if entity_type == "character":
        loc_name_rows = client.query("""
            SELECT location_id, location_name FROM locations
            WHERE project_id = {pid:String}
        """, parameters={"pid": project_id}).result_set
        loc_id_to_name = {r[0]: r[1] for r in loc_name_rows}

        prop_name_rows = client.query("""
            SELECT prop_id, prop_name FROM props
            WHERE project_id = {pid:String}
        """, parameters={"pid": project_id}).result_set
        prop_id_to_name = {r[0]: r[1] for r in prop_name_rows}

        rows = client.query("""
            SELECT
                c.character_id,
                c.canonical_name,
                c.aliases,
                c.confidence,
                c.first_appearance_scene,
                count(sa.scene_id) AS appearance_count,
                groupArray(sa.scene_id) AS appears_in,
                groupArray(DISTINCT s.location_id) AS locations,
                arrayFlatten(groupArray(sa.props_carried)) AS props
            FROM characters c
            LEFT JOIN scene_appearances sa
                ON c.character_id = sa.character_id AND c.project_id = sa.project_id
            LEFT JOIN scenes s
                ON sa.scene_id = s.scene_id AND sa.project_id = s.project_id
            WHERE c.project_id = {pid:String} AND c.character_id = {eid:String}
            GROUP BY c.character_id, c.canonical_name, c.aliases,
                     c.confidence, c.first_appearance_scene
        """, parameters={"pid": project_id, "eid": entity_id}).result_set

        if not rows:
            raise HTTPException(status_code=404, detail="Character not found")

        r = rows[0]
        flag_rows = client.query("""
            SELECT count(*) FROM continuity_issues
            WHERE project_id = {pid:String} AND character_id = {eid:String}
        """, parameters={"pid": project_id, "eid": entity_id}).result_set

        entity = {
            "characterId": r[0],
            "characterName": r[1],
            "aliases": list(r[2]),
            "confidence": r[3],
            "firstScene": r[4],
            "appearsIn": sorted(list(set(r[6]))),
            "locations": [loc_id_to_name.get(loc, loc) for loc in set(r[7]) if loc],
            "props": list(set(prop_id_to_name.get(p, p) for p in r[8] if p)),
            "continuityFlags": flag_rows[0][0],
        }

        narrative = story_narrative_formatters.format_character(entity)
        related_issue_rows = client.query("""
            SELECT issue_id, title FROM continuity_issues
            WHERE project_id = {pid:String} AND character_id = {eid:String}
            ORDER BY issue_id
        """, parameters={"pid": project_id, "eid": entity_id}).result_set

        return {
            "entityType": "character",
            "entityId": entity["characterId"],
            "name": entity["characterName"],
            "meta": f"CHARACTER · {len(entity['appearsIn'])} APPEARANCES",
            "intro": narrative["intro"],
            "subFacts": narrative["subFacts"],
            "relatedEntities": entity["locations"] + entity["props"],
            "relatedIssues": [{"issueId": r[0], "title": r[1]} for r in related_issue_rows],
        }

    if entity_type == "prop":
        char_rows = client.query("""
            SELECT sp.prop_id, groupArray(DISTINCT c.canonical_name) AS chars
            FROM scene_props sp
            JOIN scene_appearances sa
                ON sp.scene_id = sa.scene_id AND sp.project_id = sa.project_id
            JOIN characters c
                ON sa.character_id = c.character_id AND sa.project_id = c.project_id
            WHERE sp.project_id = {pid:String} AND sp.prop_id = {eid:String}
                AND has(sa.props_carried, sp.prop_id)
            GROUP BY sp.prop_id
        """, parameters={"pid": project_id, "eid": entity_id}).result_set
        associated = list(char_rows[0][1]) if char_rows else []

        rows = client.query("""
            SELECT
                p.prop_id, p.prop_name, p.aliases, p.confidence, p.category,
                min(sp.scene_id) AS introduced_scene,
                max(sp.scene_id) AS last_seen_scene,
                groupArray(sp.scene_id) AS seen_in
            FROM props p
            LEFT JOIN scene_props sp
                ON p.prop_id = sp.prop_id AND p.project_id = sp.project_id
            WHERE p.project_id = {pid:String} AND p.prop_id = {eid:String}
            GROUP BY p.prop_id, p.prop_name, p.aliases, p.confidence, p.category
        """, parameters={"pid": project_id, "eid": entity_id}).result_set

        if not rows:
            raise HTTPException(status_code=404, detail="Prop not found")

        r = rows[0]
        flag_rows = client.query("""
            SELECT count(*) FROM continuity_issues
            WHERE project_id = {pid:String} AND prop_id = {eid:String}
        """, parameters={"pid": project_id, "eid": entity_id}).result_set

        entity = {
            "propId": r[0],
            "propName": r[1],
            "aliases": list(r[2]),
            "confidence": r[3],
            "category": r[4],
            "introducedScene": r[5],
            "lastSeenScene": r[6],
            "seenIn": sorted(list(set(r[7]))),
            "associatedCharacters": associated,
            "continuityFlags": flag_rows[0][0],
        }

        narrative = story_narrative_formatters.format_prop(entity)
        related_issue_rows = client.query("""
            SELECT issue_id, title FROM continuity_issues
            WHERE project_id = {pid:String} AND prop_id = {eid:String}
            ORDER BY issue_id
        """, parameters={"pid": project_id, "eid": entity_id}).result_set

        badge = "COSTUME" if entity["category"] == "costume" else "PROP"

        return {
            "entityType": "prop",
            "entityId": entity["propId"],
            "name": entity["propName"],
            "meta": f"{badge} · SEEN IN {len(entity['seenIn'])} SCENES",
            "intro": narrative["intro"],
            "subFacts": narrative["subFacts"],
            "relatedEntities": entity["associatedCharacters"],
            "relatedIssues": [{"issueId": r[0], "title": r[1]} for r in related_issue_rows],
        }

    # entity_type == "location"
    char_rows = client.query("""
        SELECT s.location_id, groupArray(DISTINCT c.canonical_name) AS chars
        FROM scenes s
        JOIN scene_appearances sa
            ON s.scene_id = sa.scene_id AND s.project_id = sa.project_id
        JOIN characters c
            ON sa.character_id = c.character_id AND sa.project_id = c.project_id
        WHERE s.project_id = {pid:String} AND s.location_id = {eid:String}
        GROUP BY s.location_id
    """, parameters={"pid": project_id, "eid": entity_id}).result_set
    loc_characters = list(char_rows[0][1]) if char_rows else []

    prop_rows = client.query("""
        SELECT s.location_id, groupArray(DISTINCT p.prop_name) AS props
        FROM scenes s
        JOIN scene_props sp
            ON s.scene_id = sp.scene_id AND s.project_id = sp.project_id
        JOIN props p
            ON sp.prop_id = p.prop_id AND sp.project_id = p.project_id
        WHERE s.project_id = {pid:String} AND s.location_id = {eid:String}
        GROUP BY s.location_id
    """, parameters={"pid": project_id, "eid": entity_id}).result_set
    loc_props = list(prop_rows[0][1]) if prop_rows else []

    rows = client.query("""
        SELECT
            l.location_id, l.location_name, l.aliases, l.confidence,
            min(s.scene_number) AS first_scene,
            groupArray(s.scene_number) AS appears_in
        FROM locations l
        LEFT JOIN scenes s
            ON l.location_id = s.location_id AND l.project_id = s.project_id
        WHERE l.project_id = {pid:String} AND l.location_id = {eid:String}
        GROUP BY l.location_id, l.location_name, l.aliases, l.confidence
    """, parameters={"pid": project_id, "eid": entity_id}).result_set

    if not rows:
        raise HTTPException(status_code=404, detail="Location not found")

    r = rows[0]
    entity = {
        "locationId": r[0],
        "locationName": r[1],
        "aliases": list(r[2]),
        "confidence": r[3],
        "firstScene": r[4],
        "appearsIn": sorted(list(set(r[5]))),
        "characters": loc_characters,
        "props": loc_props,
    }

    narrative = story_narrative_formatters.format_location(entity)

    return {
        "entityType": "location",
        "entityId": entity["locationId"],
        "name": entity["locationName"],
        "meta": f"LOCATION · {len(entity['appearsIn'])} SCENES",
        "intro": narrative["intro"],
        "subFacts": narrative["subFacts"],
        "relatedEntities": entity["characters"] + entity["props"],
        "relatedIssues": [],
    }


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    projectId: str
    question: str


@app.post("/projects/{project_id}/chat")
async def chat(
    project_id: str,
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    answer = await run_chat_agent(body.question, project_id, current_user["user_id"])
    return {"question": body.question, "answer": answer}


@app.get("/")
def health_check():
    return {"status": "ok", "message": "CinePilot API is running"}
