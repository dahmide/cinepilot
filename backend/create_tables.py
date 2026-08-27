import os
from dotenv import load_dotenv
import clickhouse_connect

load_dotenv("script_reader_agent/.env")

client = clickhouse_connect.get_client(
    host=os.environ["CLICKHOUSE_HOST"],
    user=os.environ["CLICKHOUSE_USER"],
    password=os.environ["CLICKHOUSE_PASSWORD"],
    secure=True,
)

statements = [
    """
    CREATE TABLE IF NOT EXISTS projects (
        project_id  String,
        user_id     String,
        title       String,
        genre       String,
        page_count  UInt32,
        analyzed_at DateTime,
        status      String
    ) ENGINE = MergeTree()
    ORDER BY (user_id, project_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS characters (
        project_id             String,
        character_id           String,
        canonical_name         String,
        aliases                Array(String),
        confidence             Float32,
        first_appearance_scene UInt32
    ) ENGINE = MergeTree()
    ORDER BY (project_id, character_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS props (
        project_id   String,
        prop_id      String,
        prop_name    String,
        aliases      Array(String),
        confidence   Float32,
        category     String DEFAULT 'prop'
    ) ENGINE = MergeTree()
    ORDER BY (project_id, prop_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS locations (
        project_id     String,
        location_id    String,
        location_name  String,
        aliases        Array(String),
        confidence     Float32
    ) ENGINE = MergeTree()
    ORDER BY (project_id, location_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS scenes (
        project_id     String,
        scene_id       UInt32,
        scene_number   UInt32,
        heading        String,
        location_id    String,
        time_of_day    Nullable(String),
        summary        String,
        time_reference Nullable(String)
    ) ENGINE = MergeTree()
    ORDER BY (project_id, scene_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS scene_appearances (
        project_id       String,
        scene_id         UInt32,
        character_id     String,
        costume_details  Nullable(String),
        props_carried    Array(String),
        dialogue_summary Nullable(String)
    ) ENGINE = MergeTree()
    ORDER BY (project_id, scene_id, character_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS scene_observations (
        project_id       String,
        scene_id         UInt32,
        character_id     String,
        observation_type String,
        value            String,
        created_at       DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (project_id, scene_id, character_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS scene_props (
        project_id String,
        scene_id   UInt32,
        prop_id    String
    ) ENGINE = MergeTree()
    ORDER BY (project_id, scene_id, prop_id)
    """,
    """
    CREATE TABLE IF NOT EXISTS continuity_issues (
        project_id       String,
        issue_id         UInt32,
        character_id     String,
        characters       Array(String),
        prop_id          String,
        introduced_scene UInt32,
        missing_by_scene UInt32,
        title            String,
        description      String,
        issue_type       String,
        setup_quote      Nullable(String)
    ) ENGINE = MergeTree()
    ORDER BY (project_id, issue_id)
    """,
]

for stmt in statements:
    client.command(stmt)
    print("✅ Created table")

# Backfill columns added after initial table creation — safe no-ops on a
# fresh table, but needed on a table that already existed before these
# columns were introduced.
client.command("ALTER TABLE props ADD COLUMN IF NOT EXISTS category String DEFAULT 'prop'")
print("✅ Ensured props.category column exists")

client.command("ALTER TABLE scenes ADD COLUMN IF NOT EXISTS time_reference Nullable(String)")
print("✅ Ensured scenes.time_reference column exists")

client.command("ALTER TABLE continuity_issues ADD COLUMN IF NOT EXISTS setup_quote Nullable(String)")
print("✅ Ensured continuity_issues.setup_quote column exists")

client.command("ALTER TABLE continuity_issues ADD COLUMN IF NOT EXISTS stakes Nullable(String)")
print("✅ Ensured continuity_issues.stakes column exists")

print("\nAll tables created. Verifying...")
tables = client.query("SHOW TABLES").result_set
print("Tables in database:", [t[0] for t in tables])