import { getStoryEntityDetail } from "@/lib/dal/story.dal";
import StoryDetail from "@/components/views/app/story-detail";
import { Entity } from "@/types";

export default async function StoryDetailPage({
    params,
}: Readonly<{
    params: Promise<{
        id: string;
        entityType: Entity["type"];
        entityId: string;
    }>;
}>) {
    const { id, entityId, entityType } = await params;
    const entity = await getStoryEntityDetail(id, entityType, entityId);

    console.log("Entity: ", entity);
    return (
        <StoryDetail
            id={id}
            entityId={entityId}
            entityType={entityType}
            entity={entity}
        />
    );
}
