export interface CharacterEntityDTO {
    characterId: string;
    characterName: string;
    aliases: string[];
    confidence: number;
    firstScene: number;
    appearsIn: number[];
    locations: string[];
    props: string[];
    continuityFlags: number;
}

export interface PropEntityDTO {
    propId: string;
    propName: string;
    aliases: string[];
    confidence: number;
    introducedScene: number;
    lastSeenScene: number;
    seenIn: number[];
    associatedCharacters: string[];
    continuityFlags: number;
}

export interface LocationEntityDTO {
    locationId: string;
    locationName: string;
    aliases: string[];
    confidence: number;
    firstScene: number;
    appearsIn: number[];
    characters: string[];
    props: string[];
    continuityFlags: number;
}

export interface StoryEntityDTO {
    characters: CharacterEntityDTO[];
    props: PropEntityDTO[];
    locations: LocationEntityDTO[];
}
