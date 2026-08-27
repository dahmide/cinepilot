"""
Narrative formatters for continuity_issues.

One function per issue_type. No shared template, no conditional branching
inside a single string — each type gets its own function because each type
has a structurally different underlying fact shape (a transfer, a state
contradiction, a date mismatch, an unresolved promise).

Consistency rule enforced across all four: every Findings sentence follows
the same shape —

    Scene {N}: {subject} {present-tense observation}.

Same tense (present), same opening ("Scene N:"), same sentence length
class (one clause, no compound sentences). Only the clause content differs
by type. This is what prevents grammar mismatch between types — the
sentences read as a family without needing shared string pieces.
"""

from typing import Optional


def _lead_character(issue: dict) -> str:
    characters = issue.get("characters") or []
    return characters[0] if characters else "the character"


# ── PROP CONTINUITY ─────────────────────────────────────────────────────────

def format_prop_findings(issue: dict) -> tuple[str, str]:
    prop_name = issue.get("prop_name", "the object")
    character = _lead_character(issue)

    established = f"Scene {issue['introduced_scene']}: {character} has the {prop_name}."
    contradicted = (
        f"Scene {issue['missing_by_scene']}: {character} no longer has the "
        f"{prop_name}, with no scene in between accounting for the change."
    )
    return established, contradicted


# ── CHARACTER DETAIL ─────────────────────────────────────────────────────────

def format_character_detail_findings(
    issue: dict, value_a: str, value_b: str
) -> tuple[str, str]:
    character = _lead_character(issue)

    established = f"Scene {issue['introduced_scene']}: {character} shows {value_a}."
    contradicted = f"Scene {issue['missing_by_scene']}: {character} shows {value_b}."
    return established, contradicted


# ── TIMELINE ─────────────────────────────────────────────────────────────────

def format_timeline_findings(issue: dict, ref_a: str, ref_b: str) -> tuple[str, str]:
    established = f"Scene {issue['introduced_scene']}: the time is stated as {ref_a}."
    contradicted = f"Scene {issue['missing_by_scene']}: the time is stated as {ref_b}."
    return established, contradicted


# ── PLOT THREAD ──────────────────────────────────────────────────────────────
# Different section labels (not "established" / "contradicted" — nothing is
# actually contradicted here, just unresolved), but the sentence shape below
# still follows the same "Scene {N}: {subject} {present-tense clause}." rule
# so it doesn't read as a different voice from the other three types.

def format_plot_thread_findings(issue: dict, setup_quote: str) -> tuple[str, str]:
    character = _lead_character(issue)
    quote = setup_quote.strip().rstrip(".!?")

    setup = f"Scene {issue['introduced_scene']}: {character} sets this up, saying \"{quote}\"."
    last_referenced = (
        f"Scene {issue['missing_by_scene']}: the thread is last referenced here, "
        f"with no resolution found."
    )
    return setup, last_referenced


FORMATTERS = {
    "prop": format_prop_findings,
    "character_detail": format_character_detail_findings,
    "timeline": format_timeline_findings,
    "plot_thread": format_plot_thread_findings,
}

# Section labels per type — Plot Thread deliberately different, others share
# the same pair to reinforce they're the same kind of claim.
FINDINGS_LABELS = {
    "prop": ("Where it's established", "Where it's contradicted"),
    "character_detail": ("Where it's established", "Where it's contradicted"),
    "timeline": ("Where it's established", "Where it's contradicted"),
    "plot_thread": ("Where it's set up", "Last referenced"),
}