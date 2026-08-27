import { Spinner } from "@/components/ui/spinner";
import { Check, Download, FileText } from "lucide-react";
import {
    Progress,
    ProgressLabel,
    ProgressValue
} from "@/components/ui/progress";
import { TextAnimate } from "@/components/ui/text-animate";

type UploadType = {
    error?: string;
} & (
    | { status: "idle" }
    | { status: "pending" }
    | { status: "staging"; stage: string }
    | { status: "done"; route: string }
);

export function UploadInfo({
    type,
    file,
    progress = 0
}: {
    type: UploadType;
    file?: { name: string; type: string; size: string };
    progress?: number;
}) {
    return (
        <div className="flex flex-col items-center gap-1 text-center">
            {type.status === "idle" && (
                <>
                    <div className="mb-1 text-[#]">
                        <FileText />
                    </div>
                    <p className="flex flex-col">
                        <strong>Drop your PDF file</strong>
                        <span className="link text-primary underline">
                            click to browse
                        </span>
                    </p>
                </>
            )}
            {type.status === "pending" && (
                <>
                    <div className="mb-1 text-[#]">
                        <FileText />
                    </div>
                    <p className="flex flex-col">
                        <strong>{file.name}</strong>
                        <span className="text-sm text-muted-foreground">
                            <span>{file.size}</span>
                            <span className="mx-1">&bull;</span>
                            <span>{file.type}</span>
                        </span>
                        <span className="link text-primary underline">
                            Click to remove
                        </span>
                    </p>
                </>
            )}
            {type.status === "staging" && (
                <>
                    <div className="mb-1 text-[#]">
                        <Spinner />
                    </div>
                    <p className="flex flex-col">
                        <strong>{file.name}</strong>
                        <span className="text-sm text-muted-foreground">
                            <span>{file.size}</span>
                            <span className="mx-1">&bull;</span>
                            <span>{file.type}</span>
                        </span>
                    </p>
                    <p className="shimmer shimmer-color-primary/600">
                        {type.stage}
                    </p>
                </>
            )}
            {type.status === "done" && (
                <>
                    <div className="mb-1 text-[#]">
                        <Check />
                    </div>
                    <p className="flex flex-col">
                        <strong>Processing complete</strong>
                        <span className="text-muted-foreground">
                            {file.name}
                        </span>
                    </p>
                </>
            )}
        </div>
    );
}
