import Story from "@/components/views/app/story";
import { getStory } from "@/lib/dal/story.dal";

export default async function StoryPage({
    params
}: Readonly<{ params: Promise<{ id }> }>) {
    const { id } = await params;
    const { characters, props, locations } = await getStory(id);

    // console.log("Characters:", characters);
    // console.log("Props:", props);
    // console.log("Locations:", locations);
    return (
        <Story 
            characters={characters} 
            props={props} 
            locations={locations} 
        />
    );
}
