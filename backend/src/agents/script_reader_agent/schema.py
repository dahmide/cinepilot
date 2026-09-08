"""
Structured output schema for the Script Reader Agent.

Step 2 of the two-step extraction pipeline. Uses entity IDs from the
EntityRegistry (Step 1) instead of raw strings — this ensures consistent
tracking across scenes.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class CharacterObservation(BaseModel):
    """A single observable fact about a character's physical/costume state
    in this scene. Feeds the scene_observations table, which is separate
    from mere scene presence (scene_appearances)."""
    observation_type: str = Field(
        description="One of: 'physical_attribute', 'injury', 'costume_state'"
    )
    value: str = Field(
        description="The observed detail, e.g. 'walking with a limp', "
                    "'black eye', 'wearing a torn jacket'"
    )


class CharacterAppearance(BaseModel):
    """A single character's state during one scene."""
    character_id: str = Field(
        description="ID from the entity registry (e.g. 'char_001')"
    )
    costume_details: Optional[str] = Field(
        default=None,
        description="Any described clothing/appearance detail visible in this scene. "
                    "Null if not described.",
    )
    props_carried: List[str] = Field(
        default_factory=list,
        description="prop_ids from the entity registry for objects this character "
                    "is described holding, wearing, or carrying in this scene.",
    )
    dialogue_summary: Optional[str] = Field(
        default=None,
        description="One-sentence summary of what this character says or learns "
                    "in this scene, if plot-relevant. Null if none.",
    )
    observations: List[CharacterObservation] = Field(
        default_factory=list,
        description="Notable physical attributes, injuries, or costume state "
                    "changes for this character in this scene, if any.",
    )


class Scene(BaseModel):
    """One scene extracted from the screenplay."""
    scene_number: int = Field(
        description="Sequential scene number, in script order"
    )
    heading: str = Field(
        description="The scene heading as written, e.g. 'INT. DETECTIVE OFFICE - DAY'"
    )
    location_id: str = Field(
        description="location_id from the entity registry (e.g. 'loc_001')"
    )
    time_of_day: Optional[str] = Field(
        default=None,
        description="DAY, NIGHT, etc., if stated"
    )
    summary: str = Field(
        description="1-2 sentence summary of what happens in this scene"
    )
    time_reference: Optional[str] = Field(
        default=None,
        description="An EXPLICIT date or time-skip marker stated in this scene's "
                    "heading or action lines — e.g. 'THREE YEARS LATER', 'MONDAY, "
                    "JUNE 12TH', '1994'. Null unless the script explicitly states "
                    "one. Do NOT infer this from context or dialogue tone — only "
                    "populate it when an unambiguous date/time-skip is written "
                    "on the page.",
    )
    characters: List[CharacterAppearance] = Field(
        default_factory=list,
        description="Every character present in this scene, referenced by character_id",
    )
    props_present: List[str] = Field(
        default_factory=list,
        description="prop_ids from the entity registry for all props present "
                    "in this scene, whether or not a character is carrying them.",
    )


class ScreenplayExtraction(BaseModel):
    """Top-level output for one full screenplay — Step 2 output."""
    title: Optional[str] = Field(
        default=None,
        description="Screenplay title, if present on a title page"
    )
    scenes: List[Scene] = Field(
        description="All scenes in the screenplay, in order"
    )
