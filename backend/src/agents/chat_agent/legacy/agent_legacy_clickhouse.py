"""
Chat Agent (Continuity Copilot)

Answers natural language questions about the screenplay by querying
Clickhouse. This is the "agentic" piece that decides WHICH queries to run
based on the question, rather than a hardcoded query per question type.

Scoped per-project: make_chat_agent(project_id) builds a fresh Agent whose
tools are closed over that project_id, so the LLM never sees or controls
which project's data it's querying — it only ever sees character_name,
scene_number, prop_name as arguments.

Example questions it should handle:
    "Which scenes does Forrest appear in with his leg braces?"
    "Does Jenny know about anything before scene 10?"
    "What happens in scene 5?"
"""

import os

import clickhouse_connect
from dotenv import load_dotenv
from google.adk.agents import Agent

load_dotenv("script_reader_agent/.env")


def _get_client():
    return clickhouse_connect.get_client(
        host=os.environ["CLICKHOUSE_HOST"],
        user=os.environ["CLICKHOUSE_USER"],
        password=os.environ["CLICKHOUSE_PASSWORD"],
        secure=True,
    )


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


def make_chat_agent(project_id: str) -> Agent:
    def get_character_appearances(character_name: str) -> str:
        """
        Get every scene a character appears in, including their costume, the
        props they're carrying, and any notable dialogue, in scene order.

        Args:
            character_name: The character's name, e.g. "Forrest Gump". Can be
                a canonical name or any known alias/nickname.

        Returns:
            A text summary of the character's scene-by-scene appearances.
        """
        client = _get_client()
        rows = client.query("""
            SELECT s.scene_number, s.heading, sa.costume_details,
                   sa.props_carried, sa.dialogue_summary
            FROM scene_appearances sa
            INNER JOIN (
                SELECT character_id FROM characters
                WHERE project_id = {project_id:String}
                  AND (
                    lower(canonical_name) = lower({name:String})
                    OR has(arrayMap(x -> lower(x), aliases), lower({name:String}))
                  )
            ) c ON sa.character_id = c.character_id
            INNER JOIN scenes s ON sa.scene_id = s.scene_id AND s.project_id = {project_id:String}
            WHERE sa.project_id = {project_id:String}
            ORDER BY s.scene_number
        """, parameters={"name": character_name, "project_id": project_id}).result_set

        if not rows:
            return f"No character found matching '{character_name}'."

        lines = [f"Appearances for {character_name}:"]
        for scene_number, heading, costume, props, dialogue in rows:
            line = f"- Scene {scene_number} ({heading}): "
            details = []
            if costume:
                details.append(f"wearing/appearance: {costume}")
            if props:
                details.append(f"carrying: {', '.join(props)}")
            if dialogue:
                details.append(f"notable: {dialogue}")
            line += "; ".join(details) if details else "(no specific details recorded)"
            lines.append(line)

        return "\n".join(lines)

    def get_scene_details(scene_number: int) -> str:
        """
        Get full details of one specific scene: heading, location, summary,
        and every character present with their state in that scene.

        Args:
            scene_number: The scene number to look up

        Returns:
            A text summary of everything recorded for that scene.
        """
        client = _get_client()
        scene_rows = client.query("""
            SELECT s.heading, l.location_name, s.time_of_day, s.summary
            FROM scenes s
            LEFT JOIN locations l
                ON s.location_id = l.location_id AND s.project_id = l.project_id
            WHERE s.scene_number = {n:UInt32} AND s.project_id = {project_id:String}
        """, parameters={"n": scene_number, "project_id": project_id}).result_set

        if not scene_rows:
            return f"No scene {scene_number} found."

        heading, location, time_of_day, summary = scene_rows[0]

        char_rows = client.query("""
            SELECT c.canonical_name, sa.costume_details, sa.props_carried, sa.dialogue_summary
            FROM scene_appearances sa
            INNER JOIN characters c ON sa.character_id = c.character_id AND c.project_id = {project_id:String}
            INNER JOIN scenes s ON sa.scene_id = s.scene_id AND s.project_id = {project_id:String}
            WHERE s.scene_number = {n:UInt32} AND sa.project_id = {project_id:String}
        """, parameters={"n": scene_number, "project_id": project_id}).result_set

        lines = [
            f"Scene {scene_number}: {heading}",
            f"Location: {location or 'unspecified'} | Time: {time_of_day or 'unspecified'}",
            f"Summary: {summary}",
            "Characters present:",
        ]
        for name, costume, props, dialogue in char_rows:
            detail = f"  - {name}"
            extras = []
            if costume:
                extras.append(f"appearance: {costume}")
            if props:
                extras.append(f"carrying: {', '.join(props)}")
            if dialogue:
                extras.append(f"notable: {dialogue}")
            if extras:
                detail += " (" + "; ".join(extras) + ")"
            lines.append(detail)

        return "\n".join(lines)

    def search_prop(prop_name: str) -> str:
        """
        Find every scene and character associated with a specific prop/object.

        Args:
            prop_name: The name of the prop to search for, e.g. "leg braces"

        Returns:
            A text summary of every scene/character where this prop appears.
        """
        client = _get_client()
        rows = client.query("""
            SELECT s.scene_number, c.canonical_name
            FROM scene_appearances sa
            INNER JOIN characters c ON sa.character_id = c.character_id AND c.project_id = {project_id:String}
            INNER JOIN scenes s ON sa.scene_id = s.scene_id AND s.project_id = {project_id:String}
            WHERE has(sa.props_carried, {prop:String}) AND sa.project_id = {project_id:String}
            ORDER BY s.scene_number
        """, parameters={"prop": prop_name, "project_id": project_id}).result_set

        if not rows:
            return f"No scenes found with the prop '{prop_name}'."

        lines = [f"Scenes featuring '{prop_name}':"]
        for scene_number, name in rows:
            lines.append(f"- Scene {scene_number}: {name}")

        return "\n".join(lines)

    return Agent(
        name="chat_agent",
        model="gemini-2.5-pro",
        description="Answers questions about the screenplay by querying structured scene/character/prop data.",
        instruction=INSTRUCTIONS,
        tools=[get_character_appearances, get_scene_details, search_prop],
    )