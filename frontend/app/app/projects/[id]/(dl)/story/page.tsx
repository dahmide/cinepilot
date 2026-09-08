import Story from "@/components/views/app/story";
import { getStory } from "@/lib/dal/story.dal";
import { BreadcrumbSetter } from "@/components/ui/breadcrumb";
import { sortByProperty } from "@/utils/functions";

export default async function StoryPage({
    params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = await params;
    const { characters, props, locations } = await getStory(id);

    // console.log("Characters:", characters);
    // console.log("Props:", props);
    // console.log("Locations:", locations);
    return (
        <Story
            characters={sortByProperty(characters, "characterName")}
            props={sortByProperty(props, "propName")}
            locations={sortByProperty(locations, "locationName")}
        />
    );
}
