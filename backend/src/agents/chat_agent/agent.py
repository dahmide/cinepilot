"""
Chat Agent — backed by the official ClickHouse MCP server (mcp-clickhouse),
run as a stdio subprocess via an isolated venv (venv-mcp-clickhouse) to
avoid a fastmcp/mcp version conflict with google-adk's own requirements.

Two layers of project_id enforcement:
  Layer 1 (instruction) — tells the LLM to always filter by project_id.
  Layer 2 (before_tool_callback) — programmatically rewrites the SQL to
    guarantee the filter is present, regardless of what the LLM wrote.
Layer 2 is the one that actually matters; Layer 1 just reduces how often
Layer 2 has to intervene.

The real tool name exposed by mcp-clickhouse is `run_query` (confirmed
against the official ClickHouse/mcp-clickhouse README), not
`run_select_query` — this was wrong in an earlier draft and is now fixed.

Set CINEPILOT_DEBUG_MCP=true to print every tool call (name, args, and
the SQL before/after project_id enforcement) to stdout — useful for
verifying the security layer is actually firing. Leave unset for a
quieter terminal.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.genai import types
from mcp import StdioServerParameters

from .security import is_safe_query, enforce_project_filter

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

_DEBUG = os.environ.get("CINEPILOT_DEBUG_MCP", "").lower() == "true"

_toolset = MCPToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=str(Path(__file__).resolve().parents[3] / "venv-mcp-clickhouse" / "bin" / "python"),
            args=["-m", "mcp_clickhouse.main"],
            env={
                **os.environ,
                "CLICKHOUSE_HOST": os.environ["CLICKHOUSE_HOST"],
                "CLICKHOUSE_USER": os.environ["CLICKHOUSE_USER"],
                "CLICKHOUSE_PASSWORD": os.environ["CLICKHOUSE_PASSWORD"],
                "CLICKHOUSE_SECURE": os.environ.get("CLICKHOUSE_SECURE", "true"),
            },
        ),
        timeout=60,
    ),
)

_session_service = InMemorySessionService()
_APP_NAME = "cinepilot_chat"
_session_ids: dict[tuple[str, str], str] = {}


def _build_instruction(project_id: str) -> str:
    return f"""You are a script-continuity assistant answering questions
about ONE specific screenplay project.

The project_id for this conversation is: {project_id}

This ID is for your internal use only (filtering your SQL queries) —
never mention it, print it, or reference it in your responses to the
user. Refer to the project only in plain terms (e.g. "this project" or
"this script"), never by its ID.

Every SQL query you write via run_query MUST include
`WHERE project_id = '{project_id}'`. All tables you can query —
characters, props, locations, scenes, scene_appearances, scene_props,
scene_observations, continuity_issues — are multi-tenant and contain
rows from other projects. Always filter by project_id.

You MUST use the run_query tool to look up real data before answering
any question about scenes, characters, props, locations, or continuity
issues. Never answer from memory or assume details — if you have not
queried the data for a specific fact, say you don't have that
information rather than guessing.

For any question involving a specific prop or character, always also
check the continuity_issues table for that prop_id or character_id,
so you don't miss reporting a real flagged issue.

Note: array columns (like `aliases`) cannot be used directly with ILIKE
in ClickHouse — use `arrayExists(x -> x ILIKE '%...%', aliases)` instead.

Available tables (all scoped by project_id):
- characters (character_id, canonical_name, aliases, confidence, first_appearance_scene)
- props (prop_id, prop_name, aliases, confidence, category)
- locations (location_id, location_name, aliases, confidence)
- scenes (scene_id, scene_number, heading, location_id, time_of_day, summary, time_reference)
- scene_appearances (scene_id, character_id, costume_details, props_carried, dialogue_summary)
- scene_props (scene_id, prop_id)
- scene_observations (scene_id, character_id, observation_type, value)
- continuity_issues (issue_id, character_id, prop_id, introduced_scene, missing_by_scene, title, description, issue_type)

Cite specific scene numbers in your answers. Match character/prop names
case-insensitively and check aliases as well as canonical_name/prop_name,
since screenplays often refer to the same entity multiple ways.

FORMATTING RULES for your responses:
- Use Markdown formatting: bullet lists with "-", numbered lists for
  sequential/ranked items, **bold** for entity names when first
  introducing them in a list item.
- Keep bullet points to one sentence each. Avoid nested/sub-bullets.
- When listing scenes, use a comma-separated list in prose rather than
  one bullet per scene number, unless each scene needs its own
  explanation (e.g. describing a distinct continuity issue per scene).
- Don't use headers (##) in chat responses — this is a conversational
  reply, not a document.
- Keep responses concise. Prefer a short list over a long paragraph
  when listing 3+ items (scenes, characters, issues).
"""

def _make_query_guard(project_id: str):
    """Layer 2 enforcement — fires before every MCP tool call.

    The real tool name is `run_query` (confirmed against the official
    ClickHouse/mcp-clickhouse README), not `run_select_query`.
    """

    async def before_tool_callback(tool, args, tool_context):
        if _DEBUG:
            print(f"\n[TOOL CALL] name={tool.name!r} args={args!r}")

        if tool.name == "run_query":
            sql = args.get("query", "")

            if not is_safe_query(sql):
                if _DEBUG:
                    print(f"[TOOL CALL] BLOCKED — not a safe SELECT: {sql!r}")
                return {"error": "Only SELECT queries are permitted."}

            filtered_sql = enforce_project_filter(sql, project_id)
            args["query"] = filtered_sql
            if _DEBUG:
                print(f"[TOOL CALL] original SQL:  {sql!r}")
                print(f"[TOOL CALL] filtered SQL:  {filtered_sql!r}")

        return None

    return before_tool_callback


def make_chat_agent(project_id: str) -> LlmAgent:
    return LlmAgent(
        model="gemini-2.5-pro",
        name=f"chat_agent_{project_id.replace('-', '_')}",
        instruction=_build_instruction(project_id),
        tools=[_toolset],
        before_tool_callback=_make_query_guard(project_id),
    )


async def _get_or_create_session(project_id: str, user_id: str):
    key = (project_id, user_id)

    if key in _session_ids:
        existing = await _session_service.get_session(
            app_name=_APP_NAME,
            user_id=user_id,
            session_id=_session_ids[key],
        )
        if existing is not None:
            return existing

    session = await _session_service.create_session(
        app_name=_APP_NAME,
        user_id=user_id,
    )
    _session_ids[key] = session.id
    return session


async def run_chat_agent(question: str, project_id: str, user_id: str) -> str:
    agent = make_chat_agent(project_id)

    runner = Runner(
        agent=agent,
        app_name=_APP_NAME,
        session_service=_session_service,
    )

    session = await _get_or_create_session(project_id, user_id)

    message = types.Content(
        role="user",
        parts=[types.Part(text=question)],
    )

    final_answer = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=message,
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_answer = event.content.parts[0].text
            break

    return final_answer
