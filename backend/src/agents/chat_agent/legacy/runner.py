import asyncio
from google.adk.runners import InMemoryRunner
from google.genai import types
from chat_agent.agent import make_chat_agent

APP_NAME = "continuity_copilot_chat"
_agent_cache = {}
_runner_cache = {}


def _get_agent(project_id: str):
    if project_id not in _agent_cache:
        _agent_cache[project_id] = make_chat_agent(project_id)
    return _agent_cache[project_id]


def _get_runner(project_id: str) -> InMemoryRunner:
    if project_id not in _runner_cache:
        _runner_cache[project_id] = InMemoryRunner(agent=_get_agent(project_id), app_name=APP_NAME)
    return _runner_cache[project_id]


async def run_chat_agent(question: str, project_id: str, user_id: str) -> str:
    runner = await asyncio.to_thread(_get_runner, project_id)
    session_id = f"{project_id}:{user_id}"

    session = await runner.session_service.get_session(
        app_name=APP_NAME, user_id=user_id, session_id=session_id
    )
    if session is None:
        session = await runner.session_service.create_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )

    final_text = ""
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=types.Content(role="user", parts=[types.Part(text=question)]),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text
    return final_text