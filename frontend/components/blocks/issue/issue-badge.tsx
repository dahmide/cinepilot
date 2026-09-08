import { Badge } from "@/components/ui/badge";

type IssueType = keyof typeof ISSUE_TYPE_BADGES;
const ISSUE_TYPE_BADGES = {
    prop: {
        label: "PROP CONTINUITY",
        color: "#d97f7f"
    },
    character_detail: {
        label: "CHARACTER DETAIL",
        color: "#F2C230"
    },
    timeline: {
        label: "TIMELINE",
        color: "#c98a56"
    },
    plot_thread: {
        label: "PLOT THREAD",
        color: "#5ec2b7"
    }
} as const;

export function IssueBadge({ issueType }: { issueType: IssueType }) {
    const badge = ISSUE_TYPE_BADGES[issueType];
    return (
        <Badge
            style={{
                color: badge.color,
                backgroundColor: `${badge.color}1A`, // ~10% opacity tint of the same color
                border: `1px solid ${badge.color}40` // ~25% opacity for the border
            }}
        >
            {issueType === "plot_thread" && (
                <span className="opacity-70">✦</span>
            )}
            {badge.label}
        </Badge>
    );
}
