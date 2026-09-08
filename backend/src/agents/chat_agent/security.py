"""
SQL safety guards for the ClickHouse MCP-backed chat agent.

Ownership (which user owns which project) is already enforced once,
upstream, by the JWT-authenticated FastAPI endpoint before this agent
is ever invoked — only project_id needs enforcing here, since that's
the only tenancy column that actually exists on the per-scene tables
(characters, scenes, scene_appearances, scene_props,
scene_observations, continuity_issues, props, locations).
"""

import re

BLOCKED_KEYWORDS = ["drop", "delete", "insert", "update", "truncate", "alter", "create"]


def is_safe_query(sql: str) -> bool:
    """Reject anything that isn't a plain SELECT. mcp-clickhouse already
    runs queries with readonly=1 by default, so this is a belt-and-
    suspenders check, not the only line of defense.

    Uses word-boundary matching, not substring matching — a substring
    check would false-positive on legitimate column names like
    `created_at` (contains "create") in scene_observations."""
    stripped = sql.strip().lower()
    if not stripped.startswith("select"):
        return False
    return not any(re.search(rf"\b{kw}\b", stripped) for kw in BLOCKED_KEYWORDS)


def enforce_project_filter(sql: str, project_id: str) -> str:
    """Guarantees `project_id = '<id>'` is present in the query,
    injecting it programmatically if the LLM omitted it — regardless
    of what the LLM actually wrote."""
    sql_lower = sql.lower()
    filter_clause = f"project_id = '{project_id}'"

    if filter_clause.lower() in sql_lower:
        return sql  # already scoped correctly

    if "where" in sql_lower:
        return re.sub(r"(?i)\bwhere\b", f"WHERE {filter_clause} AND", sql, count=1)

    for kw in ["group by", "order by", "limit", "having"]:
        idx = sql_lower.find(kw)
        if idx != -1:
            return sql[:idx] + f" WHERE {filter_clause} " + sql[idx:]

    return sql + f" WHERE {filter_clause}"
