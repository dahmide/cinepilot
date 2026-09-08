"""
Narrative formatters for Story Bible entities (character / prop / location).

Same discipline as narrative_formatters.py for issues: one function per
entity type, no shared template, no em dashes. Each function returns the
intro sentence plus a list of short standalone sub-fact sentences for
Section 2 ("Her Story" / "Its Story").
"""


def _join_list(items: list[str]) -> str:
    """'A' / 'A and B' / 'A, B and C' — no Oxford comma before 'and',
    matching plain narrative prose rather than a list-style comma set."""
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])} and {items[-1]}"


def _scene_list(scenes: list[int]) -> str:
    scenes = sorted(set(scenes))
    if not scenes:
        return ""
    return _join_list([str(s) for s in scenes])


def _alias_sentence(name: str, aliases: list[str]) -> str:
    """Returns a sentence noting alternate names/references, or an empty
    string if there are none worth mentioning (e.g. the alias list only
    repeats the canonical name, or is empty)."""
    real_aliases = [a for a in aliases if a and a.strip().lower() != name.strip().lower()]
    if not real_aliases:
        return ""
    return f"{name} is also referred to as {_join_list(real_aliases)} throughout the script."


# ── CHARACTER ────────────────────────────────────────────────────────────────

def format_character(entity: dict) -> dict:
    name = entity["characterName"]
    first_scene = entity["firstScene"]
    appears_in = entity["appearsIn"]
    locations = entity["locations"]
    props = entity["props"]
    flags = entity["continuityFlags"]

    intro = (
        f"{name} is introduced in Scene {first_scene} and appears across "
        f"{len(appears_in)} recorded scene{'s' if len(appears_in) != 1 else ''}."
    )

    sub_facts = []

    if appears_in:
        sub_facts.append(f"{name} appears in Scene{'s' if len(appears_in) != 1 else ''} {_scene_list(appears_in)}.")

    if locations:
        sub_facts.append(
            f"{name}'s scenes take place across "
            f"{len(locations)} location{'s' if len(locations) != 1 else ''}, "
            f"including {_join_list(locations)}."
        )

    if props:
        sub_facts.append(
            f"{len(props)} prop{'s' if len(props) != 1 else ''} "
            f"{'is' if len(props) == 1 else 'are'} associated with {name}: "
            f"{_join_list(props)}."
        )

    if flags:
        sub_facts.append(
            f"{flags} continuity issue{'s' if flags != 1 else ''} "
            f"{'is' if flags == 1 else 'are'} linked to {name}."
        )

    alias_line = _alias_sentence(name, entity.get("aliases", []))
    if alias_line:
        sub_facts.append(alias_line)

    return {"intro": intro, "subFacts": sub_facts}


# ── PROP ─────────────────────────────────────────────────────────────────────

def format_prop(entity: dict) -> dict:
    name = entity["propName"]
    introduced = entity["introducedScene"]
    last_seen = entity["lastSeenScene"]
    seen_in = entity["seenIn"]
    associated = entity["associatedCharacters"]
    category = entity.get("category", "prop")
    flags = entity["continuityFlags"]

    if introduced == last_seen:
        intro = f"{name} appears in Scene {introduced}."
    else:
        intro = f"{name} is introduced in Scene {introduced} and last appears in Scene {last_seen}."

    if category == "costume":
        intro = f"{intro} It is tracked as a costume item across the screenplay."

    sub_facts = []

    if seen_in:
        sub_facts.append(f"{name} appears in Scene{'s' if len(seen_in) != 1 else ''} {_scene_list(seen_in)}.")

    if associated:
        sub_facts.append(f"{name} is associated with {_join_list(associated)}.")

    if flags:
        sub_facts.append(
            f"{flags} continuity issue{'s' if flags != 1 else ''} "
            f"{'is' if flags == 1 else 'are'} linked to {name}."
        )

    alias_line = _alias_sentence(name, entity.get("aliases", []))
    if alias_line:
        sub_facts.append(alias_line)

    return {"intro": intro, "subFacts": sub_facts}


# ── LOCATION ─────────────────────────────────────────────────────────────────

def format_location(entity: dict) -> dict:
    name = entity["locationName"]
    first_scene = entity["firstScene"]
    appears_in = entity["appearsIn"]
    characters = entity["characters"]
    props = entity["props"]

    intro = (
        f"{name} first appears in Scene {first_scene}, recorded across "
        f"{len(appears_in)} scene{'s' if len(appears_in) != 1 else ''}."
    )

    sub_facts = []

    if appears_in:
        sub_facts.append(f"{name} appears in Scene{'s' if len(appears_in) != 1 else ''} {_scene_list(appears_in)}.")

    if characters:
        sub_facts.append(f"{_join_list(characters)} {'is' if len(characters) == 1 else 'are'} present at {name}.")

    if props:
        sub_facts.append(f"Props found here include {_join_list(props)}.")

    alias_line = _alias_sentence(name, entity.get("aliases", []))
    if alias_line:
        sub_facts.append(alias_line)

    return {"intro": intro, "subFacts": sub_facts}


FORMATTERS = {
    "character": format_character,
    "prop": format_prop,
    "location": format_location,
}
