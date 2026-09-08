"""
One-off debug script: checks whether "shopping basket" has duplicate
prop_id entries in this project, and whether the continuity_issues
table actually has a row for it.
"""

import os
import sys
from pathlib import Path

import clickhouse_connect
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

project_id = sys.argv[1] if len(sys.argv) > 1 else None
if not project_id:
    print("Usage: python scripts/debug_basket.py <project_id>")
    sys.exit(1)

client = clickhouse_connect.get_client(
    host=os.environ["CLICKHOUSE_HOST"],
    user=os.environ["CLICKHOUSE_USER"],
    password=os.environ["CLICKHOUSE_PASSWORD"],
    secure=True,
)

print("── props matching 'basket' ──")
rows = client.query("""
    SELECT prop_id, prop_name, aliases FROM props
    WHERE project_id = {pid:String} AND prop_name ILIKE '%basket%'
""", parameters={"pid": project_id}).result_set
for r in rows:
    print(r)

print("\n── continuity_issues matching 'basket' (by title) ──")
rows = client.query("""
    SELECT issue_id, prop_id, title, introduced_scene, missing_by_scene
    FROM continuity_issues
    WHERE project_id = {pid:String} AND title ILIKE '%basket%'
""", parameters={"pid": project_id}).result_set
for r in rows:
    print(r)

print("\n── scene_props rows for each basket prop_id found above ──")
for prop_id, prop_name, aliases in client.query("""
    SELECT prop_id, prop_name, aliases FROM props
    WHERE project_id = {pid:String} AND prop_name ILIKE '%basket%'
""", parameters={"pid": project_id}).result_set:
    scene_rows = client.query("""
        SELECT scene_id FROM scene_props
        WHERE project_id = {pid:String} AND prop_id = {prop_id:String}
        ORDER BY scene_id
    """, parameters={"pid": project_id, "prop_id": prop_id}).result_set
    print(f"{prop_id} ({prop_name}): scenes {[r[0] for r in scene_rows]}")
