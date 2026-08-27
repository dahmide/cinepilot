"""
Loader: takes entity registry + extraction output and inserts into ClickHouse.
Now uses canonical IDs from the entity registry throughout.

transform() and insert_all() are the single source of truth for how
extraction output maps onto ClickHouse tables — main.py imports and calls
these directly rather than keeping its own copy, so the two never drift
out of sync with each other.
"""

import json
import os
import sys
import uuid

import clickhouse_connect
from dotenv import load_dotenv

load_dotenv("script_reader_agent/.env")


def get_client():
    return clickhouse_connect.get_client(
        host=os.environ["CLICKHOUSE_HOST"],
        user=os.environ["CLICKHOUSE_USER"],
        password=os.environ["CLICKHOUSE_PASSWORD"],
        secure=True,
    )


def transform(registry: dict, extraction: dict, project_id: str):
    characters_rows = []
    props_rows = []
    locations_rows = []
    scenes_rows = []
    scene_appearances_rows = []
    scene_props_rows = []
    scene_observations_rows = []

    # Characters from registry
    first_appearance = {}
    for char in registry.get("characters", []):
        characters_rows.append((
            project_id,
            char["character_id"],
            char["canonical_name"],
            char.get("aliases", []),
            char.get("confidence", 1.0),
            0,  # first_appearance_scene — filled in below
        ))

    # Props from registry
    for prop in registry.get("props", []):
        props_rows.append((
            project_id,
            prop["prop_id"],
            prop["canonical_name"],
            prop.get("aliases", []),
            prop.get("confidence", 1.0),
            prop.get("category", "prop"),
        ))

    # Locations from registry
    for loc in registry.get("locations", []):
        locations_rows.append((
            project_id,
            loc["location_id"],
            loc["canonical_name"],
            loc.get("aliases", []),
            loc.get("confidence", 1.0),
        ))

    # Scenes from extraction
    for scene in extraction.get("scenes", []):
        scene_id = scene["scene_number"]

        scenes_rows.append((
            project_id,
            scene_id,
            scene["scene_number"],
            scene["heading"],
            scene.get("location_id", ""),
            scene.get("time_of_day"),
            scene["summary"],
            scene.get("time_reference"),
        ))

        for char in scene.get("characters", []):
            char_id = char["character_id"]

            # Track first appearance
            if char_id not in first_appearance:
                first_appearance[char_id] = scene_id

            scene_appearances_rows.append((
                project_id,
                scene_id,
                char_id,
                char.get("costume_details"),
                char.get("props_carried", []),
                char.get("dialogue_summary"),
            ))

            # Flatten this character's per-scene observations
            # (physical attributes, injuries, costume state changes)
            # into scene_observations rows.
            for obs in char.get("observations", []):
                scene_observations_rows.append((
                    project_id,
                    scene_id,
                    char_id,
                    obs["observation_type"],
                    obs["value"],
                ))

        for prop_id in scene.get("props_present", []):
            scene_props_rows.append((project_id, scene_id, prop_id))

    # Update first_appearance_scene on characters
    characters_rows = [
        (
            row[0], row[1], row[2], row[3], row[4],
            first_appearance.get(row[1], 0),
        )
        for row in characters_rows
    ]

    return (
        characters_rows,
        props_rows,
        locations_rows,
        scenes_rows,
        scene_appearances_rows,
        scene_props_rows,
        scene_observations_rows,
    )


def insert_all(
    client,
    characters_rows,
    props_rows,
    locations_rows,
    scenes_rows,
    scene_appearances_rows,
    scene_props_rows,
    scene_observations_rows,
):
    """Single source of truth for inserting transform() output into
    ClickHouse. Does NOT touch the `projects` table — callers that need a
    projects row (e.g. main.py's upload pipeline) insert that separately
    before or after calling this, since transform() has no project
    metadata (title/genre/page_count) to work with."""

    client.insert("characters", characters_rows, column_names=[
        "project_id", "character_id", "canonical_name",
        "aliases", "confidence", "first_appearance_scene",
    ])

    client.insert("props", props_rows, column_names=[
        "project_id", "prop_id", "prop_name", "aliases",
        "confidence", "category",
    ])

    client.insert("locations", locations_rows, column_names=[
        "project_id", "location_id", "location_name", "aliases", "confidence",
    ])

    client.insert("scenes", scenes_rows, column_names=[
        "project_id", "scene_id", "scene_number", "heading",
        "location_id", "time_of_day", "summary", "time_reference",
    ])

    client.insert("scene_appearances", scene_appearances_rows, column_names=[
        "project_id", "scene_id", "character_id",
        "costume_details", "props_carried", "dialogue_summary",
    ])

    if scene_observations_rows:
        client.insert("scene_observations", scene_observations_rows, column_names=[
            "project_id", "scene_id", "character_id",
            "observation_type", "value",
        ])

    client.insert("scene_props", scene_props_rows, column_names=[
        "project_id", "scene_id", "prop_id",
    ])


def main():
    registry_path = sys.argv[1] if len(sys.argv) > 1 else "registry_output.json"
    extraction_path = sys.argv[2] if len(sys.argv) > 2 else "extraction_output.json"

    if not os.path.exists(registry_path):
        print(f"❌ Registry file not found: {registry_path}")
        sys.exit(1)

    if not os.path.exists(extraction_path):
        print(f"❌ Extraction file not found: {extraction_path}")
        sys.exit(1)

    with open(registry_path) as f:
        registry = json.load(f)

    with open(extraction_path) as f:
        extraction = json.load(f)

    project_id = str(uuid.uuid4())
    print(f"Using project_id: {project_id}")

    rows = transform(registry, extraction, project_id)

    client = get_client()

    print("Inserting all tables...")
    insert_all(client, *rows)

    print("\n✅ Done.")

if __name__ == "__main__":
    main()
