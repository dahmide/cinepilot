"""
Schema for the Entity Registry Agent output.

This is Step 1 of the two-step extraction pipeline:
  Entity Registry Agent → Script Reader Agent → ClickHouse → Continuity Checker

The registry identifies and deduplicates all unique entities (characters,
props, locations) across the entire screenplay before scene-level extraction
begins. This ensures consistent IDs are used throughout.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class CharacterEntity(BaseModel):
    character_id: str = Field(
        description="Unique identifier for this character, e.g. 'char_001'"
    )
    canonical_name: str = Field(
        description="The most complete, formal name used for this character "
                    "(e.g. 'Forrest Gump', not 'THE BOY' or 'Forrest')"
    )
    aliases: List[str] = Field(
        default_factory=list,
        description="Every other name or descriptor used to refer to this "
                    "character in the script (e.g. ['THE BOY', 'Forrest', 'son'])"
    )
    confidence: float = Field(
        description="Confidence score 0.0-1.0 that this is a distinct character. "
                    "Below 0.7 means genuinely uncertain."
    )


class PropEntity(BaseModel):
    prop_id: str = Field(
        description="Unique identifier for this prop, e.g. 'prop_001'"
    )
    canonical_name: str = Field(
        description="The single consistent name to use for this prop across all "
                    "scenes (e.g. 'leg braces', not 'metal leg braces' or 'braces')"
    )
    aliases: List[str] = Field(
        default_factory=list,
        description="Every other way this prop is referred to in the script "
                    "(e.g. ['metal leg braces', 'braces', 'the braces'])"
    )
    category: str = Field(
        default="prop",
        description="One of: 'prop' or 'costume'. Use 'costume' for wearable "
                    "items that are tracked as a distinct continuity-relevant "
                    "object across scenes (e.g. a specific jacket, a hat, a "
                    "necklace). Use 'prop' for everything else. Costume items "
                    "are NOT a separate entity type — they are props with this "
                    "tag, so they still go in this same list."
    )
    confidence: float = Field(
        description="Confidence score 0.0-1.0 that this is a distinct prop. "
                    "Below 0.7 means genuinely uncertain."
    )


class LocationEntity(BaseModel):
    location_id: str = Field(
        description="Unique identifier for this location, e.g. 'loc_001'"
    )
    canonical_name: str = Field(
        description="The single consistent name to use for this location "
                    "(e.g. 'Forrest's House', not 'the Gump house' or 'home')"
    )
    aliases: List[str] = Field(
        default_factory=list,
        description="Every other way this location is referred to in the script "
                    "(e.g. ['the Gump house', 'home', 'Mrs. Gump\\'s house'])"
    )
    confidence: float = Field(
        description="Confidence score 0.0-1.0 that this is a distinct location. "
                    "Below 0.7 means genuinely uncertain."
    )


class EntityRegistry(BaseModel):
    """Top-level output of the Entity Registry Agent."""
    characters: List[CharacterEntity] = Field(
        description="All unique characters identified across the entire screenplay"
    )
    props: List[PropEntity] = Field(
        description="All unique props identified across the entire screenplay"
    )
    locations: List[LocationEntity] = Field(
        description="All unique locations identified across the entire screenplay"
    )
