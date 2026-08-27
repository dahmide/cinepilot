"""
Continuity Checker — four checks, all writing to continuity_issues with a
shared shape: { type, character_id, characters, prop_id, introduced_scene,
missing_by_scene, title, description }.

1. PROP            — deterministic, rule-based (disappearance only)
2. CHARACTER DETAIL — semi-deterministic: gate on scene_observations reuse,
                      LLM judges contradiction between free-text values
3. TIMELINE         — fully deterministic: compares explicit time_reference
                      values, no LLM
4. PLOT_THREAD      — semi-deterministic: LLM identifies candidate threads
                      with their mention count, Python enforces the hard
                      gate (2+ mentions, explicit stakes, no resolution)

All four are scoped by project_id. Every issue must satisfy: Scene A
establishes X, Scene B contradicts X, under available evidence. If a check
can't produce those three things for a candidate, it doesn't flag it.
"""

import os
import re
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field
from typing import List, Optional

load_dotenv("script_reader_agent/.env")


def get_client():
    import clickhouse_connect
    return clickhouse_connect.get_client(
        host=os.environ["CLICKHOUSE_HOST"],
        user=os.environ["CLICKHOUSE_USER"],
        password=os.environ["CLICKHOUSE_PASSWORD"],
        secure=True,
    )


def get_genai_client():
    return genai.Client(
        vertexai=True,
        project=os.environ["GOOGLE_CLOUD_PROJECT"],
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )


# ── CHECK 1: Prop continuity (deterministic, disappearance only) ───────────────

def find_prop_issues(client, project_id: str):
    rows = client.query("""
        SELECT
            c.character_id,
            c.canonical_name,
            s.scene_number,
            sa.props_carried
        FROM scene_appearances sa
        JOIN characters c
            ON sa.character_id = c.character_id
            AND sa.project_id = c.project_id
        JOIN scenes s
            ON sa.scene_id = s.scene_id
            AND sa.project_id = s.project_id
        WHERE sa.project_id = {pid:String}
        ORDER BY c.character_id, s.scene_number
    """, parameters={"pid": project_id}).result_set

    character_scenes = {}
    for character_id, canonical_name, scene_number, props in rows:
        character_scenes.setdefault(
            character_id, {"name": canonical_name, "scenes": []}
        )
        character_scenes[character_id]["scenes"].append(
            (scene_number, set(props))
        )

    issues = []

    for character_id, data in character_scenes.items():
        name = data["name"]
        scenes = data["scenes"]

        prop_last_seen = {}
        prop_introduced = {}

        for scene_number, props in scenes:
            for prop_id in props:
                if prop_id not in prop_introduced:
                    prop_introduced[prop_id] = scene_number
                prop_last_seen[prop_id] = scene_number

        character_last_scene = scenes[-1][0]

        for prop_id, last_seen in prop_last_seen.items():
            introduced = prop_introduced[prop_id]
            if introduced == last_seen:
                continue

            if last_seen < character_last_scene:
                next_scenes = [s for s, _ in scenes if s > last_seen]
                if next_scenes:
                    missing_by = next_scenes[0]

                    prop_rows = client.query("""
                        SELECT prop_name FROM props
                        WHERE project_id = {pid:String}
                        AND prop_id = {prop_id:String}
                        LIMIT 1
                    """, parameters={
                        "pid": project_id,
                        "prop_id": prop_id
                    }).result_set
                    prop_name = prop_rows[0][0] if prop_rows else prop_id

                    issues.append({
                        "type": "prop",
                        "character_id": character_id,
                        "characters": [name],
                        "prop_id": prop_id,
                        "introduced_scene": last_seen,
                        "missing_by_scene": missing_by,
                        "title": f"{prop_name} — {name}",
                        "description": (
                            f"{name} has the {prop_name} in scene {last_seen}, "
                            f"but no longer has it by scene {missing_by}. "
                            f"No scene shows it being removed, given away, or lost."
                        ),
                    })

    return issues


# ── CHECK 2: Character Detail (semi-deterministic: gate + LLM judgment) ────────

class ObservationContradiction(BaseModel):
    is_contradiction: bool = Field(
        description="True only if these two observed values genuinely cannot "
                    "both be true, with no in-between scene explaining the change."
    )
    explanation: str = Field(
        description="If is_contradiction is true, explain the contradiction "
                    "in one sentence. If false, explain briefly why not "
                    "(e.g. a resolving event exists, or the values are "
                    "actually compatible)."
    )


def find_character_detail_issues(client, project_id: str):
    rows = client.query("""
        SELECT
            so.character_id,
            c.canonical_name,
            so.observation_type,
            so.value,
            so.scene_id
        FROM scene_observations so
        JOIN characters c
            ON so.character_id = c.character_id
            AND so.project_id = c.project_id
        WHERE so.project_id = {pid:String}
        ORDER BY so.character_id, so.observation_type, so.scene_id
    """, parameters={"pid": project_id}).result_set

    if not rows:
        return []

    # Group by (character_id, observation_type)
    groups = {}
    for character_id, name, obs_type, value, scene_id in rows:
        key = (character_id, obs_type)
        groups.setdefault(key, {"name": name, "entries": []})
        groups[key]["entries"].append((scene_id, value))

    genai_client = get_genai_client()
    issues = []

    for (character_id, obs_type), data in groups.items():
        entries = data["entries"]
        name = data["name"]

        # Stage 1 gate: need 2+ observations of the same type for the same
        # character before this is even a candidate.
        if len(entries) < 2:
            continue

        # Compare each consecutive pair in scene order — cheaper than all
        # pairs, and catches the common case (state changes over time)
        # without an LLM call per every possible pair.
        for i in range(len(entries) - 1):
            scene_a, value_a = entries[i]
            scene_b, value_b = entries[i + 1]

            if value_a == value_b:
                continue

            prompt = f"""
A character named {name} was observed in scene {scene_a} with this
{obs_type.replace('_', ' ')}: "{value_a}"

Later, in scene {scene_b}, the same character was observed with this
{obs_type.replace('_', ' ')}: "{value_b}"

Do these two observations genuinely contradict each other — i.e. can they
NOT both be true, and there's no ordinary explanation (like a costume
change, healing, or an in-between event) that would make both correct?

Be conservative. Only flag a real contradiction, not a minor rewording,
paraphrase, or a plausible natural change (e.g. an injury healing over
time is NOT a contradiction on its own — only flag if the values directly
conflict, e.g. wearing two mutually exclusive things in the same
continuity window, or a described trait that cannot change like eye
color changing).

Return your answer in the required structured format.
"""
            response = genai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ObservationContradiction,
                },
            )
            result = ObservationContradiction.model_validate_json(response.text)

            if result.is_contradiction:
                issues.append({
                    "type": "character_detail",
                    "character_id": character_id,
                    "characters": [name],
                    "prop_id": "",
                    "introduced_scene": scene_a,
                    "missing_by_scene": scene_b,
                    "title": f"{obs_type.replace('_', ' ').title()} contradiction — {name}",
                    "description": (
                        f"In scene {scene_a}, {name} is observed: \"{value_a}\". "
                        f"In scene {scene_b}, {name} is observed: \"{value_b}\". "
                        f"{result.explanation}"
                    ),
                })

    return issues

# ── CHECK 3: Timeline (fully deterministic — explicit time_reference only) ─────

YEAR_PATTERN = re.compile(r"\b(1[89]\d{2}|20\d{2})\b")


def _extract_year(time_reference: Optional[str]) -> Optional[int]:
    """Only extracts an unambiguous 4-digit year (18xx-20xx). Relative
    markers like 'THREE YEARS LATER' are intentionally NOT parsed — there's
    no safe way to resolve them to an absolute point without risking a
    false positive, so they're skipped entirely (same 'when in doubt,
    leave it out' rule used elsewhere in this pipeline)."""
    if not time_reference:
        return None
    match = YEAR_PATTERN.search(time_reference)
    return int(match.group(1)) if match else None


def find_timeline_issues(client, project_id: str):
    rows = client.query("""
        SELECT scene_number, time_reference
        FROM scenes
        WHERE project_id = {pid:String}
            AND time_reference IS NOT NULL
            AND time_reference != ''
        ORDER BY scene_number
    """, parameters={"pid": project_id}).result_set

    dated_scenes = []
    for scene_number, time_reference in rows:
        year = _extract_year(time_reference)
        if year is not None:
            dated_scenes.append((scene_number, year, time_reference))

    issues = []

    # Compare each consecutive pair of dated scenes in scene order — if a
    # later scene (by scene_number) has an earlier year than one before it,
    # that's an explicit, unambiguous contradiction.
    for i in range(len(dated_scenes) - 1):
        scene_a, year_a, ref_a = dated_scenes[i]
        scene_b, year_b, ref_b = dated_scenes[i + 1]

        if year_b < year_a:
            issues.append({
                "type": "timeline",
                "character_id": "",
                "characters": [],
                "prop_id": "",
                "introduced_scene": scene_a,
                "missing_by_scene": scene_b,
                "title": f"Timeline contradiction: scene {scene_a} → scene {scene_b}",
                "description": (
                    f"Scene {scene_a} establishes the time as \"{ref_a}\" ({year_a}), "
                    f"but scene {scene_b}, which comes later in the script, states "
                    f"\"{ref_b}\" ({year_b}) — an earlier year than the scene before it."
                ),
            })

    return issues


# ── CHECK 4: Plot Thread (semi-deterministic: LLM candidates + hard gate) ──────

class PlotThreadCandidate(BaseModel):
    thread_description: str = Field(
        description="What was set up — a specific, concrete thread, not a vague theme"
    )
    setup_scene: int = Field(
        description="Scene number where this thread was first introduced"
    )
    setup_quote: str = Field(
        description="The specific line or action establishing the setup — "
                    "must be concrete, not a paraphrase of a vibe"
    )
    stakes: str = Field(
        description="Why this thread matters — what is wanted, promised, or "
                    "owed. Must be explicit in the text, not inferred."
    )
    character_name: str = Field(
        description="The character most associated with this thread"
    )
    mentioned_scenes: List[int] = Field(
        default_factory=list,
        description="EVERY scene number (including the setup scene) where "
                    "this exact thread is referenced or mentioned again"
    )
    resolved: bool = Field(
        description="True if any later scene shows this thread being "
                    "addressed, answered, or resolved"
    )


def _truncate_at_word(text: str, max_len: int = 80) -> str:
    """Truncates to max_len without cutting mid-word."""
    if len(text) <= max_len:
        return text
    cut = text[:max_len].rsplit(" ", 1)[0]
    return cut.rstrip(",.;:") + "..."


class PlotThreadReport(BaseModel):
    candidates: List[PlotThreadCandidate] = Field(default_factory=list)


def find_plot_thread_issues(client, project_id: str):
    rows = client.query("""
        SELECT s.scene_number, c.canonical_name, sa.dialogue_summary
        FROM scene_appearances sa
        JOIN characters c
            ON sa.character_id = c.character_id
            AND sa.project_id = c.project_id
        JOIN scenes s
            ON sa.scene_id = s.scene_id
            AND sa.project_id = s.project_id
        WHERE sa.project_id = {pid:String}
            AND sa.dialogue_summary IS NOT NULL
            AND sa.dialogue_summary != ''
        ORDER BY s.scene_number
    """, parameters={"pid": project_id}).result_set

    if not rows:
        return []

    timeline_text = "\n".join(
        f"Scene {scene_number} — {name}: {dialogue_summary}"
        for scene_number, name, dialogue_summary in rows
    )

    prompt = f"""
You are a script supervisor reviewing a screenplay's story beats in order.

Below is a timeline of what each character says or learns, scene by scene.

Identify candidate STORY THREADS — specific promises, questions, or setups
that have real stakes attached. For each candidate, you must be able to
point to:
- a concrete setup scene and the specific line/action that establishes it
- explicit stakes (why it matters — someone wants, promised, or is owed
  something)
- EVERY scene number where this exact thread is mentioned again (not just
  the first time)
- whether it is ever resolved later in the timeline

Do NOT include a candidate if you cannot name a concrete setup_quote and
explicit stakes for it. A topic that is only mentioned once, or a vague
theme rather than a specific promise/question, is NOT a candidate — leave
it out entirely rather than including it with weak stakes.

TIMELINE:
{timeline_text}

Return your findings in the required structured format. If there are no
genuinely strong candidates, return an empty list.
"""

    genai_client = get_genai_client()
    response = genai_client.models.generate_content(
        model="gemini-2.5-pro",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": PlotThreadReport,
        },
    )

    report = PlotThreadReport.model_validate_json(response.text)

    issues = []
    for c in report.candidates:
        # Hard gate, enforced in Python regardless of what the LLM concluded:
        # must be mentioned in 2+ scenes, must have real setup_quote + stakes,
        # must not be resolved.
        if len(set(c.mentioned_scenes)) < 2:
            continue
        if not c.setup_quote.strip() or not c.stakes.strip():
            continue
        if c.resolved:
            continue

        last_mentioned = max(c.mentioned_scenes)

        issues.append({
            "type": "plot_thread",
            "character_id": "",
            "characters": [c.character_name],
            "prop_id": "",
            "introduced_scene": c.setup_scene,
            "missing_by_scene": last_mentioned,
            "title": _truncate_at_word(c.thread_description),
            "description": (
                f"{c.thread_description} Setup in scene {c.setup_scene}: "
                f"\"{c.setup_quote}\". Stakes: {c.stakes}. Last referenced in "
                f"scene {last_mentioned} with no resolution found."
            ),
            "stakes": c.stakes,
            "setup_quote": c.setup_quote,
        })

    return issues


# ── Standalone run ─────────────────────────────────────────────────────────────

def run_all_checks(client, project_id: str):
    prop_issues = find_prop_issues(client, project_id)
    character_detail_issues = find_character_detail_issues(client, project_id)
    timeline_issues = find_timeline_issues(client, project_id)
    plot_thread_issues = find_plot_thread_issues(client, project_id)
    return prop_issues + character_detail_issues + timeline_issues + plot_thread_issues


def main():
    import sys
    project_id = sys.argv[1] if len(sys.argv) > 1 else None
    if not project_id:
        print("Usage: python continuity_checker.py <project_id>")
        sys.exit(1)

    client = get_client()

    print(f"Checking prop continuity for project {project_id}...")
    prop_issues = find_prop_issues(client, project_id)
    print(f"  Found {len(prop_issues)} prop issue(s)")

    print("Checking character detail contradictions...")
    character_detail_issues = find_character_detail_issues(client, project_id)
    print(f"  Found {len(character_detail_issues)} character detail issue(s)")

    print("Checking timeline contradictions...")
    timeline_issues = find_timeline_issues(client, project_id)
    print(f"  Found {len(timeline_issues)} timeline issue(s)")

    print("Checking for dropped plot threads...")
    plot_issues = find_plot_thread_issues(client, project_id)
    print(f"  Found {len(plot_issues)} plot thread issue(s)")

    all_issues = prop_issues + character_detail_issues + timeline_issues + plot_issues
    print(f"\nTotal: {len(all_issues)} issue(s)")

    icons = {
        "prop": "🎒",
        "character_detail": "🧍",
        "timeline": "🕐",
        "plot_thread": "📖",
    }
    for issue in all_issues:
        icon = icons.get(issue["type"], "•")
        print(f"{icon} {issue['description']}")

if __name__ == "__main__":
    main()
