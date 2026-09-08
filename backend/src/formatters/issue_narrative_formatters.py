"""
Narrative formatters for continuity_issues.

One function per issue_type. No shared template, no conditional branching
inside a single string — each type gets its own function because each type
has a structurally different underlying fact shape (a transfer, a state
contradiction, a date mismatch, an unresolved promise).

Each formatter returns just the observation clause as plain text — no
scene number or heading prefix. Scene/heading are separate structured
fields the caller (main.py) attaches alongside the text, so the frontend
can style them independently (e.g. heading as a slug-style label).

Consistency rule enforced across all four: every returned clause is a
single present-tense sentence, no compound sentences — this is what
prevents grammar mismatch between types.
"""


def _lead_character(issue: dict) -> str:
    characters = issue.get("characters") or []
    return characters[0] if characters else "the character"


# ── PROP CONTINUITY ─────────────────────────────────────────────────────────

def format_prop_findings(issue: dict) -> tuple[str, str]:
    prop_name = issue.get("prop_name", "the object")
    character = _lead_character(issue)

    established = f"{character} has the {prop_name}."
    contradicted = (
        f"{character} no longer has the {prop_name}, "
        f"with no scene in between accounting for the change."
    )
    return established, contradicted


# ── CHARACTER DETAIL ─────────────────────────────────────────────────────────

def format_character_detail_findings(issue: dict, value_a: str, value_b: str) -> tuple[str, str]:
    character = _lead_character(issue)

    established = f"{character} shows {value_a}."
    contradicted = f"{character} shows {value_b}."
    return established, contradicted


# ── TIMELINE ─────────────────────────────────────────────────────────────────

def format_timeline_findings(issue: dict, ref_a: str, ref_b: str) -> tuple[str, str]:
    established = f"The time is stated as {ref_a}."
    contradicted = f"The time is stated as {ref_b}."
    return established, contradicted


# ── PLOT THREAD ──────────────────────────────────────────────────────────────

def format_plot_thread_findings(issue: dict, setup_quote: str) -> tuple[str, str]:
    character = _lead_character(issue)
    quote = setup_quote.strip().rstrip(".!?")

    setup = f"{character} sets this up, saying \"{quote}\"."
    last_referenced = "The thread is last referenced here, with no resolution found."
    return setup, last_referenced


FORMATTERS = {
    "prop": format_prop_findings,
    "character_detail": format_character_detail_findings,
    "timeline": format_timeline_findings,
    "plot_thread": format_plot_thread_findings,
}

FINDINGS_LABELS = {
    "prop": ("Where it's established", "Where it's contradicted"),
    "character_detail": ("Where it's established", "Where it's contradicted"),
    "timeline": ("Where it's established", "Where it's contradicted"),
    "plot_thread": ("Where it's set up", "Last referenced"),
}