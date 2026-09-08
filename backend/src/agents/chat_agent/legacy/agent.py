import os
from google.adk.agents import Agent
from toolbox_core import ToolboxSyncClient

TOOLBOX_URL = os.environ.get("TOOLBOX_URL", "http://127.0.0.1:5000")

INSTRUCTIONS = """
You are a helpful assistant for a filmmaker reviewing their screenplay's
continuity and story details. You have access to tools that query a
database built from the screenplay's structured breakdown (scenes,
characters, props, costumes, dialogue notes).

When answering a question:
1. Decide which tool(s) will get you the information you need. You may
   need to call more than one tool (e.g. get a character's appearances,
   then look at specific scene details).
2. Base your answer ONLY on what the tools return. Do not guess or use
   outside knowledge of the movie/story.
3. Always cite specific scene numbers in your answer.
4. If the tools don't return enough information to answer confidently,
   say so clearly rather than guessing.
5. Keep answers concise and direct — this is being used to quickly check
   facts during production, not for essay-length responses.
"""

_toolbox = ToolboxSyncClient(TOOLBOX_URL)


def make_chat_agent(project_id: str) -> Agent:
    tools = [
        _toolbox.load_tool("get_character_appearances", bound_params={"project_id": project_id}),
        _toolbox.load_tool("get_scene_details", bound_params={"project_id": project_id}),
        _toolbox.load_tool("search_prop", bound_params={"project_id": project_id}),
    ]
    return Agent(
        name="chat_agent",
        model="gemini-2.5-pro",
        description="Answers questions about the screenplay by querying structured scene/character/prop data.",
        instruction=INSTRUCTIONS,
        tools=tools,
    )